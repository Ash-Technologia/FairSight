# backend/routers/stream_analyze.py
# SSE streaming version of analyze — yields progress events for each pipeline step
# Frontend consumes via fetch() + ReadableStream (not EventSource, which is GET-only)

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from services.bias_engine import run_bias_analysis
from services.flip_test import run_flip_test
from services.shap_service import get_feature_importance
from services.hash_service import hash_dataset
from services.pii_detector import detect_pii
from services.intersectional_engine import compute_intersectional_metrics
from routers.monitor import push_event
import pandas as pd
import json
import io
import asyncio
import time

router = APIRouter()


def sse_event(step: str, label: str, detail: str, progress: int, data: dict | None = None) -> str:
    """Format a single SSE event string."""
    payload = {
        "step": step,
        "label": label,
        "detail": detail,
        "progress": progress,
        **(data or {}),
    }
    return f"data: {json.dumps(payload)}\n\n"


@router.post("/stream")
async def analyze_stream(
    file: UploadFile = File(...),
    protected_attributes: str = Form("[]"),
    target_column: str = Form("predicted_label"),
    label_column: str = Form("true_label"),
    uid: str = Form("guest"),
):
    """
    Streaming version of /analyze.
    Returns Server-Sent Events (SSE) — each event has:
      { step, label, detail, progress, ...stepSpecificData }
    Final event has step="done" and carries the full result.
    """

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    if not (file.filename.endswith(".csv") or file.filename.endswith(".json")):
        raise HTTPException(status_code=400, detail="Only .csv and .json files supported")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB)")

    async def event_generator():
        try:
            # ── Step 1: Parse dataset ──────────────────────────────────────
            yield sse_event("parse", "Parsing dataset", "Detecting encoding & schema…", 10)
            await asyncio.sleep(0)

            try:
                if file.filename.endswith(".csv"):
                    try:
                        df = pd.read_csv(io.StringIO(content.decode("utf-8")))
                    except UnicodeDecodeError:
                        df = pd.read_csv(io.StringIO(content.decode("latin-1")))
                else:
                    df = pd.DataFrame(json.loads(content))
            except Exception as e:
                yield sse_event("error", "Parse failed", str(e), 0)
                return

            row_count = len(df)
            available_cols = df.columns.tolist()

            # Parse protected columns
            try:
                protected_cols = json.loads(protected_attributes)
                if not isinstance(protected_cols, list):
                    protected_cols = []
            except Exception:
                protected_cols = []

            # Auto-detect target column
            if target_column not in available_cols:
                kws = ['predict', 'label', 'outcome', 'decision', 'result', 'score', 'output', 'class', 'target']
                candidates = [c for c in available_cols if any(k in c.lower() for k in kws)]
                target_column = candidates[0] if candidates else available_cols[-1]

            if label_column not in available_cols:
                label_column = target_column

            # Auto-detect protected columns
            valid_protected = [c for c in protected_cols if c in available_cols]
            if not valid_protected:
                demo_kw = ["race", "gender", "sex", "age", "ethnicity", "nationality", "religion", "disability"]
                valid_protected = [c for c in available_cols if any(k in c.lower() for k in demo_kw)]

            dataset_hash = hash_dataset(content)
            pii_result = detect_pii(df)

            yield sse_event("parse", "Dataset parsed", f"{row_count:,} rows, {len(available_cols)} columns", 18,
                            {"row_count": row_count, "columns": available_cols, "protected": valid_protected})
            await asyncio.sleep(0)

            # ── Step 2: Bias metrics ───────────────────────────────────────
            yield sse_event("metrics", "Computing fairness metrics",
                            "Demographic Parity, Equalized Odds, Disparate Impact…", 25)
            await asyncio.sleep(0)

            metrics = run_bias_analysis(df, valid_protected, target_column, label_column, flip_rate=0.0)

            yield sse_event("metrics", "Fairness metrics complete",
                            f"Score: {metrics.get('fairness_score', 0)}/100 · Verdict: {metrics.get('overall_verdict', 'N/A')}",
                            42,
                            {"fairness_score": metrics.get("fairness_score"), "verdict": metrics.get("overall_verdict")})
            await asyncio.sleep(0)

            # ── Step 3: Flip test ──────────────────────────────────────────
            yield sse_event("fliptest", "Running counterfactual flip test",
                            "Submitting identical profiles with protected attribute swapped…", 50)
            await asyncio.sleep(0)

            flip_result = run_flip_test(df, valid_protected, target_column)
            overall_flip_rate = flip_result.get("overall_flip_rate", 0.0)

            # Re-run metrics with flip_rate incorporated
            metrics = run_bias_analysis(df, valid_protected, target_column, label_column, flip_rate=overall_flip_rate)

            yield sse_event("fliptest", "Flip test complete",
                            f"Flip rate: {overall_flip_rate:.1%} across {len(valid_protected)} attribute(s)",
                            58,
                            {"flip_rate": overall_flip_rate})
            await asyncio.sleep(0)

            # ── Step 4: Feature importance / proxy detection ───────────────
            yield sse_event("proxy", "Detecting proxy features",
                            "Computing Shapley-based feature correlations with protected attributes…", 65)
            await asyncio.sleep(0)

            feature_importance = get_feature_importance(df, target_column, valid_protected)
            proxy_count = len(feature_importance.get("proxy_features", []))

            yield sse_event("proxy", "Proxy detection complete",
                            f"{proxy_count} proxy feature(s) detected",
                            72,
                            {"proxy_features": feature_importance.get("proxy_features", [])})
            await asyncio.sleep(0)

            # ── Step 5: Intersectional analysis ──────────────────────────
            yield sse_event("intersectional", "Running intersectional analysis",
                            "Analyzing bias at intersection of multiple protected attributes…", 78)
            await asyncio.sleep(0)

            intersectional_data = compute_intersectional_metrics(df, valid_protected, target_column)

            yield sse_event("intersectional", "Intersectional analysis complete",
                            "Attribute interaction matrix computed", 84)
            await asyncio.sleep(0)

            # ── Step 6: Push live monitor event ──────────────────────────
            await push_event({
                "type":           "AUDIT_COMPLETE",
                "model":          file.filename,
                "fairness_score": metrics.get("fairness_score"),
                "verdict":        metrics.get("overall_verdict"),
                "severity":       metrics.get("bias_severity"),
                "flip_rate":      overall_flip_rate,
                "row_count":      row_count,
                "timestamp":      time.time(),
            })

            # ── Step 7: Done — send full result ──────────────────────────
            yield sse_event("done", "Analysis complete", "Report ready", 95, {
                "dataset_hash":         dataset_hash,
                "metrics":              metrics,
                "flip_test":            flip_result,
                "feature_importance":   feature_importance,
                "intersectional":       intersectional_data,
                "row_count":            row_count,
                "protected_attributes": valid_protected,
                "pii_warnings":         pii_result,
                "filename":             file.filename,
            })

        except Exception as e:
            yield sse_event("error", "Analysis failed", str(e), 0)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # Disable Nginx buffering on Render
            "Connection": "keep-alive",
        },
    )
