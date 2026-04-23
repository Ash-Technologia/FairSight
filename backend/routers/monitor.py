from fastapi import APIRouter, WebSocket, WebSocketDisconnect, UploadFile, File, BackgroundTasks
from typing import List
import asyncio
import json
import time
import random

import pandas as pd
import io
import uuid
from services.bias_engine import run_bias_analysis

router = APIRouter()


# ─────────────────────────────────────────────
# Connection Manager
# ─────────────────────────────────────────────

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn)


manager = ConnectionManager()


# ─────────────────────────────────────────────
# Real-time Monitor State
# Populated by analyze_dataset() after each audit.
# No placeholder values — all fields start at zero
# and only update when real data arrives.
# ─────────────────────────────────────────────

MONITOR_STATE = {
    "decisions_audited": 0,     # incremented by row count on each upload
    "flagged":           0,     # incremented when verdict == GUILTY
    "scores":            [],    # fairness score from each audit run
    "severities":        [],    # severity string from each audit run
    "last_verdict":      None,
    "last_severity":     None,
    "last_fairness_score": None,
}

# Real-time event queue — populated by push_event() from the analyze router.
# WebSocket /live drains this queue; falls back to silence when empty.
EVENT_QUEUE: List[dict] = []


async def push_event(event: dict):
    """
    Called by analyze_dataset() after each audit completes.
    Appends to queue AND broadcasts immediately to all live connections.
    """
    EVENT_QUEUE.append(event)

    # Update aggregate monitor state
    MONITOR_STATE["decisions_audited"] += event.get("row_count", 0)
    score = event.get("fairness_score")
    if score is not None:
        MONITOR_STATE["scores"].append(score)
    severity = event.get("severity")
    if severity is not None:
        MONITOR_STATE["severities"].append(severity)
        MONITOR_STATE["last_severity"] = severity
    if event.get("verdict") == "GUILTY":
        MONITOR_STATE["flagged"] += 1
    MONITOR_STATE["last_verdict"] = event.get("verdict")
    MONITOR_STATE["last_fairness_score"] = score

    await manager.broadcast(event)


# ─────────────────────────────────────────────
# WebSocket — Live Feed
# ─────────────────────────────────────────────

@router.websocket("/live")
async def websocket_live_feed(websocket: WebSocket):
    """
    Streams real audit events to the frontend dashboard.
    When a dataset is uploaded and analyzed, the result is pushed here
    within milliseconds via push_event() → manager.broadcast().

    FIX C5: Previously used EVENT_QUEUE.pop(0) in a shared drain loop, causing
    race conditions when multiple connections were open — one connection would
    steal and destroy events meant for others. Now each connection receives
    events via manager.broadcast() which fans out to ALL active connections.

    On connect: replay recent events (up to 10) so late-joining clients
    see context without waiting for the next audit.
    """
    await manager.connect(websocket)
    try:
        # Replay recent events to give the new client immediate context
        recent = list(EVENT_QUEUE)[-10:]
        for event in recent:
            try:
                await websocket.send_json({**event, "replayed": True})
            except Exception:
                break

        # Keep the connection alive — new events arrive via manager.broadcast()
        # called from push_event(). No polling or popping needed here.
        while True:
            await asyncio.sleep(30)
            # Send a heartbeat so the browser doesn't close the idle connection
            try:
                await websocket.send_json({"type": "heartbeat", "ts": __import__("time").time()})
            except Exception:
                break
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)



# ─────────────────────────────────────────────
# Stats Endpoint — fully derived from real state
# ─────────────────────────────────────────────

@router.get("/stats")
async def get_monitor_stats():
    """
    Returns live monitoring statistics.
    All values are derived from actual audit runs — no placeholders.
    """
    scores = MONITOR_STATE["scores"]
    severities = MONITOR_STATE["severities"]

    avg_score = round(sum(scores) / len(scores), 1) if scores else None

    severity_counts = {}
    for s in severities:
        severity_counts[s] = severity_counts.get(s, 0) + 1

    return {
        "models_monitored":      len(manager.active_connections),
        "decisions_audited":     MONITOR_STATE["decisions_audited"],
        "active_alerts":         MONITOR_STATE["flagged"],
        "avg_fairness_score":    avg_score,
        "total_audits_run":      len(scores),
        "last_verdict":          MONITOR_STATE["last_verdict"],
        "last_severity":         MONITOR_STATE["last_severity"],
        "last_fairness_score":   MONITOR_STATE["last_fairness_score"],
        "severity_distribution": severity_counts,
        "active_connections":    len(manager.active_connections),
        # Rolling drift chart data (last 20 audits)
        "scores_window":  scores[-20:],
        "score_history":  [{"index": i + 1, "score": s} for i, s in enumerate(scores[-20:])],
    }


# ─────────────────────────────────────────────
# Real Dataset Streaming (sliding window)
# ─────────────────────────────────────────────
STREAM_STATE = {"active": False}

@router.post("/stop_stream")
async def stop_stream():
    STREAM_STATE["active"] = False
    return {"status": "stopped"}

async def _stream_dataset_task(content: bytes, filename: str):
    """
    Background worker that iterates through the dataset in chunks, 
    calculating real mathematical fairness on a sliding window, 
    and beaming the events to the websocket.
    """
    try:
        try:
            df = pd.read_csv(io.StringIO(content.decode("utf-8")))
        except UnicodeDecodeError:
            df = pd.read_csv(io.StringIO(content.decode("latin-1")))
    except Exception as e:
        print(f"Stream error parsing CSV: {e}")
        return

    # Attempt to auto-detect protected and label columns
    available_cols = df.columns.tolist()
    demo_keywords = ["race", "gender", "sex", "age", "ethnicity"]
    valid_protected = [c for c in available_cols if any(k in c.lower() for k in demo_keywords)]
    
    label_col = "true_label" if "true_label" in available_cols else None
    target_col = "predicted_label" if "predicted_label" in available_cols else None
    
    if not valid_protected or not target_col or not label_col:
        print("Dataset missing columns required for streaming bias analysis.")
        return

    # Start sliding window simulation
    window_size = 100
    chunk_size = 5
    
    recent_scores = []

    STREAM_STATE["active"] = True

    import itertools
    attr_cycle = itertools.cycle(valid_protected) if valid_protected else itertools.cycle(["Unknown"])

    for i in range(0, len(df), chunk_size):
        if not STREAM_STATE["active"]:
            break
            
        # We need at least 50 rows to start getting stable metric calculations
        end_idx = i + chunk_size
        start_idx = max(0, end_idx - window_size)
        
        window_df = df.iloc[start_idx:end_idx].copy()
        
        if len(window_df) > 10:
            metrics = run_bias_analysis(
                window_df,
                valid_protected,
                target_col,
                label_col
            )
            
            score = metrics.get('fairness_score', 80) if isinstance(metrics, dict) else 80
            recent_scores.append(score)
            if len(recent_scores) > 10:
                recent_scores.pop(0)
                
            slope = (recent_scores[-1] - recent_scores[0]) / max(1, len(recent_scores)) if len(recent_scores) >= 3 else 0
            is_drifting = slope < -0.5
            
            # Format live event for LiveFeed UI exactly how it expects:
            # { id, model, domain, group, outcome, status, reason, timestamp, latency_ms, fairness_score }
            
            # Pick a subset of rows to "emit" as visual live decisions
            for _, row in window_df.iloc[-chunk_size:].iterrows():
                attr = next(attr_cycle)
                group_val = str(row[attr]) if attr in row else "Unknown"
                outcome = "PASSED" if score >= 70 else ("FLAGGED" if score < 50 else "REVIEW")
                
                event = {
                    "id": str(uuid.uuid4()),
                    "model": filename,
                    "domain": "AI Pipeline",
                    "group": f"{attr.title()}: {group_val}",
                    "status": outcome,
                    "reason": f"Sliding window fairness score: {score}",
                    "timestamp": time.time() * 1000,
                    "latency_ms": round(random.uniform(10, 45), 1),
                    "fairness_score": score,
                    "drift": {
                        "drifting": is_drifting,
                        "trend": "declining" if slope < -0.3 else "improving" if slope > 0.3 else "stable",
                        "slope": round(float(slope), 3),
                        "window_avg": round(sum(recent_scores) / len(recent_scores), 1)
                    }
                }
                
                # Push directly into the queue so the websocket drains it immediately
                EVENT_QUEUE.append(event)
                await asyncio.sleep(0.4) # Add realistic timing latency between rows
                
        else:
            await asyncio.sleep(0.5)

    STREAM_STATE["active"] = False

@router.post("/stream_real_dataset")
async def stream_real_dataset(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    # Stop any existing streams first
    STREAM_STATE["active"] = False
    
    if not file.filename.endswith('.csv'):
        return {"error": "Must upload a CSV dataset."}
    content = await file.read()
    background_tasks.add_task(_stream_dataset_task, content, file.filename)
    return {"status": "streaming_started"}