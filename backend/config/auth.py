import jwt
from datetime import datetime, timedelta
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends, HTTPException

def encode_token(username: str):
    payload = {
        "sub": username,
        "exp": datetime.utcnow() + timedelta(minutes=30),
    }
    return jwt.encode(payload, "key", algorithm="HS256")

def decode_token(token: str):
    return jwt.decode(token, "key", algorithms=["HS256"])

def get_username_from_token_string(token: str):
    """Parse raw Bearer token string; returns username or None if invalid."""
    try:
        payload = decode_token(token)
        return payload.get("sub")
    except Exception:
        return None

myBearer = HTTPBearer()

def get_user_from_token(credentials: HTTPAuthorizationCredentials = Depends(myBearer)):
    try:
        payload = decode_token(credentials.credentials)
        return payload["sub"]
    except:
        raise HTTPException(status_code=401, detail="Token Not Allowed")
