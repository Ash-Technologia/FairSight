# backend/data/preprocess_datasets.py
import pandas as pd
import numpy as np
from pathlib import Path

RAW  = Path(__file__).parent
OUT  = Path(__file__).parent

def preprocess_adult_income():
    """
    Raw format: space-separated, no header, 15 columns.
    Must add column names and create binary predicted_label + true_label.
    """
    cols = ["age","workclass","fnlwgt","education","education_num",
            "marital_status","occupation","relationship","race","gender",
            "capital_gain","capital_loss","hours_per_week","native_country","income"]

    raw_path = RAW / "adult_income_raw.csv"
    if not raw_path.exists():
        print("adult_income_raw.csv not found — skipping (use generate_datasets.py)")
        return

    # Handle both space-separated and comma-separated formats
    try:
        df = pd.read_csv(raw_path, header=None, names=cols,
                         na_values="?", skipinitialspace=True)
    except Exception:
        df = pd.read_csv(raw_path, skipinitialspace=True)
        if "income" not in df.columns:
            df.columns = cols

    df = df.dropna()
    df["gender"] = df["gender"].str.strip()
    df["race"]   = df["race"].str.strip()
    df["income"] = df["income"].str.strip().str.replace(".", "", regex=False)

    # Binary labels
    df["true_label"]      = (df["income"] == ">50K").astype(int)
    # Simulate biased prediction (adds gender gap)
    np.random.seed(42)
    noise = np.random.normal(0, 0.08, len(df))
    base_score = df["true_label"].astype(float) + noise
    base_score -= np.where(df["gender"] == "Female", 0.12, 0)
    base_score -= np.where(df["race"] == "Black", 0.08, 0)
    df["predicted_label"] = (base_score >= 0.50).astype(int)

    # Keep only relevant columns for FairSight
    keep = ["age","gender","race","education","occupation",
            "hours_per_week","capital_gain","capital_loss",
            "predicted_label","true_label"]
    df = df[[c for c in keep if c in df.columns]]

    # Cap at 5000 rows for fast API response
    df = df.sample(min(5000, len(df)), random_state=42).reset_index(drop=True)
    df.to_csv(OUT / "adult_income.csv", index=False)
    print(f"✓ adult_income.csv — {len(df)} rows")


def preprocess_compas():
    """
    Raw COMPAS has 44 columns. Keep the key fairness-relevant ones.
    Target: two_year_recid (0/1)
    Prediction: derive from decile_score
    """
    raw_path = RAW / "compas_raw.csv"
    if not raw_path.exists():
        print("compas_raw.csv not found — skipping")
        return

    df = pd.read_csv(raw_path)
    required = ["race","sex","age","priors_count","c_charge_degree",
                "two_year_recid","decile_score"]
    if not all(c in df.columns for c in required):
        print(f"⚠ COMPAS missing columns: {[c for c in required if c not in df.columns]}")
        return

    df = df[required].dropna()
    df["race"]   = df["race"].str.strip()
    df["sex"]    = df["sex"].str.strip()
    df["true_label"]      = df["two_year_recid"].astype(int)
    df["predicted_label"] = (df["decile_score"] >= 5).astype(int)

    # Rename sex → gender for consistency with FairSight engine
    df = df.rename(columns={"sex": "gender"})

    df.to_csv(OUT / "compas.csv", index=False)
    print(f"✓ compas.csv — {len(df)} rows")


def preprocess_german_credit():
    """
    Raw German Credit has no header, space-separated, coded attributes.
    If from fetch_openml, it may have readable column names already.
    """
    raw_path = RAW / "german_credit_raw.csv"
    if not raw_path.exists():
        print("german_credit_raw.csv not found — skipping")
        return

    df = pd.read_csv(raw_path)

    # openml version has 'class' as target and 'personal_status' encodes gender
    # UCI raw version: last column is credit_risk (1=good, 2=bad)
    if "class" in df.columns:
        df["credit_risk"] = (df["class"] == "good").astype(int)
    elif "credit_risk" not in df.columns:
        # Raw UCI: assign column names
        raw_cols = ["status","duration","credit_history","purpose","amount",
                    "savings","employment","installment_rate","personal_status",
                    "other_debtors","residence","property","age","other_plans",
                    "housing","existing_credits","job","dependents","telephone",
                    "foreign_worker","credit_risk"]
        df = pd.read_csv(raw_path, sep=" ", header=None, names=raw_cols)
        df["credit_risk"] = (df["credit_risk"] == 1).astype(int)

    # Age group for easier analysis
    if "age" in df.columns:
        df["age_group"] = pd.cut(df["age"],
                                  bins=[0, 30, 40, 50, 100],
                                  labels=["Under 30","30-39","40-49","50+"]).astype(str)

    df["true_label"]      = df["credit_risk"]
    # Introduce age-based bias in prediction
    np.random.seed(42)
    noise = np.random.normal(0, 0.08, len(df))
    base  = df["true_label"].astype(float) + noise
    if "age" in df.columns:
        base -= np.where(df["age"] > 40, 0.12, 0)
    df["predicted_label"] = (base >= 0.50).astype(int)

    df.to_csv(OUT / "german_credit.csv", index=False)
    print(f"✓ german_credit.csv — {len(df)} rows")


def preprocess_ibm_hr():
    raw_path = RAW / "ibm_hr_raw.csv"
    if not raw_path.exists():
        print("ibm_hr_raw.csv not found — skipping")
        return

    df = pd.read_csv(raw_path)
    if "Attrition" not in df.columns or "Gender" not in df.columns:
        print("⚠ IBM HR missing expected columns")
        return

    df["true_label"] = (df["Attrition"] == "Yes").astype(int)

    # Biased prediction adds gender + age penalty
    np.random.seed(42)
    noise = np.random.normal(0, 0.08, len(df))
    base  = df["true_label"].astype(float) + noise
    base += np.where(df["Gender"] == "Female", 0.10, 0)
    if "Age" in df.columns:
        base += np.where(df["Age"] < 30, 0.08, 0)
        df["Age_Group"] = pd.cut(df["Age"],
                                  bins=[0, 30, 40, 50, 100],
                                  labels=["Under 30","30-39","40-49","50+"]).astype(str)
    df["predicted_label"] = (base >= 0.45).astype(int)

    df.to_csv(OUT / "ibm_hr.csv", index=False)
    print(f"✓ ibm_hr.csv — {len(df)} rows")


def preprocess_diabetes():
    raw_path = RAW / "diabetes_raw.csv"
    if not raw_path.exists():
        print("diabetes_raw.csv not found — skipping")
        return

    df = pd.read_csv(raw_path)
    expected = ["Pregnancies","Glucose","BloodPressure","BMI","Age","Outcome"]
    if not all(c in df.columns for c in expected):
        print(f"⚠ Diabetes missing: {[c for c in expected if c not in df.columns]}")
        return

    df["true_label"] = df["Outcome"].astype(int)
    df["Age_Group"]  = pd.cut(df["Age"],
                               bins=[0, 35, 50, 100],
                               labels=["21-34","35-49","50+"]).astype(str)

    # Biased prediction (age over-prediction)
    np.random.seed(42)
    noise = np.random.normal(0, 0.08, len(df))
    base  = df["true_label"].astype(float) + noise
    base += np.where(df["Age"] > 49, 0.12, 0)
    base += np.where(df["Age"] > 59, 0.08, 0)
    df["predicted_label"] = (base >= 0.50).astype(int)

    df.to_csv(OUT / "diabetes.csv", index=False)
    print(f"✓ diabetes.csv — {len(df)} rows")


if __name__ == "__main__":
    preprocess_adult_income()
    preprocess_compas()
    preprocess_german_credit()
    preprocess_ibm_hr()
    preprocess_diabetes()
    print("\n✓ Preprocessing complete")
