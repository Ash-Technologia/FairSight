from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.bias_engine import run_bias_analysis
from services.flip_test import run_flip_test
from services.shap_service import get_feature_importance
from services.hash_service import hash_dataset
from services.pii_detector import detect_pii
from services.webhook_service import fire_bias_alert
from services.intersectional_engine import compute_intersectional_metrics
from routers.monitor import push_event
from routers.settings import get_webhook_config
import pandas as pd
import json
import io
import time
import asyncio
import os

router = APIRouter()


@router.post("", include_in_schema=True)
@router.post("/", include_in_schema=False)
async def analyze_dataset(
    file: UploadFile = File(...),
    protected_attributes: str = Form('["race","gender"]'),
    target_column: str = Form("predicted_label"),
    label_column: str = Form("true_label"),
    uid: str = Form("guest"),
):

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    if not (file.filename.endswith(".csv") or file.filename.endswith(".json")):
        raise HTTPException(status_code=400, detail="Only .csv and .json files supported")

    content = await file.read()

    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large")

    try:
        if file.filename.endswith(".csv"):
            # FIX: try UTF-8 first, fall back to latin-1.
            # latin-1 / Windows-1252 encoded files are common in HR and
            # lending datasets and would previously raise UnicodeDecodeError.
            try:
                df = pd.read_csv(io.StringIO(content.decode("utf-8")))
            except UnicodeDecodeError:
                df = pd.read_csv(io.StringIO(content.decode("latin-1")))
        else:
            df = pd.DataFrame(json.loads(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Parse error: {str(e)}")

    # FIX: reject malformed JSON rather than silently falling back to
    # ["race", "gender"], which would produce a wrong-but-valid-looking result.
    try:
        protected_cols = json.loads(protected_attributes)
        if not isinstance(protected_cols, list):
            raise ValueError("protected_attributes must be a JSON array")
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(status_code=400, detail=f"protected_attributes parse error: {str(e)}")

    available_cols = df.columns.tolist()

    # ── Auto-detect target column if default not in CSV ──────────────────────
    # Default 'predicted_label'/'true_label' rarely exist in real-world CSVs.
    # Scan for likely candidates instead of returning 400.
    if target_column not in available_cols:
        candidate_keywords = ['predict', 'label', 'outcome', 'decision', 'result', 'score', 'output', 'class', 'target']
        candidates = [c for c in available_cols if any(k in c.lower() for k in candidate_keywords)]
        if candidates:
            target_column = candidates[0]
        else:
            # Last column is a common convention for target in ML datasets
            target_column = available_cols[-1]

    if label_column not in available_cols:
        # Use target column as label if separate ground truth not provided
        label_column = target_column

    valid_protected = [c for c in protected_cols if c in available_cols]

    # Auto-detect protected columns when none from the request match the CSV
    if not valid_protected:
        demo_keywords = ["race", "gender", "sex", "age", "ethnicity", "nationality", "religion", "disability"]
        valid_protected = [c for c in available_cols if any(k in c.lower() for k in demo_keywords)]

    # These must run AFTER column detection
    dataset_hash = hash_dataset(content)
    pii_result = detect_pii(df)

    # Run flip test first so its overall_flip_rate feeds into the fairness score.
    flip_result = run_flip_test(df, valid_protected, target_column)
    overall_flip_rate = flip_result.get("overall_flip_rate", 0.0)

    metrics = run_bias_analysis(
        df,
        valid_protected,
        target_column,
        label_column,
        flip_rate=overall_flip_rate,
    )

    feature_importance = get_feature_importance(
        df,
        target_column,
        valid_protected
    )

    intersectional_data = compute_intersectional_metrics(df, valid_protected, target_column)

    # Push real audit result to live monitor so /stats and WebSocket /live
    # reflect actual dataset outcomes rather than placeholder values.
    await push_event({
        "type":           "AUDIT_COMPLETE",
        "model":          file.filename,
        "fairness_score": metrics.get("fairness_score"),
        "verdict":        metrics.get("overall_verdict"),
        "severity":       metrics.get("bias_severity"),
        "flip_rate":      overall_flip_rate,
        "row_count":      len(df),
        "timestamp":      time.time(),
    })

    # ── Fire webhook alert non-blocking ──────────────────────────────────
    # After EVERY GUILTY verdict, check if the user has a webhook configured
    # with a threshold lower than the fairness_score; if yes, send the alert.
    # This is the Slack ping on stage moment — the single most impressive
    # live demo action. Never crashes or slows the audit pipeline.
    try:
        verdict = metrics.get("overall_verdict", "CLEAR")
        score   = metrics.get("fairness_score", 100)

        # Load config: try uid-specific first, then shared global fallback
        webhook_cfg = get_webhook_config(uid)
        if not webhook_cfg:
            webhook_cfg = get_webhook_config("shared")
        if not webhook_cfg:
            import pathlib as _pathlib, json as _json
            cfg_path = _pathlib.Path(__file__).parent.parent / ".fairsight_webhook_config.json"
            if cfg_path.exists():
                all_cfgs = _json.loads(cfg_path.read_text())
                if all_cfgs:
                    webhook_cfg = list(all_cfgs.values())[-1]

        enabled    = webhook_cfg.get("enabled", True)
        threshold  = webhook_cfg.get("bias_threshold", 70)
        active_url = (webhook_cfg.get("slack_url")
                      or webhook_cfg.get("discord_url")
                      or webhook_cfg.get("teams_url"))

        # Fire on GUILTY verdict OR score below configured threshold
        should_alert = enabled and active_url and (
            verdict == "GUILTY" or score < threshold
        )

        if should_alert:
            by_attr = metrics.get("by_attribute", {})
            top_violation = {"metric_name": "demographic_parity", "value": "N/A", "threshold": "0.10"}
            for attr, attr_metrics in by_attr.items():
                if isinstance(attr_metrics, dict):
                    dp = attr_metrics.get("demographic_parity", 0)
                    top_violation = {
                        "attribute":   attr,
                        "metric_name": "Demographic Parity",
                        "value":       round(dp, 3),
                        "threshold":   0.10,
                    }
                    break

            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
            asyncio.create_task(fire_bias_alert(
                webhook_url=active_url,
                audit_id=f"audit-{int(time.time())}",
                filename=file.filename,
                fairness_score=score,
                verdict=verdict,
                severity=metrics.get("bias_severity", "HIGH"),
                top_violation=top_violation,
                dashboard_url=f"{frontend_url}/dashboard",
            ))
            print(f"[webhook] Alert fired — uid={uid} verdict={verdict} score={score}")
    except Exception as _wh_err:
        print(f"[webhook] Setup error (non-blocking): {_wh_err}")

    return {
        "dataset_hash":         dataset_hash,
        "metrics":              metrics,
        "flip_test":            flip_result,
        "feature_importance":   feature_importance,
        "intersectional":       intersectional_data,
        "row_count":            len(df),
        "protected_attributes": valid_protected,
        "pii_warnings":         pii_result,
        "filename":             file.filename,
    }