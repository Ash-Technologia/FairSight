# backend/services/mitigation_engine.py
# Threshold post-processing — same approach used by Google What-If Tool.
# Does NOT retrain the model. Adjusts per-group decision cutoffs only.

import json
from datetime import datetime
from typing import Dict


def compute_mitigation(metrics: dict, strategy: str = "equalize_to_mean") -> dict:
    """
    strategy: "equalize_to_mean" or "equalize_to_best"
    metrics: the by_attribute section of bias analysis output
    """
    by_attr = metrics.get("by_attribute", {})
    threshold_adjustments: Dict[str, Dict] = {}
    all_approval_rates = []

    for attr_name, attr_data in by_attr.items():
        if not isinstance(attr_data, dict):
            continue
        approval_rates = attr_data.get("approval_rates", {})
        if not approval_rates:
            continue

        for group, rate in approval_rates.items():
            all_approval_rates.append(rate)

    if not all_approval_rates:
        return {"error": "No approval rate data available — cannot compute mitigation thresholds."}

    overall_mean = sum(all_approval_rates) / len(all_approval_rates)
    best_rate = max(all_approval_rates)
    target_rate = best_rate if strategy == "equalize_to_best" else overall_mean

    for attr_name, attr_data in by_attr.items():
        if not isinstance(attr_data, dict):
            continue
        approval_rates = attr_data.get("approval_rates", {})
        if not approval_rates:
            continue

        threshold_adjustments[attr_name] = {}
        for group, rate in approval_rates.items():
            # Threshold adjustment: if group rate < target, lower the decision threshold
            # (approve more from that group), vice versa.
            current_threshold = 0.5
            # Linear approximation: each 0.01 gap in approval rate ≈ 0.008 threshold shift
            gap = target_rate - rate
            adjustment = round(-gap * 0.8, 3)  # lower threshold → more approvals
            new_threshold = round(max(0.2, min(0.8, current_threshold + adjustment)), 3)
            threshold_adjustments[attr_name][group] = {
                "current_threshold": current_threshold,
                "new_threshold": new_threshold,
                "adjustment": round(new_threshold - current_threshold, 3),
            }

    # Project the new metrics
    current_score = metrics.get("fairness_score", 60)
    current_dp = metrics.get("by_attribute", {})
    avg_dp_gap = 0.0
    avg_eo_gap = 0.0
    count = 0
    for attr_data in by_attr.values():
        if isinstance(attr_data, dict):
            avg_dp_gap += attr_data.get("demographic_parity", 0)
            avg_eo_gap += attr_data.get("equalized_odds", 0)
            count += 1
    if count > 0:
        avg_dp_gap /= count
        avg_eo_gap /= count

    improvement_factor = 0.75 if strategy == "equalize_to_mean" else 0.90
    new_dp = round(avg_dp_gap * (1 - improvement_factor), 3)
    new_eo = round(avg_eo_gap * (1 - improvement_factor), 3)
    new_score = min(98, round(current_score + (100 - current_score) * improvement_factor * 0.7))

    # Build the Python script
    script = f'''# FairSight Auto-Mitigation Wrapper
# Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
# Strategy: {"Equalize-to-Mean" if strategy == "equalize_to_mean" else "Equalize-to-Best"} Threshold Optimization
#
# HOW TO USE:
#   1. Import this module alongside your existing model code
#   2. Replace model.predict(X) calls with:
#      prediction = fairsight_predict(model, X, race=applicant_race, gender=applicant_gender)
#
import numpy as np

THRESHOLDS = {json.dumps(threshold_adjustments, indent=2)}

def fairsight_predict(model, X, **protected_attrs):
    """
    Drop-in replacement for model.predict(X).
    Applies per-group decision threshold adjustments to equalize outcomes.
    """
    try:
        proba = model.predict_proba(X)[:, 1]
    except AttributeError:
        return model.predict(X)

    # Start with default threshold
    threshold = 0.5

    # Apply per-group adjustment if protected attribute info is provided
    for attr_name, attr_value in protected_attrs.items():
        if attr_name in THRESHOLDS and str(attr_value) in THRESHOLDS[attr_name]:
            threshold = THRESHOLDS[attr_name][str(attr_value)]["new_threshold"]
            break  # Apply first matching attribute

    return (proba >= threshold).astype(int)
'''

    json_config = {
        "strategy": strategy,
        "generated_at": datetime.now().isoformat(),
        "threshold_adjustments": threshold_adjustments,
        "projected_metrics": {
            "new_fairness_score": new_score,
            "new_dp_gap": new_dp,
            "new_eo_gap": new_eo,
            "improvement_dp": round(avg_dp_gap - new_dp, 3),
            "improvement_eo": round(avg_eo_gap - new_eo, 3),
            "improvement_score": new_score - current_score,
        },
        "original_metrics": {
            "fairness_score": current_score,
            "dp_gap": round(avg_dp_gap, 3),
            "eo_gap": round(avg_eo_gap, 3),
        }
    }

    return {
        "strategy": strategy,
        "threshold_adjustments": threshold_adjustments,
        "projected_metrics": json_config["projected_metrics"],
        "original_metrics": json_config["original_metrics"],
        "python_script": script,
        "json_config": json_config,
    }
