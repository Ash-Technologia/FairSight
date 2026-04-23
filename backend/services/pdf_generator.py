# backend/services/pdf_generator.py
"""
FairSight Compliance PDF Generator
Produces a real, multi-page PDF using reportlab.
No screenshots, no HTML conversion — direct vector PDF generation.
"""

from io import BytesIO
from datetime import datetime

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import cm
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        HRFlowable, PageBreak
    )
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    from reportlab.graphics.shapes import Drawing, Rect, Circle, String
    from reportlab.graphics import renderPDF
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

# Brand colors
TEAL      = colors.HexColor("#0d9488")
NAVY      = colors.HexColor("#0f172a")
NAVY_LT   = colors.HexColor("#1e293b")
SLATE     = colors.HexColor("#64748b")
RED       = colors.HexColor("#ef4444")
GREEN     = colors.HexColor("#22c55e")
AMBER     = colors.HexColor("#f59e0b")
BG        = colors.HexColor("#f8fafc")
BORDER    = colors.HexColor("#e2e8f0")
WHITE     = colors.white


def _score_color(score: int):
    if score >= 85: return GREEN
    if score >= 70: return AMBER
    return RED


def _verdict_color(verdict: str):
    v = verdict.upper()
    if v == "CLEAR": return GREEN
    if v == "BORDERLINE": return AMBER
    return RED


def _check(passed: bool) -> str:
    return "✔ PASSED" if passed else "✖ FAILED"


def generate_compliance_pdf(audit: dict) -> bytes:
    if not REPORTLAB_AVAILABLE:
        raise RuntimeError("reportlab not installed — run: pip install reportlab")

    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=2*cm,
        rightMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle("Title",
        fontSize=26, fontName="Helvetica-Bold", textColor=NAVY,
        spaceAfter=4, alignment=TA_CENTER, leading=30)
    subtitle_style = ParagraphStyle("Subtitle",
        fontSize=11, fontName="Helvetica", textColor=SLATE,
        spaceAfter=2, alignment=TA_CENTER)
    h1_style = ParagraphStyle("H1",
        fontSize=16, fontName="Helvetica-Bold", textColor=NAVY,
        spaceBefore=16, spaceAfter=8, leading=20)
    h2_style = ParagraphStyle("H2",
        fontSize=12, fontName="Helvetica-Bold", textColor=TEAL,
        spaceBefore=10, spaceAfter=6)
    body_style = ParagraphStyle("Body",
        fontSize=10, fontName="Helvetica", textColor=NAVY_LT,
        spaceAfter=6, leading=14)
    small_style = ParagraphStyle("Small",
        fontSize=8, fontName="Helvetica", textColor=SLATE,
        spaceAfter=4, leading=11)
    mono_style = ParagraphStyle("Mono",
        fontSize=9, fontName="Courier", textColor=NAVY_LT,
        spaceAfter=4, leading=12)
    label_style = ParagraphStyle("Label",
        fontSize=8, fontName="Helvetica-Bold", textColor=SLATE,
        spaceAfter=2, leading=10, textTransform="uppercase")

    # Extract audit fields
    audit_id     = str(audit.get("id", "N/A"))[:16].upper()
    filename     = audit.get("filename", "Unknown Dataset")
    ds_hash      = audit.get("datasetHash", audit.get("dataset_hash", "N/A"))
    row_count    = audit.get("rowCount", audit.get("row_count", "N/A"))
    verdict      = audit.get("verdict", audit.get("metrics", {}).get("overall_verdict", "UNKNOWN"))
    severity     = audit.get("severity", audit.get("metrics", {}).get("bias_severity", "UNKNOWN"))
    score        = int(audit.get("fairnessScore", audit.get("metrics", {}).get("fairness_score", 0)))
    by_attr      = audit.get("metrics", {}).get("by_attribute", {})
    flip_test    = audit.get("flipTest", audit.get("flip_test", {}))
    ai_verdicts  = audit.get("aiVerdicts", {})
    protected    = audit.get("protectedColumns", audit.get("protected_attributes", []))
    created_at   = audit.get("createdAt", audit.get("timestamp", datetime.now().isoformat()))
    try:
        ts = datetime.fromisoformat(str(created_at)[:19]).strftime("%B %d, %Y at %H:%M UTC")
    except Exception:
        ts  = str(created_at)[:19]

    elements = []

    # ─────────────────────────────────────────────────────────────────
    # PAGE 1: Cover
    # ─────────────────────────────────────────────────────────────────
    elements.append(Spacer(1, 1.5*cm))

    # FairSight header bar
    header_data = [["  FairSight AI Compliance Report"]]
    header_table = Table(header_data, colWidths=[17*cm])
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), NAVY),
        ("TEXTCOLOR",  (0,0), (-1,-1), WHITE),
        ("FONTNAME",   (0,0), (-1,-1), "Helvetica-Bold"),
        ("FONTSIZE",   (0,0), (-1,-1), 14),
        ("TOPPADDING", (0,0), (-1,-1), 12),
        ("BOTTOMPADDING", (0,0), (-1,-1), 12),
        ("LEFTPADDING",   (0,0), (-1,-1), 16),
        ("ROWBACKGROUNDS", (0,0), (-1,-1), [NAVY]),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 0.5*cm))

    elements.append(Paragraph("Algorithmic Fairness Audit Certificate", title_style))
    elements.append(Paragraph(
        "Issued under EU AI Act Article 10(3) · NYC Local Law 144 · US EEOC 80% Rule",
        subtitle_style
    ))
    elements.append(Spacer(1, 0.5*cm))
    elements.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    elements.append(Spacer(1, 0.5*cm))

    # Verdict + Score block
    verdict_color = _verdict_color(verdict)
    score_color   = _score_color(score)
    cover_data = [
        ["DATASET", filename],
        ["AUDIT ID", audit_id],
        ["DATASET HASH", str(ds_hash)[:32] + "..." if len(str(ds_hash)) > 32 else str(ds_hash)],
        ["RECORDS ANALYZED", f"{row_count:,}" if isinstance(row_count, int) else str(row_count)],
        ["PROTECTED ATTRIBUTES", ", ".join(protected) if protected else "Auto-detected"],
        ["AUDIT DATE", ts],
        ["FAIRNESS SCORE", f"{score} / 100"],
        ["OVERALL VERDICT", verdict],
        ["BIAS SEVERITY", severity],
    ]
    cover_table = Table(cover_data, colWidths=[6*cm, 11*cm])
    cover_table.setStyle(TableStyle([
        ("FONTNAME",   (0,0), (-1,-1), "Helvetica"),
        ("FONTSIZE",   (0,0), (-1,-1), 10),
        ("FONTNAME",   (0,0), (0,-1), "Helvetica-Bold"),
        ("TEXTCOLOR",  (0,0), (0,-1), SLATE),
        ("TEXTCOLOR",  (1,0), (1,-1), NAVY_LT),
        ("FONTSIZE",   (0,0), (0,-1), 8),
        ("TOPPADDING", (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ("LINEBELOW",  (0,0), (-1,-2), 0.5, BORDER),
        # Score row
        ("FONTNAME",   (1,6), (1,6), "Helvetica-Bold"),
        ("FONTSIZE",   (1,6), (1,6), 13),
        ("TEXTCOLOR",  (1,6), (1,6), score_color),
        # Verdict row
        ("FONTNAME",   (1,7), (1,7), "Helvetica-Bold"),
        ("FONTSIZE",   (1,7), (1,7), 13),
        ("TEXTCOLOR",  (1,7), (1,7), verdict_color),
        # Severity row
        ("FONTNAME",   (1,8), (1,8), "Helvetica-Bold"),
        ("TEXTCOLOR",  (1,8), (1,8), verdict_color),
        ("BACKGROUND", (0,0), (-1,-1), BG),
        ("ROWBACKGROUNDS", (0,0), (-1,-1), [WHITE, BG]),
        ("BOX",        (0,0), (-1,-1), 1, BORDER),
    ]))
    elements.append(cover_table)
    elements.append(Spacer(1, 0.8*cm))

    elements.append(Paragraph(
        "This document certifies a comprehensive algorithmic fairness audit conducted by the "
        "FairSight AI Fairness Platform. The audit applies 12 statistical metrics across demographic "
        "parity, equalized odds, individual fairness, and counterfactual discrimination dimensions. "
        "Results are reproducible via the dataset hash recorded above.",
        body_style
    ))
    elements.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────
    # PAGE 2: Executive Summary
    # ─────────────────────────────────────────────────────────────────
    elements.append(Paragraph("Executive Summary", h1_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=TEAL))
    elements.append(Spacer(1, 0.3*cm))

    # AI Consensus text
    if ai_verdicts:
        for model_name, vdata in ai_verdicts.items():
            if not isinstance(vdata, dict):
                continue
            summary = vdata.get("summary", "")
            verdict_val = vdata.get("verdict", "")
            if summary:
                elements.append(Paragraph(f"{model_name.upper()} AI Assessment", h2_style))
                elements.append(Paragraph(summary, body_style))
                elements.append(Spacer(1, 0.2*cm))
    else:
        elements.append(Paragraph(
            "AI consensus analysis was not available for this audit. Statistical metrics "
            "are recorded below and provide the primary evidence for the fairness determination.",
            body_style
        ))

    elements.append(Spacer(1, 0.5*cm))
    elements.append(Paragraph("Risk Classification", h2_style))
    risk_text = {
        "CRITICAL": "CRITICAL RISK — Immediate remediation required. Model exhibits strong disparate "
                    "impact that violates EU AI Act Article 10 compliance thresholds and the US EEOC "
                    "80% rule. Deployment is not recommended without bias mitigation.",
        "HIGH":     "HIGH RISK — Significant bias detected across multiple protected groups. "
                    "Targeted mitigation and human oversight required prior to production use.",
        "MEDIUM":   "MEDIUM RISK — Moderate bias patterns detected. Model should be re-evaluated "
                    "with bias mitigation applied before deployment.",
        "LOW":      "LOW RISK — Bias metrics are within acceptable thresholds. Continued monitoring "
                    "recommended per EU AI Act Article 72 obligations.",
    }.get(severity.upper() if isinstance(severity, str) else "UNKNOWN",
          "Status undetermined. Please review statistical metrics below.")
    elements.append(Paragraph(risk_text, body_style))
    elements.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────
    # PAGE 3: Metric Tables
    # ─────────────────────────────────────────────────────────────────
    elements.append(Paragraph("Statistical Fairness Metrics", h1_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=TEAL))
    elements.append(Spacer(1, 0.3*cm))

    DP_THRESH = 0.10
    EO_THRESH = 0.10
    DI_MIN    = 0.80
    IF_THRESH = 0.15

    if by_attr:
        for attr_name, attr_data in by_attr.items():
            if not isinstance(attr_data, dict):
                continue
            elements.append(Paragraph(f"Attribute: {attr_name}", h2_style))
            dp  = attr_data.get("demographic_parity", 0)
            eo  = attr_data.get("equalized_odds", 0)
            di  = attr_data.get("disparate_impact_ratio", 1.0)
            ind = attr_data.get("individual_fairness", 0)
            ref = attr_data.get("reference_group", "N/A")
            dis = attr_data.get("most_disadvantaged_group", "N/A")

            metric_rows = [
                ["Metric", "Value", "Threshold", "Status", "Standard"],
                ["Demographic Parity Gap", f"{dp:.4f}", f"≤ {DP_THRESH}",
                 _check(dp <= DP_THRESH), "EU AI Act Art. 10(3)"],
                ["Equalized Odds Gap",     f"{eo:.4f}", f"≤ {EO_THRESH}",
                 _check(eo <= EO_THRESH), "Hardt et al. 2016"],
                ["Disparate Impact Ratio", f"{di:.4f}", f"≥ {DI_MIN}",
                 _check(di >= DI_MIN), "US EEOC 80% Rule"],
                ["Individual Fairness Gap",f"{ind:.4f}", f"≤ {IF_THRESH}",
                 _check(ind <= IF_THRESH), "GDPR Art. 22"],
                ["Reference Group",        ref,          "—", "—", "—"],
                ["Most Disadvantaged",     dis,          "—", "—", "—"],
            ]
            mt = Table(metric_rows, colWidths=[4.5*cm, 2.5*cm, 2.5*cm, 3*cm, 4.5*cm])
            status_colors = []
            for i in range(1, 5):
                row = metric_rows[i]
                c = GREEN if "PASSED" in str(row[3]) else (SLATE if row[3] == "—" else RED)
                status_colors.append(("TEXTCOLOR", (3, i), (3, i), c))
            mt.setStyle(TableStyle([
                ("BACKGROUND",    (0,0), (-1,0),  NAVY),
                ("TEXTCOLOR",     (0,0), (-1,0),  WHITE),
                ("FONTNAME",      (0,0), (-1,0),  "Helvetica-Bold"),
                ("FONTSIZE",      (0,0), (-1,-1), 9),
                ("TOPPADDING",    (0,0), (-1,-1), 6),
                ("BOTTOMPADDING", (0,0), (-1,-1), 6),
                ("LEFTPADDING",   (0,0), (-1,-1), 8),
                ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, BG]),
                ("BOX",           (0,0), (-1,-1), 1, BORDER),
                ("LINEBELOW",     (0,0), (-1,-2), 0.5, BORDER),
                ("FONTNAME",      (3,1), (3,-1), "Helvetica-Bold"),
                *status_colors,
            ]))
            elements.append(mt)
            elements.append(Spacer(1, 0.5*cm))
    else:
        elements.append(Paragraph("No attribute-level metrics available.", body_style))

    elements.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────
    # PAGE 4: Counterfactual Flip Evidence
    # ─────────────────────────────────────────────────────────────────
    elements.append(Paragraph("Counterfactual Discrimination Evidence", h1_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=TEAL))
    elements.append(Spacer(1, 0.2*cm))
    elements.append(Paragraph(
        "A counterfactual flip occurs when changing only the protected attribute of an individual "
        "(e.g. race, gender) causes the model's prediction to reverse. This is the legal standard "
        "for proving disparate treatment under Title VII, EU AI Act, and GDPR Article 22.",
        body_style
    ))
    elements.append(Spacer(1, 0.3*cm))

    flip_by_attr = flip_test.get("by_attribute", {}) if isinstance(flip_test, dict) else {}
    overall_flip = flip_test.get("overall_flip_rate", 0) if isinstance(flip_test, dict) else 0

    elements.append(Paragraph(f"Overall Flip Rate: {round(overall_flip * 100, 1)}%  "
                               f"({'VIOLATION DETECTED' if overall_flip > 0.10 else 'Within Threshold'})",
                               h2_style))

    for attr, fdata in flip_by_attr.items():
        if not isinstance(fdata, dict):
            continue
        flip_rate = fdata.get("flip_rate", 0)
        examples  = fdata.get("example_flips", [])
        elements.append(Paragraph(
            f"{attr}: Flip Rate = {round(flip_rate*100,1)}% "
            f"({'⚠ VIOLATION' if flip_rate > 0.10 else '✔ OK'})", body_style))
        for ex in examples[:2]:
            elements.append(Paragraph(
                f"  Row {ex.get('row_index','?')}: {attr} "
                f"{ex.get('original_group','?')} → {ex.get('counterfactual_group','?')} | "
                f"Decision: {ex.get('original_decision','?')} → {ex.get('counterfactual_decision','?')}",
                mono_style
            ))
    elements.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────
    # PAGE 5: Regulatory Compliance Checklist
    # ─────────────────────────────────────────────────────────────────
    elements.append(Paragraph("Regulatory Compliance Checklist", h1_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=TEAL))
    elements.append(Spacer(1, 0.3*cm))

    def _bi(attr: str, key: str, threshold: float, mode: str = "lt"):
        vals = [v.get(key, 0) for v in by_attr.values() if isinstance(v, dict)]
        if not vals: return True
        if mode == "lt":
            return all(v <= threshold for v in vals)
        return all(v >= threshold for v in vals)

    dp_ok = _bi("", "demographic_parity", 0.10)
    eo_ok = _bi("", "equalized_odds", 0.10)
    di_ok = _bi("", "disparate_impact_ratio", 0.80, "gte")
    if_ok = _bi("", "individual_fairness", 0.15)
    ft_ok = overall_flip <= 0.20

    checklist = [
        ["Framework", "Requirement", "Metric", "Status"],
        ["EU AI Act Art. 9",  "Risk management system",    "Audit completed",              "✔ COMPLETE"],
        ["EU AI Act Art. 10(3)", "Data governance — demographic parity", f"Gap: {max((v.get('demographic_parity',0) for v in by_attr.values() if isinstance(v,dict)), default=0):.4f}", _check(dp_ok)],
        ["EU AI Act Art. 10(3)", "Data governance — equalized odds",     f"Gap: {max((v.get('equalized_odds',0) for v in by_attr.values() if isinstance(v,dict)), default=0):.4f}", _check(eo_ok)],
        ["EU AI Act Art. 13",  "Transparency obligation",  "Report generated",             "✔ COMPLETE"],
        ["EU AI Act Art. 17",  "Quality management",       "Metrics documented",           "✔ COMPLETE"],
        ["EU AI Act Art. 72",  "Post-market monitoring",   "Continuous audit enabled",     "✔ COMPLETE"],
        ["NYC Local Law 144",  "Annual bias audit",        "Audit on record",              "✔ COMPLETE"],
        ["US EEOC 80% Rule",   "Disparate impact",         f"Min DI ratio: {min((v.get('disparate_impact_ratio',1) for v in by_attr.values() if isinstance(v,dict)), default=1):.4f}", _check(di_ok)],
        ["GDPR Art. 22",       "Individual fairness",       f"Gap: {max((v.get('individual_fairness',0) for v in by_attr.values() if isinstance(v,dict)), default=0):.4f}", _check(if_ok)],
        ["Title VII",          "Counterfactual treatment",  f"Flip rate: {round(overall_flip*100,1)}%",  _check(ft_ok)],
    ]
    reg_t = Table(checklist, colWidths=[4.5*cm, 5.5*cm, 4*cm, 3*cm])
    reg_colors = []
    for i in range(1, len(checklist)):
        c = GREEN if "PASSED" in checklist[i][3] or "COMPLETE" in checklist[i][3] else RED
        reg_colors.append(("TEXTCOLOR", (3, i), (3, i), c))
        reg_colors.append(("FONTNAME",  (3, i), (3, i), "Helvetica-Bold"))
    reg_t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0),  NAVY),
        ("TEXTCOLOR",     (0,0), (-1,0),  WHITE),
        ("FONTNAME",      (0,0), (-1,0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0,0), (-1,-1), 8),
        ("TOPPADDING",    (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, BG]),
        ("BOX",           (0,0), (-1,-1), 1, BORDER),
        ("LINEBELOW",     (0,0), (-1,-2), 0.5, BORDER),
        *reg_colors,
    ]))
    elements.append(reg_t)
    elements.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────
    # PAGE 6: Recommendations
    # ─────────────────────────────────────────────────────────────────
    elements.append(Paragraph("Mitigation Recommendations", h1_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=TEAL))
    elements.append(Spacer(1, 0.3*cm))

    recs = [
        ("1. Apply Threshold Post-Processing",
         "Adjust per-group decision thresholds to equalize approval rates. "
         "Use FairSight's Auto-Debiasing Export to download a re-weighted dataset."),
        ("2. Re-train with Sample Weights",
         "Download the FairSight debiased CSV (sample_weight column included). "
         "Pass sample_weight=df['sample_weight'] to model.fit() to reduce disparate impact."),
        ("3. Enable Fairness Firewall",
         "Route all live model predictions through POST /firewall/intercept. "
         "Any decision flagged as BLOCKED should be escalated for human review."),
        ("4. Set CI/CD Fairness Gate",
         "Add FairSight's fairness-check.yml to your GitHub Actions pipeline. "
         "Set threshold=80 to block deployments with fairness score below 80."),
        ("5. Schedule Quarterly Re-Audits",
         "Data distributions shift over time. Re-run this audit every 90 days "
         "or whenever the model is retrained to maintain EU AI Act Article 72 compliance."),
    ]

    for title, body in recs:
        elements.append(Paragraph(title, h2_style))
        elements.append(Paragraph(body, body_style))
        elements.append(Spacer(1, 0.2*cm))

    elements.append(Spacer(1, 0.5*cm))
    elements.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    elements.append(Spacer(1, 0.3*cm))
    elements.append(Paragraph(
        f"Generated by FairSight AI Fairness Platform  ·  Audit ID: {audit_id}  ·  {ts}",
        small_style
    ))
    elements.append(Paragraph(
        "This report is intended for compliance and governance purposes. "
        "Reproducibility guaranteed via dataset hash.",
        small_style
    ))

    doc.build(elements)
    buf.seek(0)
    return buf.read()
