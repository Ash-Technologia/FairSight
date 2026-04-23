# backend/services/preflight_engine.py
# Scans a raw dataset for representation, label noise, and proxy feature issues BEFORE training.

import pandas as pd
import numpy as np
from typing import List


def run_preflight_scan(df: pd.DataFrame, protected_cols: List[str], label_col: str) -> dict:
    n_total = len(df)
    scans = {}
    fixes = []

    # ─── SCAN 1: Representation Balance ───────────────────────────────────────
    rep_issues = []
    rep_per_group = {}
    rep_scores = []

    for col in protected_cols:
        if col not in df.columns:
            continue
        counts = df[col].value_counts()
        proportions = (counts / n_total).to_dict()
        rep_per_group[col] = {str(k): {"count": int(v), "proportion": round(proportions[k], 3)} for k, v in counts.items()}

        # Flag if any group < 10% or < 30 samples
        for grp, cnt in counts.items():
            prop = proportions[grp]
            if prop < 0.10:
                rep_issues.append(f"Group '{grp}' in '{col}' is underrepresented: only {prop:.1%} of dataset")
                fixes.append({"issue": f"Underrepresented group: {col}={grp} ({prop:.1%})", "fix": f"Oversample '{grp}' group using SMOTE or collect more data for this demographic.", "priority": "HIGH"})
            if cnt < 30:
                rep_issues.append(f"Group '{grp}' in '{col}' has only {cnt} samples — too few for statistical reliability")
                fixes.append({"issue": f"Insufficient samples: {col}={grp} (n={cnt})", "fix": f"Collect at least 30 samples for '{grp}' before training.", "priority": "HIGH"})

        props_arr = np.array(list(proportions.values()))
        std_dev = float(np.std(props_arr))
        score = max(0, min(100, round(100 - std_dev * 200)))
        rep_scores.append(score)

    rep_score = round(sum(rep_scores) / len(rep_scores)) if rep_scores else 50

    scans["representation"] = {
        "score": rep_score,
        "status": "CLEAN" if rep_score >= 75 else ("CAUTION" if rep_score >= 55 else "BIASED"),
        "issues": rep_issues,
        "per_group": rep_per_group,
    }

    # ─── SCAN 2: Label Noise / Historical Bias ────────────────────────────────
    label_issues = []
    label_per_attr = {}
    label_scores = []

    if label_col in df.columns:
        unique_label_vals = df[label_col].dropna().unique()
        positive_val = None
        for v in unique_label_vals:
            if str(v).strip().upper() in ('1', 'TRUE', 'APPROVED', 'YES', 'POSITIVE'):
                positive_val = v
                break
        if positive_val is None and len(unique_label_vals) > 0:
            positive_val = unique_label_vals[0]

        for col in protected_cols:
            if col not in df.columns:
                continue
            label_rates = {}
            for grp in df[col].dropna().unique():
                subset = df[df[col] == grp]
                if len(subset) < 5:
                    continue
                rate = float((subset[label_col] == positive_val).sum()) / len(subset)
                label_rates[str(grp)] = round(rate, 3)

            label_per_attr[col] = label_rates
            if label_rates:
                rates = list(label_rates.values())
                gap = max(rates) - min(rates)
                if gap > 0.10:
                    worst_grp = min(label_rates, key=label_rates.get)
                    best_grp = max(label_rates, key=label_rates.get)
                    label_issues.append(f"Label rate gap in '{col}': {best_grp}={max(rates):.1%}, {worst_grp}={min(rates):.1%} (gap={gap:.1%})")
                    fixes.append({"issue": f"Historical label bias in {col} (gap={gap:.1%})", "fix": f"Review labelling process for '{col}'. Consider re-labelling with blind assessors or applying label-smoothing.", "priority": "HIGH" if gap > 0.20 else "MEDIUM"})
                score = max(0, min(100, round(100 - gap * 400)))
                label_scores.append(score)

    label_score = round(sum(label_scores) / len(label_scores)) if label_scores else 80

    scans["label_noise"] = {
        "score": label_score,
        "status": "CLEAN" if label_score >= 75 else ("CAUTION" if label_score >= 55 else "BIASED"),
        "issues": label_issues,
        "per_attribute": label_per_attr,
    }

    # ─── SCAN 3: Proxy Feature Density ────────────────────────────────────────
    proxy_features = []
    non_proxy_features = []
    proxy_issues = []

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    feature_cols = [c for c in numeric_cols if c not in protected_cols and c != label_col]

    if feature_cols and protected_cols:
        for feat in feature_cols:
            is_proxy = False
            for pcol in protected_cols:
                if pcol not in df.columns:
                    continue
                try:
                    # Encode protected col as numeric for correlation
                    encoded = pd.Categorical(df[pcol]).codes
                    if len(encoded) == len(df[feat].fillna(0)):
                        corr = abs(float(np.corrcoef(df[feat].fillna(0), encoded)[0, 1]))
                        if corr > 0.15:
                            is_proxy = True
                            proxy_issues.append(f"'{feat}' correlates with '{pcol}' (r={corr:.2f}) — potential proxy")
                            fixes.append({"issue": f"Proxy feature: {feat} → {pcol} (r={corr:.2f})", "fix": f"Remove or decorrelate '{feat}' before training. Consider adversarial debiasing.", "priority": "MEDIUM"})
                except Exception:
                    pass
            if is_proxy:
                proxy_features.append(feat)
            else:
                non_proxy_features.append(feat)

    total_feats = len(feature_cols) if feature_cols else 1
    proxy_density = len(proxy_features) / total_feats
    proxy_score = max(0, min(100, round(100 - proxy_density * 100)))

    scans["proxy_density"] = {
        "score": proxy_score,
        "status": "CLEAN" if proxy_score >= 75 else ("CAUTION" if proxy_score >= 55 else "BIASED"),
        "issues": proxy_issues,
        "proxy_features": proxy_features,
        "non_proxy_features": non_proxy_features,
    }

    # ─── Overall Health Score ──────────────────────────────────────────────────
    overall = round((rep_score * 0.35 + label_score * 0.40 + proxy_score * 0.25))

    if overall >= 80:
        recommendation = "SAFE_TO_TRAIN"
    elif overall >= 60:
        recommendation = "CAUTION"
    else:
        recommendation = "DO_NOT_TRAIN"

    fixes.sort(key=lambda f: {"HIGH": 0, "MEDIUM": 1, "LOW": 2}.get(f["priority"], 3))

    return {
        "overall_health_score": overall,
        "recommendation": recommendation,
        "scans": scans,
        "fixes": fixes,
        "rows_analyzed": n_total,
    }
