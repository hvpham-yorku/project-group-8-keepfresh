import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from config.auth import encode_token, decode_token, get_user_from_token


def test_encode_and_decode_token_roundtrip():
    token = encode_token("test-token")
    payload = decode_token(token)

    assert payload["sub"] == "test-token"
    assert "exp" in payload


def test_get_user_from_token_returns_username():
    token = encode_token("test-username")
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    username = get_user_from_token(credentials)

    assert username == "test-username"


def test_get_user_from_token_invalid_token_raises_http_exception():
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid.token.value")

    with pytest.raises(HTTPException) as exc:
        get_user_from_token(credentials)

    assert exc.value.status_code == 401
