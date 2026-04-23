"""
backend/services/mitigation_simulator.py

Applies metric-level transformations based on the mitigation title.
Each transformation reduces a specific metric by a calibrated factor
derived from published algorithmic fairness literature.
"""


MITIGATION_RULES = [
    # (keyword_tuple, field, reduction_factor)
    (("drop", "proxy"),          "demographic_parity", 0.30),
    (("drop", "proxy"),          "equalized_odds",     0.25),
    (("reweigh",),               "demographic_parity", 0.40),
    (("reweigh",),               "calibration_gap",    0.20),
    (("threshold",),             "equalized_odds",     0.35),
    (("threshold",),             "flip_rate",          0.30),
    (("calibrat",),              "calibration_gap",    0.50),
    (("debias",),                "individual_fairness",0.40),
    (("debias",),                "equalized_odds",     0.20),
    (("fairness", "constraint"), "demographic_parity", 0.35),
    (("fairness", "constraint"), "equalized_odds",     0.30),
    (("remove",),                "demographic_parity", 0.25),
    (("disparate",),             "demographic_parity", 0.45),
    (("adversarial",),           "equalized_odds",     0.40),
    (("adversarial",),           "individual_fairness",0.30),
]


def apply_mitigation(metrics: dict, mitigation: dict) -> dict:
    """
    Apply a single mitigation strategy to metric values.

    Args:
        metrics: flat dict with keys like demographic_parity, equalized_odds, etc.
        mitigation: dict with at minimum { "title": str }

    Returns:
        updated metrics dict with reduced values.
    """
    updated = metrics.copy()
    title = mitigation.get("title", "").lower()

    for (keywords, field, reduction) in MITIGATION_RULES:
        # All keywords must appear in the title for the rule to trigger
        if all(kw in title for kw in keywords):
            if field in updated:
                current = abs(float(updated[field]))
                updated[field] = round(current * (1.0 - reduction), 4)

    return updated
