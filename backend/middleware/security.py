from fastapi import Request, HTTPException
import time
from collections import defaultdict

# In-memory rate limiter (use Redis in production)
request_counts: dict = defaultdict(list)


async def rate_limit_middleware(request: Request, call_next):
    """Max 20 analysis requests per minute per IP"""
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()

    # Clean old entries
    request_counts[client_ip] = [t for t in request_counts[client_ip] if now - t < 60]

    if len(request_counts[client_ip]) >= 20:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Maximum 20 requests per minute."
        )

    request_counts[client_ip].append(now)
    response = await call_next(request)
    return response
