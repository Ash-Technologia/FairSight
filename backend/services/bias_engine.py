import pandas as pd
import numpy as np

# ── Industry-grade thresholds (aligned with IBM AIF360 / EU AI Act) ──
DP_THRESHOLD             = 0.10   # Demographic Parity gap
EO_THRESHOLD             = 0.10   # Equalized Odds gap
CALIBRATION_THRESHOLD    = 0.05
DISPARATE_IMPACT_MIN     = 0.80   # 80% rule (US EEOC standard)
INDIVIDUAL_FAIRNESS_THRESHOLD = 0.15


def _safe_rate(series):
    if len(series) == 0:
        return 0.0
    return float(series.mean())


def _binarize_column(col):
    if col.dtype == bool:
        return col.astype(int)

    if pd.api.types.is_numeric_dtype(col):
        unique_vals = set(col.dropna().unique())
        if unique_vals.issubset({0, 1}) or unique_vals.issubset({0.0, 1.0}):
            return col.astype(int)
        # FIX H4: Apply median threshold binarization for continuous scores (0.73, 0.21…)
        # instead of raising ValueError, which was silently caught by the router and
        # fell back to fairness_score=100/CLEAR for every real dataset.
        # Median split is audit-grade — used by IBM AIF360 and Google What-If Tool.
        median = col.median()
        return (col >= median).astype(int)

    positive = {
        "1", "yes", "true", "approved", "hired",
        "pass", "accepted", "granted", "positive",
        "selected", "offer", "loan_approved",
    }
    return col.astype(str).str.lower().map(
        lambda x: 1 if x in positive else 0
    )


def _compute_attribute_metrics(df, attr, prediction, label):
    groups = df[attr].dropna().unique()

    # Improvement #1: need at least two groups to compute any gap metric.
    # A single-group column (e.g. gender=Male only) has no comparison point
    # and would produce all-zero gaps, giving a misleadingly clean result.
    if len(groups) < 2:
        return None

    approval_rates  = {}
    tpr_by_group    = {}
    fpr_by_group    = {}
    group_accuracy  = {}

    for g in groups:
        mask = df[attr] == g
        pred = prediction[mask]
        true = label[mask]

        approval_rates[str(g)] = _safe_rate(pred)

        positives = true == 1
        negatives = true == 0

        tpr_by_group[str(g)] = _safe_rate(pred[positives])
        fpr_by_group[str(g)] = _safe_rate(pred[negatives])

        if len(pred) > 0:
            group_accuracy[str(g)] = round(float((pred == true).mean()), 4)

    if not approval_rates:
        return None

    ref_group = max(approval_rates, key=approval_rates.get)
    min_group = min(approval_rates, key=approval_rates.get)

    ref_rate = approval_rates[ref_group]
    min_rate = approval_rates[min_group]

    # ── Demographic Parity ────────────────────────────────────────
    dp_gap   = abs(ref_rate - min_rate)
    di_ratio = (min_rate / ref_rate) if ref_rate > 0 else 1.0

    # ── Equalized Odds: max of TPR gap and FPR gap ────────────────
    ref_tpr  = tpr_by_group.get(ref_group, 0.0)
    min_tpr  = tpr_by_group.get(min_group, 0.0)
    eo_gap   = abs(ref_tpr - min_tpr)

    ref_fpr  = fpr_by_group.get(ref_group, 0.0)
    min_fpr  = fpr_by_group.get(min_group, 0.0)
    fpr_gap  = abs(ref_fpr - min_fpr)

    full_eo_gap = max(eo_gap, fpr_gap)

    # ── Calibration ───────────────────────────────────────────────
    if "model_confidence" in df.columns:
        calibration_gap = abs(
            df[df[attr] == ref_group]["model_confidence"].mean()
            - df[df[attr] == min_group]["model_confidence"].mean()
        )
    else:
        # FIX: use abs difference between best/worst group rates,
        # not std — std measures dispersion, not calibration gap.
        calibration_gap = abs(ref_rate - min_rate)

    # ── Individual fairness ───────────────────────────────────────
    individual_fairness_gap = max(approval_rates.values()) - min(approval_rates.values())

    # ── Bias flag ─────────────────────────────────────────────────
    is_biased = (
        dp_gap         > DP_THRESHOLD
        or full_eo_gap > EO_THRESHOLD
        or di_ratio    < DISPARATE_IMPACT_MIN
        or individual_fairness_gap > INDIVIDUAL_FAIRNESS_THRESHOLD
    )

    return {
        "demographic_parity":        round(dp_gap, 4),
        "equalized_odds":            round(full_eo_gap, 4),
        "tpr_gap":                   round(eo_gap, 4),
        "fpr_gap":                   round(fpr_gap, 4),
        "approval_rates":            approval_rates,
        "tpr_by_group":              tpr_by_group,
        "fpr_by_group":              fpr_by_group,
        "group_accuracy":            group_accuracy,
        "individual_fairness":       round(individual_fairness_gap, 4),
        "calibration_gap":           round(calibration_gap, 4),
        "disparate_impact_ratio":    round(di_ratio, 4),
        "reference_group":           ref_group,
        "most_disadvantaged_group":  min_group,
        "is_biased":                 bool(is_biased),
        "dp_exceeds_threshold":      dp_gap         > DP_THRESHOLD,
        "eo_exceeds_threshold":      full_eo_gap    > EO_THRESHOLD,
        "di_below_threshold":        di_ratio       < DISPARATE_IMPACT_MIN,
    }


def _compute_fairness_score(by_attribute: dict, flip_rate: float = 0.0) -> int:
    """
    FIX L2: Uses weighted-sum of ALL penalties per attribute, then averages
    across attributes. Previously used max() per attribute before averaging,
    which over-penalized borderline violations (race DP=0.11 got same penalty
    as DP=0.40). Weighted sum gives proportional, accurate scores.

    Accepts flip_rate and deducts graded penalty for counterfactual discrimination.
    """
    if not by_attribute:
        return 100

    attribute_penalties = []

    for metrics in by_attribute.values():
        dp   = metrics["demographic_parity"]
        eo   = metrics["equalized_odds"]
        cal  = metrics["calibration_gap"]
        ind  = metrics["individual_fairness"]
        di   = metrics["disparate_impact_ratio"]

        dp_pen  = min(dp  / DP_THRESHOLD,                  3) * 20
        eo_pen  = min(eo  / EO_THRESHOLD,                  3) * 20
        cal_pen = min(cal / CALIBRATION_THRESHOLD,         3) * 8
        ind_pen = min(ind / INDIVIDUAL_FAIRNESS_THRESHOLD, 3) * 12
        di_pen  = max(0, (DISPARATE_IMPACT_MIN - di) / DISPARATE_IMPACT_MIN) * 20

        # FIX L2: Sum all penalties for the attribute (not max).
        # Cap the combined penalty at 60 so a single attribute never zeroes the score.
        combined = min(60, dp_pen + eo_pen + cal_pen + ind_pen + di_pen)
        attribute_penalties.append(combined)

    avg_penalty = sum(attribute_penalties) / len(attribute_penalties)
    base_score = 100 - avg_penalty

    # Graded flip penalty — partial discrimination is scored proportionally
    if flip_rate > 0.30:
        flip_penalty = 20
    elif flip_rate > 0.20:
        flip_penalty = 15
    elif flip_rate > 0.10:
        flip_penalty = 8
    else:
        flip_penalty = 0

    return max(10, min(98, round(base_score - flip_penalty)))


def _determine_verdict(by_attribute: dict, fairness_score: int):
    """
    Verdict aligned with EU AI Act + US EEOC 80% rule.
    Any single severe metric violation forces GUILTY.
    """
    if not by_attribute:
        return "CLEAR", "LOW"

    any_critical_dp = any(v["demographic_parity"] > 0.20       for v in by_attribute.values())
    any_critical_eo = any(v["equalized_odds"]      > 0.30       for v in by_attribute.values())
    any_di_fail     = any(v["disparate_impact_ratio"] < DISPARATE_IMPACT_MIN for v in by_attribute.values())
    violations      = sum(1 for v in by_attribute.values() if v["is_biased"])
    total           = len(by_attribute)

    # Hard overrides — severe single metric forces CRITICAL
    if any_critical_eo or (any_critical_dp and any_di_fail):
        return "GUILTY", "CRITICAL"

    if fairness_score < 40:
        return "GUILTY", "CRITICAL"

    if fairness_score < 60 or (violations == total and total > 0):
        return "GUILTY", "HIGH"

    if fairness_score < 75 or violations > 0:
        return "GUILTY", "MEDIUM"

    if fairness_score < 85:
        return "BORDERLINE", "LOW"

    return "CLEAR", "LOW"


def run_bias_analysis(
    df: pd.DataFrame,
    protected_cols: list,
    target_col: str,
    label_col: str,
    flip_rate: float = 0.0,       # FIX: accept flip_rate from router
) -> dict:
    # FIX: guard against empty protected columns before doing any work,
    # prevents false CLEAR verdicts when no valid attributes are found.
    if not protected_cols:
        return {"error": "No protected attributes found in dataset."}

    try:
        prediction = _binarize_column(df[target_col])
    except ValueError as e:
        raise ValueError(f"Prediction column error: {e}")

    try:
        label = _binarize_column(df[label_col])
    except ValueError as e:
        raise ValueError(f"Label column error: {e}")

    valid_protected = [c for c in protected_cols if c in df.columns]

    if not valid_protected:
        return {"error": "No protected attributes found in dataset."}

    by_attribute: dict = {}

    for col in valid_protected:
        result = _compute_attribute_metrics(df, col, prediction, label)
        if result:
            by_attribute[col] = result

    # FIX: pass flip_rate into score so counterfactual signal is not orphaned
    fairness_score = _compute_fairness_score(by_attribute, flip_rate=flip_rate)
    verdict, severity = _determine_verdict(by_attribute, fairness_score)

    return {
        "by_attribute":               by_attribute,
        "fairness_score":             fairness_score,
        "overall_verdict":            verdict,
        "bias_severity":              severity,
        "protected_columns_analyzed": valid_protected,
        "total_rows":                 len(df),
    }