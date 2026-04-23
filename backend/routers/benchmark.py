# backend/routers/benchmark.py

from fastapi import APIRouter, HTTPException, BackgroundTasks
from services.benchmark_registry import get_dataset, load_dataframe, all_datasets, BENCHMARK_REGISTRY
from services.bias_engine import run_bias_analysis
from services.flip_test import run_flip_test
from services.shap_service import get_feature_importance
from services.hash_service import hash_dataset
import json, time

router = APIRouter()


@router.get("/")
async def list_benchmarks():
    """Return all benchmark dataset cards with metadata."""
    return {"datasets": all_datasets()}


@router.get("/{dataset_id}")
async def get_benchmark_metadata(dataset_id: str):
    """Return metadata for a single benchmark dataset."""
    try:
        ds = get_dataset(dataset_id)
        safe = {k: v for k, v in ds.items() if k != "csv_path"}
        return safe
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found")


@router.post("/{dataset_id}/audit")
async def audit_benchmark(dataset_id: str):
    """
    Run the full FairSight bias analysis pipeline on a benchmark dataset.
    Returns the same response shape as POST /analyze/ so the frontend
    can reuse the exact same display components.
    """
    try:
        meta = get_dataset(dataset_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found")

    try:
        df = load_dataframe(dataset_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503,
                            detail=str(e) + " — Run: python backend/data/generate_datasets.py")

    t_start = time.time()

    # FIX H6: Run flip test FIRST so its overall_flip_rate can feed into
    # the bias engine's score penalty — same pattern as analyze.py router.
    flip_result = run_flip_test(df, meta["protected_attributes"], meta["target_column"])
    overall_flip_rate = flip_result.get("overall_flip_rate", 0.0)

    # Run bias analysis using the dataset's configured columns
    metrics = run_bias_analysis(
        df,
        protected_cols=meta["protected_attributes"],
        target_col=meta["target_column"],
        label_col=meta["label_column"],
        flip_rate=overall_flip_rate,
    )

    feature_importance = get_feature_importance(
        df, meta["target_column"], meta["protected_attributes"]
    )

    # Hash the first 10KB of the file as a reproducible fingerprint
    content_sample = df.to_csv(index=False)[:10240].encode("utf-8")
    dataset_hash = hash_dataset(content_sample)

    elapsed_ms = round((time.time() - t_start) * 1000)

    return {
        "dataset_id":        dataset_id,
        "dataset_name":      meta["name"],
        "domain":            meta["domain"],
        "source":            meta["source"],
        "citation":          meta["citation"],
        "known_finding":     meta["known_finding"],
        "dataset_hash":      dataset_hash,
        "metrics":           metrics,
        "flip_test":         flip_result,
        "feature_importance":feature_importance,
        "row_count":         len(df),
        "protected_attributes": meta["protected_attributes"],
        "filename":          f"{meta['name']} (Benchmark)",
        "analysis_ms":       elapsed_ms,
        "pii_warnings":      [],
    }


@router.get("/index/summary")
async def fairness_index():
    """
    Returns live fairness scores for all available benchmark datasets.
    Used by the AI Fairness Index page and dashboard widget.
    Powers the Industry Benchmarks feature.

    FIX C1: Uses module-level BENCHMARK_REGISTRY import instead of __import__
    inside the handler, which broke in FastAPI's async context.
    """
    index = []
    for ds_id, meta in BENCHMARK_REGISTRY.items():
        from pathlib import Path
        if not Path(meta["csv_path"]).exists():
            index.append({
                "id": ds_id, "name": meta["name"], "domain": meta["domain"],
                "domain_color": meta["domain_color"],
                "fairness_score": None, "verdict": None, "available": False,
                "known_finding": meta["known_finding"],
            })
            continue
        try:
            df = load_dataframe(ds_id)
            result = run_bias_analysis(
                df, meta["protected_attributes"],
                meta["target_column"], meta["label_column"]
            )
            index.append({
                "id":             ds_id,
                "name":           meta["name"],
                "domain":         meta["domain"],
                "domain_color":   meta["domain_color"],
                "fairness_score": result["fairness_score"],
                "verdict":        result["overall_verdict"],
                "severity":       result["bias_severity"],
                "available":      True,
                "known_finding":  meta["known_finding"],
                "citation":       meta["citation"],
            })
        except Exception as e:
            index.append({
                "id": ds_id, "name": meta["name"], "domain": meta["domain"],
                "domain_color": meta["domain_color"],
                "fairness_score": None, "verdict": "ERROR",
                "available": True, "error": str(e),
                "known_finding": meta["known_finding"],
            })
    return {"index": index}
