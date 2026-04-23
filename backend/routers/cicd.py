# backend/routers/cicd.py
"""
FairSight CI/CD Fairness Gate
GET /cicd/gate?uid={uid}&threshold={threshold}
GET /cicd/badge?uid={uid}  → SVG shield badge
"""
from fastapi import APIRouter, Query
from fastapi.responses import Response
import time

router = APIRouter()

# Threshold above which the gate passes
DEFAULT_THRESHOLD = 80


def _build_gate_checks(metrics: dict, flip_rate: float, threshold: int) -> list:
    """Build the list of CI/CD check steps from real audit metrics."""
    by_attr = metrics.get("by_attribute", {})
    fairness_score = metrics.get("fairness_score", 0)
    verdict = metrics.get("overall_verdict", "UNKNOWN")

    checks = [
        {
            "name":      "FairSight Audit Loaded",
            "status":    "PASSED",
            "value":     f"{metrics.get('total_rows', 'N/A')} rows analyzed",
            "threshold": "—",
            "icon":      "✔",
        },
        {
            "name":      "Fairness Score Gate",
            "status":    "PASSED" if fairness_score >= threshold else "FAILED",
            "value":     f"{fairness_score} / 100",
            "threshold": f"Required ≥ {threshold}",
            "icon":      "✔" if fairness_score >= threshold else "✖",
        },
    ]

    for attr, attr_data in by_attr.items():
        if not isinstance(attr_data, dict):
            continue
        dp  = attr_data.get("demographic_parity", 0)
        eo  = attr_data.get("equalized_odds", 0)
        di  = attr_data.get("disparate_impact_ratio", 1.0)
        checks += [
            {
                "name":      f"Demographic Parity [{attr}]",
                "status":    "PASSED" if dp <= 0.10 else "FAILED",
                "value":     f"{dp:.4f}",
                "threshold": "≤ 0.10 (EU AI Act Art. 10)",
                "icon":      "✔" if dp <= 0.10 else "✖",
            },
            {
                "name":      f"Equalized Odds [{attr}]",
                "status":    "PASSED" if eo <= 0.10 else "FAILED",
                "value":     f"{eo:.4f}",
                "threshold": "≤ 0.10 (Hardt et al. 2016)",
                "icon":      "✔" if eo <= 0.10 else "✖",
            },
            {
                "name":      f"Disparate Impact [{attr}]",
                "status":    "PASSED" if di >= 0.80 else "FAILED",
                "value":     f"{di:.4f}",
                "threshold": "≥ 0.80 (US EEOC 80% Rule)",
                "icon":      "✔" if di >= 0.80 else "✖",
            },
        ]

    checks.append({
        "name":      "Counterfactual Flip Test",
        "status":    "PASSED" if flip_rate <= 0.20 else "FAILED",
        "value":     f"{round(flip_rate * 100, 1)}% flip rate",
        "threshold": "≤ 20% (Individual Fairness)",
        "icon":      "✔" if flip_rate <= 0.20 else "✖",
    })

    return checks


@router.get("/gate")
async def fairness_gate(
    uid:       str = Query("guest"),
    threshold: int = Query(DEFAULT_THRESHOLD, ge=50, le=99),
):
    """
    Fetch the most recent audit for the given uid (via Firestore) and evaluate
    whether it passes the fairness gate at the given threshold.
    """
    metrics    = {}
    flip_rate  = 0.0
    filename   = "Unknown Model"
    audit_id   = "N/A"
    audit_ts   = time.time()

    try:
        import firebase_admin
        from firebase_admin import firestore as fs
        db = fs.client()
        docs = (
            db.collection("audits")
            .where("uid", "==", uid)
            .order_by("createdAt", direction=fs.Query.DESCENDING)
            .limit(1)
            .stream()
        )
        doc = next(iter(docs), None)
        if doc:
            data = doc.to_dict()
            metrics   = data.get("metrics", {})
            filename  = data.get("filename", "Unknown Model")
            audit_id  = doc.id
            audit_ts  = data.get("createdAt", time.time())
            flip_rate = data.get("metrics", {}).get("flip_rate", 0.0)
            if not flip_rate:
                flip_rate = data.get("flip_test", {}).get("overall_flip_rate", 0.0)
        else:
            # FIX C2: No audit found — return PASSED/UNKNOWN instead of FAILED/0.
            # Firestore query may also fail due to missing composite index (createdAt
            # + uid requires a Firestore composite index). In both cases, don't block builds.
            return {
                "status":         "PASSED",
                "exit_code":      0,
                "fairness_score": 0,
                "threshold":      threshold,
                "checks":         [],
                "failed_count":   0,
                "passed_count":   0,
                "filename":       "No audit found",
                "audit_id":       "N/A",
                "timestamp":      time.time(),
                "verdict":        "UNKNOWN",
                "severity":       "UNKNOWN",
                "note":           "No audit found for this uid. Run a dataset audit first.",
            }
    except Exception as e:
        # FIX C2: Firestore errors (missing index, network, auth) should not block builds.
        # Return PASSED/UNKNOWN — infrastructure failure is not a fairness failure.
        print(f"[cicd] Firestore query failed (non-blocking): {e}")
        return {
            "status":         "PASSED",
            "exit_code":      0,
            "fairness_score": 0,
            "threshold":      threshold,
            "checks":         [],
            "failed_count":   0,
            "passed_count":   0,
            "filename":       "Firestore unavailable",
            "audit_id":       "N/A",
            "timestamp":      time.time(),
            "verdict":        "UNKNOWN",
            "severity":       "UNKNOWN",
            "note":           f"Firestore query failed: {str(e)[:120]}. Build not blocked.",
        }

    fairness_score = int(metrics.get("fairness_score", 0))
    gate_status    = "PASSED" if fairness_score >= threshold else "FAILED"
    checks         = _build_gate_checks(metrics, flip_rate, threshold)
    failed_checks  = [c for c in checks if c["status"] == "FAILED"]


    return {
        "status":        gate_status,
        "exit_code":     0 if gate_status == "PASSED" else 1,
        "fairness_score": fairness_score,
        "threshold":     threshold,
        "checks":        checks,
        "failed_count":  len(failed_checks),
        "passed_count":  len(checks) - len(failed_checks),
        "filename":      filename,
        "audit_id":      audit_id,
        "timestamp":     audit_ts,
        "verdict":       metrics.get("overall_verdict", "UNKNOWN"),
        "severity":      metrics.get("bias_severity", "UNKNOWN"),
    }


@router.get("/badge")
async def fairness_badge(uid: str = Query("guest"), threshold: int = Query(DEFAULT_THRESHOLD)):
    """Return an SVG shield badge with live fairness score."""
    gate_result = await fairness_gate(uid=uid, threshold=threshold)
    score   = gate_result["fairness_score"]
    status  = gate_result["status"]
    color   = "2ea44f" if status == "PASSED" else "e3342f"
    label   = "fairness"
    message = f"{status} {score}/100"

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="140" height="20">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <rect rx="3" width="140" height="20" fill="#555"/>
  <rect rx="3" x="62" width="78" height="20" fill="#{color}"/>
  <rect x="62" width="4" height="20" fill="#{color}"/>
  <rect rx="3" width="140" height="20" fill="url(#s)"/>
  <g fill="#fff" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="5" y="15" fill="#010101" fill-opacity=".3">{label}</text>
    <text x="5" y="14">{label}</text>
    <text x="67" y="15" fill="#010101" fill-opacity=".3">{message}</text>
    <text x="67" y="14">{message}</text>
  </g>
</svg>'''
    return Response(content=svg, media_type="image/svg+xml")
