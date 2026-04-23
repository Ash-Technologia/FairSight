# backend/services/debias_engine.py
# ═══════════════════════════════════════════════════════════════════
# IBM Reweighing Algorithm
# Source: Kamiran & Calders (2012). "Data preprocessing techniques for
#         classification without discrimination." Knowledge and Information Systems.
# ═══════════════════════════════════════════════════════════════════

import pandas as pd
import numpy as np
from typing import Any

def compute_reweighing_weights(
    df: pd.DataFrame,
    protected_col: str,
    label_col: str,
    privileged_group: str,
) -> np.ndarray:
    n = len(df)
    weights = np.ones(n, dtype=float)

    # Assuming binarized already in run_debiasing
    label_series = df[label_col].astype(int)
    group_series = df[protected_col].astype(str)

    groups = group_series.unique()
    labels = [0, 1]

    for grp in groups:
        for lbl in labels:
            grp_mask   = group_series == grp
            label_mask = label_series == lbl
            both_mask  = grp_mask & label_mask

            p_group = grp_mask.sum() / n            # P(group)
            p_label = label_mask.sum() / n          # P(label)
            p_both  = both_mask.sum() / n           # P(group AND label)

            if p_both == 0:
                continue

            weight = (p_group * p_label) / p_both
            weights[both_mask] = weight

    # Normalize so mean weight = 1.0 (preserves dataset scale)
    weights = weights / weights.mean()
    return weights

def run_debiasing(
    df: pd.DataFrame,
    protected_cols: list[str],
    label_col: str,
    target_col: str,
) -> dict[str, Any]:
    from services.bias_engine import run_bias_analysis, _binarize_column

    # Determine which protected attribute has the highest DP gap
    valid_protected = [c for c in protected_cols if c in df.columns]
    if not valid_protected:
        raise ValueError("No valid protected columns found in dataset")

    metrics = run_bias_analysis(df, valid_protected, target_col, label_col)
    by_attr = metrics.get("by_attribute", {})

    # Pick attribute with highest demographic parity gap
    primary_attr = max(
        (a for a in valid_protected if a in by_attr),
        key=lambda a: by_attr[a].get("demographic_parity", 0),
        default=valid_protected[0],
    )

    attr_metrics   = by_attr.get(primary_attr, {})
    privileged_grp = attr_metrics.get("reference_group", "")

    if not privileged_grp:
        # Fallback: find group with highest approval rate
        approval_rates = attr_metrics.get("approval_rates", {})
        if approval_rates:
            privileged_grp = max(approval_rates, key=approval_rates.get)
        else:
            privileged_grp = str(df[primary_attr].mode()[0])

    # Binarize label column
    label_binary = _binarize_column(df[label_col])
    df_work = df.copy()
    df_work["__label_binary__"] = label_binary

    # Compute weights
    weights = compute_reweighing_weights(
        df_work,
        protected_col=primary_attr,
        label_col="__label_binary__",
        privileged_group=privileged_grp,
    )
    df_work = df_work.drop(columns=["__label_binary__"])

    # Add weight column — round to 6 decimal places for clean CSV output
    df_work["sample_weight"] = np.round(weights, 6)

    # Compute projected post-debiasing metrics (approximate)
    weighted_approval = {}
    groups = df_work[primary_attr].astype(str).unique()
    for grp in groups:
        mask = df_work[primary_attr].astype(str) == grp
        grp_weights = weights[mask]
        grp_labels  = label_binary[mask]
        if grp_weights.sum() > 0:
            weighted_approval[grp] = float(
                (grp_labels * grp_weights).sum() / grp_weights.sum()
            )

    projected_dp_gap = (
        max(weighted_approval.values()) - min(weighted_approval.values())
        if len(weighted_approval) >= 2 else 0.0
    )

    # Projected fairness score improvement
    current_score = metrics.get("fairness_score", 50)
    current_dp    = metrics.get("avg_demographic_parity", 0.1)
    improvement   = max(0, (attr_metrics.get("demographic_parity", 0) - projected_dp_gap) * 300)
    projected_score = min(98, round(current_score + improvement))

    return {
        "debiased_df":       df_work,
        "primary_attribute": primary_attr,
        "privileged_group":  privileged_grp,
        "weight_stats": {
            "min":  round(float(weights.min()), 4),
            "max":  round(float(weights.max()), 4),
            "mean": round(float(weights.mean()), 4),
            "std":  round(float(weights.std()), 4),
        },
        "rows_upweighted":   int((weights > 1.05).sum()),
        "rows_downweighted": int((weights < 0.95).sum()),
        "current_fairness_score":   current_score,
        "projected_fairness_score": projected_score,
        "current_dp_gap":    round(float(attr_metrics.get("demographic_parity", 0)), 4),
        "projected_dp_gap":  round(float(projected_dp_gap), 4),
        "algorithm":         "IBM Reweighing (Kamiran & Calders, 2012)",
        "citation":          "Kamiran, F., & Calders, T. (2012). Data preprocessing techniques for classification without discrimination. KAIS.",
    }
