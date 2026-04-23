"""
backend/routers/simulate.py

POST /simulate  →  Accepts flat metrics + mitigations list
                   Returns projected score, verdict, and metric deltas.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any
from services.score_simulator import simulate_score

router = APIRouter()


class SimulatePayload(BaseModel):
    metrics: dict[str, Any]
    mitigations: list[dict[str, Any]]


@router.post("/simulate")
async def run_simulation(payload: SimulatePayload):
    """
    Simulate how the fairness score changes after applying selected mitigations.

    Accepts:
        metrics:     Flat dict — demographic_parity, equalized_odds, calibration_gap,
                     individual_fairness, flip_rate
        mitigations: List of mitigation objects with at least { "title": str }

    Returns:
        projected_score, projected_verdict, projected_severity,
        original_score, delta, metric_deltas
    """
    if not payload.metrics:
        raise HTTPException(status_code=400, detail="metrics cannot be empty")

    try:
        result = simulate_score(payload.metrics, payload.mitigations)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")
