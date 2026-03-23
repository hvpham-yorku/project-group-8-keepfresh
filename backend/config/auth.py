import os

import jwt
from datetime import datetime, timedelta, timezone

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
