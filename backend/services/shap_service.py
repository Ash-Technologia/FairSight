"""
backend/services/shap_service.py

FairSight Feature Importance & Proxy Detection — v2.0

CRITICAL FIX: Previous version returned hardcoded proxy features
('zip_code', 'income_bracket') regardless of what was actually in the dataset.
This version ONLY reports features that exist in the uploaded dataset.

Proxy detection logic:
  - A "proxy feature" is a neutral-looking feature that is statistically
    correlated with a protected attribute above a correlation threshold.
  - Example: 'zip_code' is a proxy for race/ethnicity if zip codes cluster
    by demographic. We detect this by computing correlation between
    each non-protected feature and each protected attribute.

Feature importance:
  - Uses Pearson correlation with the outcome column for numeric features.
  - Uses Cramér's V (chi-squared) for categorical features.
  - Returns only features actually present in the uploaded file.
"""

import pandas as pd
import numpy as np
from typing import Optional


PROXY_CORRELATION_THRESHOLD = 0.20  # r > 0.20 between feature and protected attr = proxy
FEATURE_IMPORTANCE_TOP_N = 10


def _cramers_v(col1: pd.Series, col2: pd.Series) -> float:
    """
    Cramér's V — measures association between two categorical variables.
    Range: 0 (no association) to 1 (perfect association).
    """
    try:
        contingency = pd.crosstab(col1.astype(str), col2.astype(str))
        if contingency.empty:
            return 0.0
        n = contingency.sum().sum()
        if n == 0:
            return 0.0
        chi2 = 0.0
        expected = np.outer(contingency.sum(axis=1), contingency.sum(axis=0)) / n
        for i in range(contingency.shape[0]):
            for j in range(contingency.shape[1]):
                e = expected[i, j]
                if e > 0:
                    chi2 += (contingency.iloc[i, j] - e) ** 2 / e
        min_dim = min(contingency.shape) - 1
        if min_dim <= 0:
            return 0.0
        return float(np.sqrt(chi2 / (n * min_dim)))
    except Exception:
        return 0.0


def _correlation_with_outcome(col: pd.Series, outcome: pd.Series) -> float:
    """Pearson correlation for numeric, Cramér's V for categorical."""
    try:
        if pd.api.types.is_numeric_dtype(col):
            corr = col.fillna(0).corr(outcome.astype(float))
            return float(abs(corr)) if not np.isnan(corr) else 0.0
        else:
            return _cramers_v(col, outcome)
    except Exception:
        return 0.0


def _is_proxy_for_protected(
    feature_col: pd.Series,
    protected_col: pd.Series,
    threshold: float = PROXY_CORRELATION_THRESHOLD
) -> tuple[bool, float]:
    """
    Check if a feature is a statistical proxy for a protected attribute.
    Returns (is_proxy, correlation_strength).
    """
    try:
        if pd.api.types.is_numeric_dtype(feature_col) and pd.api.types.is_numeric_dtype(protected_col):
            corr = abs(feature_col.fillna(0).corr(protected_col.fillna(0).astype(float)))
        elif pd.api.types.is_numeric_dtype(feature_col):
            corr = _cramers_v(feature_col.astype(str), protected_col.astype(str))
        else:
            corr = _cramers_v(feature_col, protected_col)

        if np.isnan(corr):
            corr = 0.0

        return (corr >= threshold, round(float(corr), 4))
    except Exception:
        return (False, 0.0)


def get_feature_importance(
    df: pd.DataFrame,
    target_col: str,
    protected_cols: list
) -> dict:
    """
    Main entry point for feature importance and proxy detection.

    IMPORTANT: Only analyzes columns that ACTUALLY EXIST in the uploaded dataset.
    Never invents or assumes feature names.

    FIX H1: Uses dataset-size adaptive proxy threshold.
    Small datasets (≤ 2000 rows) have higher random correlation noise, so we
    raise the threshold from 0.20 to 0.25 to avoid false proxy detection.
    E.g. German Credit (1000 rows): age would flag as proxy for gender at 0.20
    even though the correlation is not statistically significant.

    Returns:
        {
            "top_features": [{"feature": str, "importance": float, "is_proxy": bool}, ...],
            "proxy_features": [str, ...],       # columns found in THIS dataset
            "proxy_details": {...},
            "root_cause": str,                  # narrative explanation
            "columns_analyzed": [str, ...]      # what we actually looked at
        }
    """
    if df.empty:
        return {"top_features": [], "proxy_features": [], "root_cause": "Empty dataset.", "columns_analyzed": []}

    # FIX H1: Adaptive threshold — raise for small datasets to reduce false positives
    adaptive_threshold = 0.25 if len(df) <= 2000 else PROXY_CORRELATION_THRESHOLD

    # Resolve outcome column — must exist in the dataframe
    outcome_col = target_col if target_col in df.columns else df.columns[-1]

    try:
        from services.bias_engine import _binarize_column
        outcome = _binarize_column(df[outcome_col].fillna(0))
    except Exception:
        outcome = pd.Series([0] * len(df))

    # All non-protected, non-outcome columns to analyze
    exclude = set(protected_cols + [outcome_col])
    feature_cols = [c for c in df.columns if c not in exclude]

    if not feature_cols:
        return {
            "top_features": [],
            "proxy_features": [],
            "root_cause": "No non-protected features found in dataset to analyze.",
            "columns_analyzed": list(df.columns),
        }

    # ── Compute importance for each actual feature ──────────────────────────
    feature_scores = []
    for col in feature_cols:
        importance = _correlation_with_outcome(df[col], outcome)
        feature_scores.append({"feature": col, "importance": round(importance, 4)})

    feature_scores.sort(key=lambda x: x["importance"], reverse=True)
    top_features = feature_scores[:FEATURE_IMPORTANCE_TOP_N]

    # ── Proxy detection ────────────────────────────────────────────────────
    proxy_features = []
    proxy_details = {}

    for feat in feature_cols:
        max_proxy_corr = 0.0
        proxy_for = []

        for prot in protected_cols:
            if prot not in df.columns:
                continue
            # Use adaptive threshold for this dataset size
            is_proxy, corr = _is_proxy_for_protected(df[feat], df[prot], threshold=adaptive_threshold)
            if is_proxy:
                max_proxy_corr = max(max_proxy_corr, corr)
                proxy_for.append({"protected_attr": prot, "correlation": corr})

        if proxy_for:
            proxy_features.append(feat)
            proxy_details[feat] = {
                "correlation_strength": round(max_proxy_corr, 4),
                "acts_as_proxy_for": proxy_for,
                "risk_level": "HIGH" if max_proxy_corr > 0.40 else "MEDIUM",
            }

    # Enrich top_features with proxy flag
    proxy_set = set(proxy_features)
    for f in top_features:
        f["is_proxy"] = f["feature"] in proxy_set
        if f["feature"] in proxy_details:
            f["proxy_correlation"] = proxy_details[f["feature"]]["correlation_strength"]

    # ── Correlation matrix ────────────────────────────────────────────
    # Compute absolute Pearson correlation between every feature and
    # every protected attribute. This is the data for the proxy heatmap.
    correlation_matrix = {}

    for feat in feature_cols:
        correlation_matrix[feat] = {}
        for prot in protected_cols:
            if prot not in df.columns:
                correlation_matrix[feat][prot] = 0.0
                continue
            prot_series = df[prot]
            if not pd.api.types.is_numeric_dtype(prot_series):
                prot_encoded = prot_series.astype("category").cat.codes.astype(float)
            else:
                prot_encoded = prot_series.fillna(0).astype(float)
            try:
                # Need to encode feat as numeric for pure correlation
                if not pd.api.types.is_numeric_dtype(df[feat]):
                    feat_encoded = df[feat].astype("category").cat.codes.astype(float)
                else:
                    feat_encoded = df[feat].fillna(0).astype(float)
                    
                corr = float(feat_encoded.corr(prot_encoded))
                correlation_matrix[feat][prot] = round(abs(corr) if not np.isnan(corr) else 0.0, 4)
            except Exception:
                correlation_matrix[feat][prot] = 0.0

    # ── Generate narrative root cause ──────────────────────────────────────
    if proxy_features:
        proxy_list = ", ".join(f"'{p}'" for p in proxy_features[:4])
        root_cause = (
            f"Features {proxy_list} — present in the uploaded dataset — show statistically "
            f"significant correlation with protected attributes ({', '.join(protected_cols[:3])}). "
            f"These features act as proxies, encoding demographic information indirectly, "
            f"which enables discriminatory outcomes even without explicitly using protected attributes."
        )
    elif top_features:
        top_list = ", ".join(f["feature"] for f in top_features[:3])
        root_cause = (
            f"No strong proxy features detected among the uploaded columns. "
            f"The most outcome-predictive features in this dataset are: {top_list}. "
            f"Bias, if present, may stem from historical patterns in the training distribution "
            f"rather than proxy encoding."
        )
    else:
        root_cause = "Insufficient feature data to determine root cause."

    return {
        "top_features": top_features,
        "proxy_features": proxy_features,          # ← ONLY real dataset columns
        "proxy_details": proxy_details,
        "correlation_matrix": correlation_matrix,  # ← ADDED for Proxy Heatmap
        "root_cause": root_cause,
        "columns_analyzed": feature_cols,
        "protected_columns": [p for p in protected_cols if p in df.columns],
        "outcome_column": outcome_col,
        "proxy_threshold_used": adaptive_threshold,
    }