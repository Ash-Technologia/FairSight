# backend/routers/mitigate.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.mitigation_engine import compute_mitigation

router = APIRouter()


class MitigateRequest(BaseModel):
    metrics: dict
    strategy: Optional[str] = "equalize_to_mean"


@router.post("/compute")
async def compute_mitigation_route(body: MitigateRequest):
    if not body.metrics:
        raise HTTPException(status_code=400, detail="metrics is required")
    if body.strategy not in ("equalize_to_mean", "equalize_to_best"):
        raise HTTPException(status_code=400, detail="strategy must be 'equalize_to_mean' or 'equalize_to_best'")
    result = compute_mitigation(body.metrics, strategy=body.strategy)
    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])
    return result
