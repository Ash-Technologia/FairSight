# backend/routers/preflight.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.preflight_engine import run_preflight_scan
import pandas as pd
import json
import io

router = APIRouter()


@router.post("")
@router.post("/")
async def preflight_scan(
    file: UploadFile = File(...),
    protected_attributes: str = Form('[\"race\",\"gender\"]'),
    label_col: str = Form("true_label"),
):
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")

    try:
        try:
            df = pd.read_csv(io.StringIO(content.decode("utf-8")))
        except UnicodeDecodeError:
            df = pd.read_csv(io.StringIO(content.decode("latin-1")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Parse error: {str(e)}")

    try:
        protected_cols = json.loads(protected_attributes)
        if not isinstance(protected_cols, list):
            raise ValueError("protected_attributes must be a JSON array")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"protected_attributes error: {str(e)}")

    available_cols = df.columns.tolist()
    valid_protected = [c for c in protected_cols if c in available_cols]

    if not valid_protected:
        demo_keywords = ["race", "gender", "sex", "age", "ethnicity"]
        valid_protected = [c for c in available_cols if any(k in c.lower() for k in demo_keywords)]

    if label_col not in available_cols:
        # Try to auto-detect
        for c in available_cols:
            if "label" in c.lower() or "outcome" in c.lower() or "target" in c.lower():
                label_col = c
                break

    result = run_preflight_scan(df, valid_protected, label_col)
    result["filename"] = file.filename
    result["rows"] = len(df)
    result["columns"] = available_cols
    return result
