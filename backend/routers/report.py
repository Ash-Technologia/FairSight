# backend/routers/report.py
"""
POST /report/pdf — accept full audit JSON, return PDF binary
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, Any
from io import BytesIO

router = APIRouter()


class ReportRequest(BaseModel):
    id:               Optional[str]  = None
    filename:         Optional[str]  = "Unknown Dataset"
    dataset_hash:     Optional[str]  = None
    datasetHash:      Optional[str]  = None
    row_count:        Optional[int]  = None
    rowCount:         Optional[int]  = None
    verdict:          Optional[str]  = None
    fairnessScore:    Optional[int]  = None
    severity:         Optional[str]  = None
    metrics:          Optional[dict] = None
    flip_test:        Optional[dict] = None
    flipTest:         Optional[dict] = None
    ai_verdicts:      Optional[dict] = None
    aiVerdicts:       Optional[dict] = None
    protected_attributes: Optional[list] = None
    protectedColumns:     Optional[list] = None
    createdAt:        Optional[Any]  = None


@router.post("/pdf")
async def generate_pdf(body: ReportRequest):
    try:
        from services.pdf_generator import generate_compliance_pdf
    except ImportError:
        raise HTTPException(status_code=503, detail="reportlab not installed — run: pip install reportlab")

    # Normalize field names (support both camelCase and snake_case)
    audit = {
        "id":               body.id,
        "filename":         body.filename,
        "datasetHash":      body.datasetHash or body.dataset_hash,
        "dataset_hash":     body.datasetHash or body.dataset_hash,
        "rowCount":         body.rowCount or body.row_count,
        "row_count":        body.rowCount or body.row_count,
        "verdict":          body.verdict,
        "fairnessScore":    body.fairnessScore,
        "severity":         body.severity,
        "metrics":          body.metrics or {},
        "flipTest":         body.flipTest or body.flip_test or {},
        "flip_test":        body.flipTest or body.flip_test or {},
        "aiVerdicts":       body.aiVerdicts or body.ai_verdicts or {},
        "protectedColumns": body.protectedColumns or body.protected_attributes or [],
        "protected_attributes": body.protectedColumns or body.protected_attributes or [],
        "createdAt":        body.createdAt,
    }

    try:
        pdf_bytes = generate_compliance_pdf(audit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

    filename = f"fairsight_compliance_{(body.id or 'report')[:8].lower()}.pdf"

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
