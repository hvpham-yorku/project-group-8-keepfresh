"""JWT helpers and Bearer-token authentication for the KeepFresh API.

Tokens embed a ``jti`` claim; ``Service.is_access_token_valid`` checks the
``access_tokens`` collection so sessions can be revoked server-side (logout).
"""

import os

import jwt
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException

# HS256 expects a strong secret; override in production via JWT_SECRET.
JWT_SECRET = os.environ.get(
    "JWT_SECRET",
    "dev-keepfresh-jwt-secret-change-me-32chars-min",
)


def encode_token(username: str, jti: str, exp: datetime | None = None):
    if exp is None:
        exp = datetime.now(timezone.utc) + timedelta(minutes=30)
    payload = {
        "sub": username,
        "exp": exp,
        "jti": jti,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_token(token: str):
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])


def get_username_from_token_string(token: str, service):
    """Parse Bearer token; require ``jti`` and a valid ``access_tokens`` row."""
    if service is None:
        return None
    try:
        payload = decode_token(token)
    except Exception:
        return None
    username = payload.get("sub")
    jti = payload.get("jti")
    if not username or not jti:
        return None
    if not service.is_access_token_valid(jti, username):
        return None
    return username


def require_authenticated_user(authorization: str | None, service) -> str:
    """Validate ``Authorization: Bearer <jwt>`` and return the authenticated username.

    Raises ``HTTPException`` 401 if the header is missing or the token is invalid/revoked.
    Centralizes the same checks used across protected routes.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Not Authorized")
    token = authorization.replace("Bearer ", "").strip()
    username = get_username_from_token_string(token, service)
    if not username:
        raise HTTPException(status_code=401, detail="invalid user token")
    return username
