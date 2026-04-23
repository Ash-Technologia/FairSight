#!/bin/bash
# FairSight Dataset Bootstrap
# Run from project root: bash backend/data/bootstrap.sh

set -e
echo "FairSight — Dataset Bootstrap"
echo "=============================="

cd backend/data

# Try to download real datasets
python3 - << 'PYEOF'
import subprocess, sys

def try_fetch(name, commands):
    for cmd in commands:
        try:
            result = subprocess.run(
                ["python3", "-c", cmd],
                capture_output=True, text=True, timeout=30
            )
            if result.returncode == 0:
                print(f"✓ {name} downloaded")
                return True
        except Exception:
            pass
    print(f"  {name}: download failed — will use synthetic generator")
    return False

try_fetch("sklearn/openml", [
    "from sklearn.datasets import fetch_openml; print('sklearn ok')"
])

# Try each dataset
success = {}
success["adult"] = try_fetch("Adult Income", [
    "from sklearn.datasets import fetch_openml; d=fetch_openml('adult',version=2,as_frame=True); d.frame.to_csv('adult_income_raw.csv',index=False); print('ok')",
    "wget -q https://archive.ics.uci.edu/ml/machine-learning-databases/adult/adult.data -O adult_income_raw.csv",
    "from ucimlrepo import fetch_ucirepo; d = fetch_ucirepo(id=2); d.data.original.to_csv('adult_income_raw.csv', index=False)"
])
success["compas"] = try_fetch("COMPAS Recidivism", [
    "wget -q https://raw.githubusercontent.com/propublica/compas-analysis/master/compas-scores-two-years.csv -O compas_raw.csv"
])
success["german"] = try_fetch("German Credit", [
    "from sklearn.datasets import fetch_openml; d=fetch_openml('credit-g',version=1,as_frame=True); d.frame.to_csv('german_credit_raw.csv',index=False); print('ok')",
    "from ucimlrepo import fetch_ucirepo; d = fetch_ucirepo(id=144); d.data.original.to_csv('german_credit_raw.csv', index=False)"
])
success["ibm_hr"] = try_fetch("IBM HR", [
    "wget -q https://raw.githubusercontent.com/IBM/employee-attrition-aif360/master/data/emp_attrition.csv -O ibm_hr_raw.csv"
])
success["diabetes"] = try_fetch("Diabetes", [
    "from sklearn.datasets import fetch_openml; d=fetch_openml('diabetes',version=1,as_frame=True); d.frame.to_csv('diabetes_raw.csv',index=False); print('ok')",
    "from ucimlrepo import fetch_ucirepo; d = fetch_ucirepo(id=34); d.data.original.to_csv('diabetes_raw.csv', index=False)"
])

print("\nRunning preprocessing for downloaded datasets...")
import subprocess
subprocess.run(["python3", "preprocess_datasets.py"])
PYEOF

echo ""
echo "Running synthetic generator for any missing datasets..."
python3 generate_datasets.py

echo ""
echo "Verifying all 5 dataset files exist..."
python3 - << 'PYEOF'
from pathlib import Path
required = ["adult_income.csv","compas.csv","german_credit.csv","ibm_hr.csv","diabetes.csv"]
missing = [f for f in required if not Path(f).exists()]
if missing:
    print(f"ERROR: Missing: {missing}")
    exit(1)
else:
    for f in required:
        import pandas as pd
        df = pd.read_csv(f)
        print(f"✓ {f}: {len(df)} rows, {list(df.columns[:4])}...")
    print("\n✓ All 5 benchmark datasets ready")
PYEOF
