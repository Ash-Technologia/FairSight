import hashlib


def hash_dataset(content: bytes) -> str:
    """
    SHA-256 hash of dataset content for audit trail.
    Allows verifying dataset identity without storing PII.
    """
    return "sha256:" + hashlib.sha256(content).hexdigest()
