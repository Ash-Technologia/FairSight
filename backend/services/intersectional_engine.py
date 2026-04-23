# backend/services/intersectional_engine.py
# Computes approval rates for every combination of protected attributes.
# Implements Crenshaw (1989) intersectionality framework.

import itertools
import pandas as pd
from typing import List


def compute_intersectional_metrics(df: pd.DataFrame, protected_cols: List[str], target_col: str) -> dict:
    """
    For every combination of values across protected_cols, compute the approval rate.
    Only includes intersections with sample_size >= 10.
    """
    if len(protected_cols) < 2:
        return {"intersections": [], "most_disadvantaged": None, "least_disadvantaged": None,
                "intersectional_gap": 0.0, "reference_rate": 0.0, "note": "Requires ≥2 protected attributes"}

    # Normalize target column to binary
    unique_vals = df[target_col].dropna().unique()
    positive_val = None
    for v in unique_vals:
        sv = str(v).strip().upper()
        if sv in ('1', 'TRUE', 'APPROVED', 'YES', 'GUILTY', 'POSITIVE'):
            positive_val = v
            break
    if positive_val is None and len(unique_vals) > 0:
        positive_val = unique_vals[0]

    results = []
    # Get unique values per protected col (limited to 6 per col to avoid explosion)
    col_values = []
    for col in protected_cols:
        if col in df.columns:
            vals = df[col].dropna().unique().tolist()[:6]
            col_values.append((col, vals))

    if len(col_values) < 2:
        return {"intersections": [], "most_disadvantaged": None, "least_disadvantaged": None,
                "intersectional_gap": 0.0, "reference_rate": 0.0}

    # Compute for pairs of protected columns (first 2 for manageability)
    col1, vals1 = col_values[0]
    col2, vals2 = col_values[1]

    for v1, v2 in itertools.product(vals1, vals2):
        mask = (df[col1] == v1) & (df[col2] == v2)
        subset = df[mask]
        n = len(subset)
        if n < 10:
            continue
        try:
            approval_rate = float((subset[target_col] == positive_val).sum()) / n
        except Exception:
            continue
        label = f"{str(v1).title()} {str(v2).title()}"
        results.append({
            "label": label,
            "col1": col1, "val1": str(v1),
            "col2": col2, "val2": str(v2),
            "approval_rate": round(approval_rate, 4),
            "sample_size": n,
        })

    if not results:
        return {"intersections": [], "most_disadvantaged": None, "least_disadvantaged": None,
                "intersectional_gap": 0.0, "reference_rate": 0.0}

    # Compute disparity from best
    best_rate = max(r["approval_rate"] for r in results)
    worst_rate = min(r["approval_rate"] for r in results)
    for r in results:
        r["disparity_from_best"] = round(best_rate - r["approval_rate"], 4)
        r["is_biased"] = r["disparity_from_best"] > 0.10

    results.sort(key=lambda x: x["approval_rate"])

    most_disadvantaged = results[0]["label"] if results else None
    least_disadvantaged = results[-1]["label"] if results else None

    return {
        "intersections": results,
        "most_disadvantaged": most_disadvantaged,
        "least_disadvantaged": least_disadvantaged,
        "intersectional_gap": round(best_rate - worst_rate, 4),
        "reference_rate": round(best_rate, 4),
    }
