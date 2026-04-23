# backend/routers/debias.py

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from services.debias_engine import run_debiasing
import pandas as pd
import io, json
from pathlib import Path

router = APIRouter()

# In-memory store for debiased results (keyed by audit_id)
# In production this would be Redis or S3, but for hackathon this is fine
_DEBIAS_CACHE: dict[str, dict] = {}

@router.post("/{audit_id}")
async def debias_dataset(
    audit_id: str,
    file: UploadFile = File(...),
    protected_columns: str = Form("[]"),
    target_column: str = Form("predicted_label"),
    label_column: str = Form("true_label")
):
    content = await file.read()
    try:
        try:
            df = pd.read_csv(io.StringIO(content.decode("utf-8")))
        except UnicodeDecodeError:
            df = pd.read_csv(io.StringIO(content.decode("latin-1")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Parse error: {e}")

    try:
        protected = json.loads(protected_columns)
    except:
        protected = []

    target_col = target_column
    label_col = label_column

    if len(df) == 0:
        raise HTTPException(status_code=400, detail="Empty dataset")

    if len(df) > 50000:
        raise HTTPException(status_code=413, detail="Dataset too large for debiasing (max 50,000 rows)")

    try:
        result = run_debiasing(df, protected, label_col, target_col)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Debiasing failed: {e}")

    # Store debiased CSV in memory cache for download
    csv_buffer = io.StringIO()
    result["debiased_df"].to_csv(csv_buffer, index=False)
    _DEBIAS_CACHE[audit_id] = {
        "csv_content": csv_buffer.getvalue(),
        "stats": {k: v for k, v in result.items() if k != "debiased_df"}
    }

    return {
        "audit_id":                audit_id,
        "primary_attribute":       result["primary_attribute"],
        "privileged_group":        result["privileged_group"],
        "weight_stats":            result["weight_stats"],
        "rows_upweighted":         result["rows_upweighted"],
        "rows_downweighted":       result["rows_downweighted"],
        "current_fairness_score":  result["current_fairness_score"],
        "projected_fairness_score":result["projected_fairness_score"],
        "current_dp_gap":          result["current_dp_gap"],
        "projected_dp_gap":        result["projected_dp_gap"],
        "algorithm":               result["algorithm"],
        "citation":                result["citation"],
        "download_ready":          True,
    }

@router.get("/{audit_id}/download")
async def download_debiased_csv(audit_id: str):
    if audit_id not in _DEBIAS_CACHE:
        raise HTTPException(
            status_code=404,
            detail="Debiased dataset not found. Call POST /debias/{audit_id} first."
        )

    csv_content = _DEBIAS_CACHE[audit_id]["csv_content"]
    filename = f"fairsight_debiased_{audit_id[:8]}.csv"

    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
