import re
import pandas as pd

PII_PATTERNS = {
    'email':       r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b',
    'ssn':         r'\b\d{3}-\d{2}-\d{4}\b',
    'phone':       r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
    # FIX: tightened to real card lengths (13-16 digits) rather than
    # the previous pattern which matched arbitrary numeric sequences.
    'credit_card': r'\b(?:\d[ -]*?){13,16}\b',
    # Added: Aadhaar and PAN for India-region datasets
    'aadhaar':     r'\b\d{4}\s?\d{4}\s?\d{4}\b',
    'pan':         r'\b[A-Z]{5}[0-9]{4}[A-Z]\b',
}

PII_NAME_COLS = {
    'name', 'full_name', 'first_name', 'last_name',
    'applicant_name', 'employee_name', 'customer_name',
}

# Added: address/location columns — often act as proxy features in bias detection
ADDRESS_COLS = {
    'address', 'home_address', 'street', 'city',
    'zipcode', 'zip_code', 'postal_code',
}

# Added: linkable identifier columns — not direct PII but governance risk
ID_COL_HINTS = {'id', 'uuid', 'identifier', 'account_number', 'account_no'}


def detect_pii(df: pd.DataFrame) -> dict:
    """
    Detect potential PII in dataset columns.
    Returns warnings without storing any PII data.

    Covers:
      - Personal name columns (heuristic)
      - Regex-pattern PII: email, SSN, phone, credit card, Aadhaar, PAN
      - Address/location columns (proxy feature risk)
      - Linkable identifier columns (governance risk)
    """
    warnings = []

    for col in df.columns:
        col_lower = col.lower().strip()

        # Personal name columns
        if col_lower in PII_NAME_COLS:
            warnings.append(
                f"Column '{col}' may contain personal names — consider removing before analysis"
            )

        # Address / location columns
        if col_lower in ADDRESS_COLS:
            warnings.append(
                f"Column '{col}' may contain address or location data — "
                "location is a common proxy feature for race/ethnicity"
            )

        # Linkable identifier columns
        if any(hint in col_lower for hint in ID_COL_HINTS):
            warnings.append(
                f"Column '{col}' appears to be a linkable identifier — "
                "consider removing to prevent re-identification risk"
            )

        # Regex-based pattern detection on a sample of rows
        if df[col].dtype == object:
            sample = ' '.join(df[col].dropna().astype(str).head(50).tolist())
            for pii_type, pattern in PII_PATTERNS.items():
                if re.search(pattern, sample):
                    warnings.append(
                        f"Column '{col}' may contain {pii_type.replace('_', ' ')} data"
                    )

    return {
        "has_pii_risk": len(warnings) > 0,
        "warnings": warnings[:5],   # cap at 5 to avoid noise
        "recommendation": (
            "Consider anonymizing or removing personal identifier columns before analysis. "
            "FairSight never stores raw data — only a SHA-256 hash is saved."
        ) if warnings else None,
    }