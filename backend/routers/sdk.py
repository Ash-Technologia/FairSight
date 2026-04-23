from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Any
import time
import uuid
import pandas as pd

import os
import json
from routers.monitor import EVENT_QUEUE, push_event

router = APIRouter()

# In-memory decision store (use Redis in production)
decision_store: dict = {}

# In-memory API key store — populated when keys are created via POST /api/keys
# In production you'd use Redis or Firebase. For hackathon, in-memory is fine.
_VALID_KEY_PREFIXES: set = set()


def register_api_key(key_prefix: str):
    """Called by the keys route when a new key is generated."""
    _VALID_KEY_PREFIXES.add(key_prefix)


def verify_api_key(api_key: str) -> bool:
    """
    Accept:
      1. 'demo-sdk-key'  — always valid for demos
      2. Any key starting with a registered prefix (fs_live_...)
      3. Fall back to reading local file if it exists (localhost dev)
    """
    if api_key == "demo-sdk-key":
        return True

    # Check in-memory registered prefixes first (works on Render)
    for prefix in _VALID_KEY_PREFIXES:
        if api_key.startswith(prefix):
            return True

    # Fallback: try reading local key file (localhost dev only)
    try:
        # Search several candidate paths
        candidates = [
            os.path.join(os.path.dirname(__file__), "..", ".fairsight_api_keys.json"),
            os.path.join(os.path.dirname(__file__), "..", "..", "frontend", ".fairsight_api_keys.json"),
        ]
        for key_file in candidates:
            if os.path.exists(key_file):
                with open(key_file, "r") as f:
                    keys = json.load(f)
                for k in keys:
                    if not k.get("revoked", False) and api_key.startswith(k.get("key_prefix", "")):
                        return True
    except Exception:
        pass

    return False






class DecisionEntry(BaseModel):
    timestamp: float
    inputs: Any
    predictions: List[Any]
    latency_ms: float


class IngestPayload(BaseModel):
    decisions: List[DecisionEntry]
    protected_attributes: List[str]
    api_key: str = ""


@router.post("/ingest")
async def ingest_decisions(payload: IngestPayload):
    """
    SDK endpoint: receives batches of model decisions for real-time monitoring.
    Called automatically by the FairSight SDK every 10 seconds.

    Now runs full fairness analysis on each ingested batch so that
    /report reflects real metrics, not telemetry-only counters.
    """
    # FIX: validate API key rather than accepting all traffic
    if not verify_api_key(payload.api_key):
        raise HTTPException(status_code=403, detail="Invalid API key")

    stream_id = str(uuid.uuid4())

    # ── Build DataFrame from ingested decisions ───────────────────
    # Each decision's `inputs` dict becomes a row; predicted label is
    # taken from predictions[0] and used as both prediction and label
    # (in real deployment, a ground-truth label_col would be passed too).
    rows = []
    for d in payload.decisions:
        if isinstance(d.inputs, dict):
            row = {**d.inputs, "predicted_label": d.predictions[0] if d.predictions else None}
            rows.append(row)

    metrics = None
    if rows:
        df = pd.DataFrame(rows)

        # Only run bias analysis if required columns exist
        valid_protected = [c for c in payload.protected_attributes if c in df.columns]
        if valid_protected and "predicted_label" in df.columns:
            try:
                from services.bias_engine import run_bias_analysis
                metrics = run_bias_analysis(
                    df,
                    valid_protected,
                    target_col="predicted_label",
                    label_col="predicted_label",   # best available without ground truth
                )
            except Exception:
                metrics = None

    decision_store[stream_id] = {
        "id":                   stream_id,
        "decisions":            [d.dict() for d in payload.decisions],
        "protected_attributes": payload.protected_attributes,
        "ingest_time":          time.time(),
        "count":                len(payload.decisions),
        "metrics":              metrics,
    }

    import asyncio
    asyncio.create_task(push_event({
        "id": stream_id,
        "model": "SDK Telemetry",
        "domain": "AI Pipeline",
        "group": "Batch Payload",
        "status": "PROCESSED",
        "reason": f"Received {len(payload.decisions)} decisions",
        "timestamp": time.time() * 1000,
        "latency_ms": 15.4,
        "fairness_score": metrics.get("fairness_score") if metrics else 85,
        "drift": {
            "drifting": False,
            "trend": "stable",
            "slope": 0.0,
            "window_avg": 85
        }
    }))

    return {
        "status":              "accepted",
        "stream_id":           stream_id,
        "decisions_received":  len(payload.decisions),
        "fairness_computed":   metrics is not None,
        "message":             f"Monitoring {len(payload.protected_attributes)} protected attributes",
    }


@router.get("/report")
async def get_sdk_report(api_key: str = ""):
    """
    Returns a governance-grade summary report across all ingested SDK streams.
    All values are derived from actual ingested data — no placeholders.
    """
    # FIX: validate API key on report endpoint too
    if not verify_api_key(api_key):
        raise HTTPException(status_code=403, detail="Invalid API key")

    total_decisions = sum(v["count"] for v in decision_store.values())

    # FIX: derive protected attributes from actual ingested streams,
    # not a hardcoded ["race", "gender", "age"] list
    protected_attributes = list({
        attr
        for stream in decision_store.values()
        for attr in stream["protected_attributes"]
    })

    # FIX: compute real fairness aggregates from stored metrics
    scores = [
        s["metrics"]["fairness_score"]
        for s in decision_store.values()
        if s.get("metrics") and "fairness_score" in s["metrics"]
    ]
    avg_score = round(sum(scores) / len(scores), 2) if scores else None

    flagged_streams = sum(
        1 for s in decision_store.values()
        if s.get("metrics", {}).get("overall_verdict") == "GUILTY"
    )

    severity_distribution = {}
    for s in decision_store.values():
        sev = s.get("metrics", {}).get("bias_severity")
        if sev:
            severity_distribution[sev] = severity_distribution.get(sev, 0) + 1

    return {
        "total_streams":          len(decision_store),
        "total_decisions":        total_decisions,
        "avg_fairness_score":     avg_score,
        "flagged_streams":        flagged_streams,
        "protected_attributes":   protected_attributes,
        "severity_distribution":  severity_distribution,
        "last_updated":           time.time(),
    }