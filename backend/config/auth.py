# JWT helpers: jti in token must match a valid row in Mongo access_tokens.

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
    # sub=username, jti=session id checked in DB on each protected request.
    if exp is None:
        exp = datetime.now(timezone.utc) + timedelta(minutes=30)
    payload = {
        "sub": username,
        "exp": exp,
        "jti": jti,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_token(token: str):
    # PyJWT verifies signature and exp automatically.
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])


def get_username_from_token_string(token: str, service):
    # Return username only if JWT is valid and access_tokens says session is active.
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
    # Shared guard for protected routes: missing/invalid Bearer -> 401.
    if not authorization:
        raise HTTPException(status_code=401, detail="Not Authorized")
    token = authorization.replace("Bearer ", "").strip()
    username = get_username_from_token_string(token, service)
    if not username:
        raise HTTPException(status_code=401, detail="invalid user token")
    return username
