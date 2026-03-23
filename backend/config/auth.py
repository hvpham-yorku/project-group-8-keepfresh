import jwt
from datetime import datetime, timedelta, timezone


def encode_token(username: str, jti: str, exp: datetime | None = None):
    if exp is None:
        exp = datetime.now(timezone.utc) + timedelta(minutes=30)
    payload = {
        "sub": username,
        "exp": exp,
        "jti": jti,
    }
    return jwt.encode(payload, "key", algorithm="HS256")


def decode_token(token: str):
    return jwt.decode(token, "key", algorithms=["HS256"])


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
