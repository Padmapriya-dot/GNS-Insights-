"""In-memory rate limiting for sensitive auth endpoints."""

from __future__ import annotations

import time
from collections import defaultdict
from threading import Lock

from fastapi import HTTPException, Request, status

from app.core.config import get_settings

_lock = Lock()
_buckets: dict[str, list[float]] = defaultdict(list)


def _client_key(request: Request, email: str | None = None) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    ip = forwarded.split(",")[0].strip() if forwarded else None
    if not ip and request.client:
        ip = request.client.host
    ip = ip or "unknown"
    email_part = (email or "").lower().strip()
    return f"{ip}:{email_part}"


def check_rate_limit(
    request: Request,
    *,
    email: str | None = None,
    scope: str = "forgot_password",
    max_requests: int | None = None,
    window_seconds: int | None = None,
) -> None:
    """Raise 429 when too many requests in the configured window."""
    settings = get_settings()
    if max_requests is None or window_seconds is None:
        if scope == "login":
            max_requests = getattr(settings, "login_rate_limit", 20)
            window_seconds = getattr(settings, "login_rate_window_seconds", 300)
        else:
            max_requests = settings.forgot_password_rate_limit
            window_seconds = settings.forgot_password_rate_window_seconds
    email_part = (email or "").lower().strip()
    # Forgot-password: max N requests / window / email.
    if scope == "forgot_password" and email_part:
        key = f"{scope}:email:{email_part}"
    elif scope == "login":
        key = f"{scope}:{_client_key(request, email)}"
    else:
        key = f"{scope}:{_client_key(request, email)}"
    now = time.time()

    with _lock:
        hits = [t for t in _buckets[key] if now - t < window_seconds]
        if len(hits) >= max_requests:
            detail = (
                "Too many login attempts. Please try again later."
                if scope == "login"
                else "Too many password reset requests. Please try again later."
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=detail,
            )
        hits.append(now)
        _buckets[key] = hits
