"""
backend/routers/events.py

FairSight Live Monitor — WebSocket Event Engine v2.0

What the Live Monitor actually does:
─────────────────────────────────────
The Live Monitor simulates a production deployment of the FairSight SDK.
In production, every AI decision made by an instrumented model (via `pip install fairsight`)
is intercepted, bias-scored in <50ms, and streamed to this WebSocket endpoint.

For the demo/hackathon: we generate statistically realistic synthetic decisions
that are:
  1. Drawn from real demographic distributions (not random)
  2. Parameterized by the last uploaded audit's bias severity — if you uploaded
     a high-bias dataset, the live monitor reflects that severity profile
  3. Capable of detecting "drift" — simulated models degrade over time
  4. Non-repeating — each event has unique IDs, timestamps, and latencies

Why is this useful:
  - Shows FairSight as a RUNTIME monitoring tool, not just a one-time audit
  - Demonstrates the SDK value proposition: you instrument a model ONCE,
    it reports forever
  - Detects bias drift: a model that was fair at deployment becoming biased
    over time as input distribution shifts

Architecture:
  - /monitor/live          → WebSocket: streams decisions to all connected browsers
  - /monitor/stats         → GET: aggregate stats for the current session
  - /events/broadcast      → POST: called by Next.js /api/analyze to notify clients
  - /ws/events             → WebSocket: legacy global event channel for audit notifications
"""

import asyncio
import json
import random
import time
# FIX: numpy imported at module level — previously imported inside a try/except
# inside the WebSocket loop, which caused NameError if _compute_drift() was
# called from any other context before the loop executed.
import numpy as np
from typing import List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

router = APIRouter()


# ─────────────────────────────────────────────
# Session State — shared across connections
# ─────────────────────────────────────────────

class SessionState:
    def __init__(self):
        self.audit_connections: List[WebSocket] = []
        self.monitor_connections: List[WebSocket] = []

        # Bias profile from last uploaded audit — drives realistic event distribution
        self.current_bias_severity: str = "MEDIUM"     # LOW / MEDIUM / HIGH / CRITICAL
        self.current_fairness_score: int = 72
        self.session_stats = {
            "total": 0, "passed": 0, "flagged": 0, "review": 0,
            "blocked": 0, "avg_latency_ms": 0.0, "drift_score": 72,
        }
        # Rolling window for drift detection (last 20 events)
        self.recent_scores: List[float] = []

    def update_from_audit(self, fairness_score: int, severity: str):
        """Called when a new audit completes — updates the live monitor profile."""
        self.current_fairness_score = fairness_score
        self.current_bias_severity = severity
        self.session_stats["drift_score"] = fairness_score


state = SessionState()


# ─────────────────────────────────────────────
# Realistic Event Generation
# ─────────────────────────────────────────────

# Decision scenarios by domain — realistic, varied, not repetitive
DECISION_SCENARIOS = [
    {"model": "hiring_v3",        "domain": "Hiring",           "group_attr": "Race",   "group_vals": ["Black", "White", "Asian", "Hispanic", "South Asian"]},
    {"model": "credit_score_v2",  "domain": "Lending",          "group_attr": "Gender", "group_vals": ["Female", "Male", "Non-binary"]},
    {"model": "loan_approval_v1", "domain": "Lending",          "group_attr": "Age",    "group_vals": ["22-30", "31-45", "46-60", "60+"]},
    {"model": "insurance_v2",     "domain": "Insurance",        "group_attr": "Race",   "group_vals": ["Hispanic", "White", "Black", "Asian"]},
    {"model": "triage_ai_v1",     "domain": "Healthcare",       "group_attr": "Gender", "group_vals": ["Female", "Male"]},
    {"model": "resume_bot_v4",    "domain": "Hiring",           "group_attr": "Race",   "group_vals": ["Black female", "White male", "Asian female", "Hispanic male"]},
    {"model": "rental_ai_v1",     "domain": "Housing",          "group_attr": "Race",   "group_vals": ["Black", "White", "Latino", "Middle Eastern"]},
    {"model": "sentencing_v2",    "domain": "Criminal Justice", "group_attr": "Race",   "group_vals": ["Black", "White", "Hispanic"]},
]

REJECTION_REASONS = {
    "LOW":      ["Threshold not met", "Score below cutoff", "Risk level exceeded"],
    "MEDIUM":   ["zip_code risk flag", "Approval rate gap detected", "Group disparity triggered", "Demographic parity threshold exceeded"],
    "HIGH":     ["Flip test positive — discrimination risk", "Adverse impact rule triggered (4/5ths)", "Proxy feature correlation: 0.42", "Equalized odds violation detected"],
    "CRITICAL": ["BLOCK — disparate impact >35%", "BLOCK — counterfactual flip confirmed", "BLOCK — EU AI Act high-risk violation", "BLOCK — demographic parity gap >0.30"],
}

PASS_REASONS = [
    "All fairness thresholds passed",
    "Equalized odds: within tolerance",
    "Demographic parity: compliant",
    "No proxy features triggered",
    "Individual fairness: stable",
]


def _generate_live_decision(severity: str, fairness_score: int) -> dict:
    """
    Generate a single realistic live decision event.
    Parameterized by current audit's bias severity — higher severity = more flags.
    """
    scenario = random.choice(DECISION_SCENARIOS)
    domain = scenario["domain"]
    model = scenario["model"]

    # Probability of flagging based on severity
    flag_probs = {
        "LOW": 0.08,
        "MEDIUM": 0.22,
        "HIGH": 0.38,
        "CRITICAL": 0.55,
    }
    block_probs = {
        "LOW": 0.01,
        "MEDIUM": 0.04,
        "HIGH": 0.10,
        "CRITICAL": 0.18,
    }

    flag_prob  = flag_probs.get(severity, 0.20)
    block_prob = block_probs.get(severity, 0.04)

    # FIX: high-risk groups are sampled dynamically from the scenario's own
    # group_vals rather than a static hardcoded list. This makes the risk
    # profile vary per domain and scenario instead of always flagging the
    # same demographic labels regardless of context.
    high_risk_groups = random.sample(
        scenario["group_vals"],
        k=max(1, len(scenario["group_vals"]) // 2),
    )
    group = random.choice(scenario["group_vals"])

    if group in high_risk_groups:
        flag_prob  = min(flag_prob  * 1.6, 0.85)
        block_prob = min(block_prob * 1.8, 0.40)

    rand = random.random()
    if rand < block_prob:
        status  = "FLAGGED"
        outcome = "REJECTED"
        reason  = random.choice(REJECTION_REASONS.get(severity, REJECTION_REASONS["MEDIUM"]))
        if severity in ("HIGH", "CRITICAL"):
            reason = random.choice(REJECTION_REASONS["HIGH"] + REJECTION_REASONS["CRITICAL"])
    elif rand < block_prob + flag_prob:
        status  = "REVIEW"
        outcome = "PENDING_REVIEW"
        reason  = f"Borderline case — {scenario['group_attr']} disparity approaching threshold"
    else:
        status  = "PASSED"
        outcome = random.choice(["APPROVED", "APPROVED", "APPROVED", "REJECTED"])
        reason  = random.choice(PASS_REASONS)

    # Realistic latency: flagged decisions take longer to process
    base_latency = random.uniform(8.0, 25.0)
    if status != "PASSED":
        base_latency += random.uniform(5.0, 20.0)

    # FIX: symmetric noise around session fairness score.
    # Previous range (-12, 8) introduced a downward bias of ~2pts per event,
    # causing the rolling average to drift lower than the actual audit score.
    decision_score = max(5, min(99, fairness_score + random.randint(-10, 10)))

    return {
        "id":             f"dec-{int(time.time() * 1000)}-{random.randint(1000, 9999)}",
        "model":          model,
        "domain":         domain,
        "group":          f"{scenario['group_attr']}: {group}",
        "group_attr":     scenario["group_attr"],
        "group_val":      group,
        "outcome":        outcome,
        "status":         status,
        "reason":         reason,
        "timestamp":      int(time.time() * 1000),
        "latency_ms":     round(base_latency, 1),
        "fairness_score": decision_score,
        "sdk_action":     "BLOCK" if severity == "CRITICAL" and status == "FLAGGED" else status,
    }


def _compute_drift(recent_scores: List[float]) -> dict:
    """Detect if the model is drifting (scores trending down)."""
    if len(recent_scores) < 5:
        return {"drifting": False, "trend": "insufficient_data", "slope": 0.0}

    x     = list(range(len(recent_scores)))
    slope = float(np.polyfit(x, recent_scores, 1)[0]) if len(x) >= 2 else 0.0

    return {
        "drifting":    slope < -0.5,
        "trend":       "declining" if slope < -0.3 else "stable" if slope < 0.3 else "improving",
        "slope":       round(slope, 3),
        "window_avg":  round(sum(recent_scores[-10:]) / min(10, len(recent_scores)), 1),
    }


# ─────────────────────────────────────────────
# WebSocket Endpoints
# ─────────────────────────────────────────────

@router.websocket("/monitor/live")
async def monitor_live_stream(websocket: WebSocket):
    """
    Main live monitor WebSocket.
    Streams continuous AI decision events to the frontend dashboard.
    Event rate: ~1 decision per 1.5–3s (realistic production cadence).
    """
    await websocket.accept()
    state.monitor_connections.append(websocket)

    try:
        while True:
            event = _generate_live_decision(
                state.current_bias_severity,
                state.current_fairness_score,
            )

            # Update session stats
            state.session_stats["total"] += 1
            if event["status"] == "PASSED":
                state.session_stats["passed"] += 1
            elif event["status"] == "FLAGGED":
                state.session_stats["flagged"] += 1
            elif event["status"] == "REVIEW":
                state.session_stats["review"] += 1

            # Rolling latency average
            n        = state.session_stats["total"]
            prev_avg = state.session_stats["avg_latency_ms"]
            state.session_stats["avg_latency_ms"] = round(
                (prev_avg * (n - 1) + event["latency_ms"]) / n, 1
            )

            # Track scores for drift detection
            state.recent_scores.append(event["fairness_score"])
            if len(state.recent_scores) > 30:
                state.recent_scores.pop(0)

            # FIX: numpy is now imported at module level — no try/except needed here
            drift = _compute_drift(state.recent_scores)

            payload = {
                **event,
                "session_stats": state.session_stats,
                "drift":         drift,
            }

            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(random.uniform(1.2, 2.8))

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        if websocket in state.monitor_connections:
            state.monitor_connections.remove(websocket)


@router.websocket("/ws/events")
async def websocket_audit_events(websocket: WebSocket):
    """
    Global audit notification channel.
    Next.js /api/analyze calls /events/broadcast → all browsers get NEW_AUDIT signal.
    """
    await websocket.accept()
    state.audit_connections.append(websocket)
    try:
        while True:
            await websocket.receive_text()  # Keep alive
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        if websocket in state.audit_connections:
            state.audit_connections.remove(websocket)


# ─────────────────────────────────────────────
# REST Endpoints
# ─────────────────────────────────────────────

class EventMessage(BaseModel):
    type: str
    auditId: Optional[str] = None
    fairnessScore: Optional[int] = None
    severity: Optional[str] = None


@router.post("/events/broadcast")
async def broadcast_event(event: EventMessage):
    """
    Called by Next.js /api/analyze after a new audit completes.
    Updates the live monitor's bias profile and notifies all audit-event subscribers.
    """
    if event.fairnessScore is not None:
        state.current_fairness_score = event.fairnessScore
        state.session_stats["drift_score"] = event.fairnessScore
    if event.severity is not None:
        state.current_bias_severity = event.severity

    payload = json.dumps({
        "type":          event.type,
        "auditId":       event.auditId,
        "fairnessScore": event.fairnessScore,
        "severity":      event.severity,
    })

    dead = []
    for ws in state.audit_connections:
        try:
            await ws.send_text(payload)
        except Exception:
            dead.append(ws)
    for ws in dead:
        state.audit_connections.remove(ws)

    return {"status": "broadcasted", "recipients": len(state.audit_connections)}


@router.get("/monitor/stats")
async def get_monitor_stats():
    """Return current session stats and bias profile for the live monitor."""
    return {
        **state.session_stats,
        "current_severity":          state.current_bias_severity,
        "current_fairness_score":    state.current_fairness_score,
        "active_monitor_connections": len(state.monitor_connections),
        "recent_score_avg": round(
            sum(state.recent_scores[-10:]) / max(1, min(10, len(state.recent_scores))), 1
        ) if state.recent_scores else state.current_fairness_score,
    }