import firebase_admin
from firebase_admin import auth, credentials
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import os
import json

_firebase_initialized = False

def _init_firebase():
    global _firebase_initialized
    if _firebase_initialized:
        return
    try:
        sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON", "")
        if sa_json:
            cred = credentials.Certificate(json.loads(sa_json))
            firebase_admin.initialize_app(cred)
            _firebase_initialized = True
    except Exception as e:
        print(f"Firebase auth init skipped: {e}")


security = HTTPBearer(auto_error=False)


def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Verify Firebase JWT token from Authorization header"""
    _init_firebase()

    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        decoded = auth.verify_id_token(credentials.credentials)
        return decoded
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token")
