"""
backend/services/score_simulator.py

Simulation pipeline:
  1. Apply each mitigation sequentially (metrics reduce cumulatively)
  2. Recompute the composite fairness score from reduced metrics
  3. Recompute verdict and severity from new score
  4. Return projected_metrics, projected_score, projected_verdict, delta
"""

from services.mitigation_simulator import apply_mitigation


# ── Scoring weights (must sum to 100) ────────────────────────────────────────
WEIGHTS = {
    "demographic_parity":  30,
    "equalized_odds":      30,
    "calibration_gap":     15,
    "individual_fairness": 15,
    "flip_rate":           10,
}

# Thresholds at which penalty begins
THRESHOLDS = {
    "demographic_parity":  0.10,
    "equalized_odds":      0.10,
    "calibration_gap":     0.05,
    "individual_fairness": 0.15,
    "flip_rate":           0.10,
}


def recompute_fairness_score(metrics: dict) -> float:
    """
    Compute a 0–100 fairness score from flat metric values.
    Uses a weighted penalty model — each metric contributes up to its weight in penalty points.
    """
    total_penalty = 0.0

    for field, weight in WEIGHTS.items():
        value = abs(float(metrics.get(field, 0.0)))
        threshold = THRESHOLDS[field]
        if value > threshold:
            # Penalty scales from 0 at threshold to full weight at 3× threshold
            excess = (value - threshold) / threshold
            penalty = min(excess / 2.0, 1.0) * weight
            total_penalty += penalty

    raw = 100.0 - total_penalty
    return max(0.0, min(100.0, round(raw, 2)))


def _verdict_from_score(score: float) -> tuple[str, str]:
    if score < 40:
        return "GUILTY", "CRITICAL"
    if score < 60:
        return "GUILTY", "HIGH"
    if score < 75:
        return "GUILTY", "MEDIUM"
    if score < 85:
        return "BORDERLINE", "LOW"
    return "CLEAR", "LOW"


def simulate_score(metrics: dict, mitigations: list) -> dict:
    """
    Sequentially apply mitigations and recompute the fairness score.

    Args:
        metrics:     Flat metric dict (demographic_parity, equalized_odds, etc.)
        mitigations: List of mitigation dicts, each with at minimum { "title": str }

    Returns:
        {
            "projected_metrics":  { field: new_value, ... },
            "projected_score":    float,
            "projected_verdict":  "GUILTY" | "BORDERLINE" | "CLEAR",
            "projected_severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
            "original_score":     float,
            "delta":              float,               # positive = improvement
            "metric_deltas":      { field: reduction_pct, ... },
            "mitigations_applied": int,
        }
    """
    original_score = recompute_fairness_score(metrics)
    simulated = metrics.copy()

    for m in mitigations:
        simulated = apply_mitigation(simulated, m)

    new_score = recompute_fairness_score(simulated)
    verdict, severity = _verdict_from_score(new_score)

    # Per-metric delta (percentage reduction)
    metric_deltas = {}
    for field in WEIGHTS:
        orig = abs(float(metrics.get(field, 0.0)))
        new  = abs(float(simulated.get(field, 0.0)))
        if orig > 0:
            metric_deltas[field] = round((orig - new) / orig * 100, 1)
        else:
            metric_deltas[field] = 0.0

    return {
        "projected_metrics":   simulated,
        "projected_score":     new_score,
        "projected_verdict":   verdict,
        "projected_severity":  severity,
        "original_score":      original_score,
        "delta":               round(new_score - original_score, 2),
        "metric_deltas":       metric_deltas,
        "mitigations_applied": len(mitigations),
    }
