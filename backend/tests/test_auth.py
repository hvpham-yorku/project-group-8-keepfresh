from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock

import jwt

from config.auth import JWT_SECRET, encode_token, decode_token, get_username_from_token_string


def test_encode_and_decode_token_roundtrip():
    token = encode_token("test-token", jti="jid-roundtrip")
    payload = decode_token(token)

    assert payload["sub"] == "test-token"
    assert payload["jti"] == "jid-roundtrip"
    assert "exp" in payload


def test_get_username_from_token_string_validates_service():
    mock = MagicMock()
    mock.is_access_token_valid.return_value = True
    token = encode_token("user1", jti="jid-1")
    assert get_username_from_token_string(token, mock) == "user1"
    mock.is_access_token_valid.assert_called_once_with("jid-1", "user1")


def test_get_username_rejected_when_db_invalid():
    mock = MagicMock()
    mock.is_access_token_valid.return_value = False
    token = encode_token("user1", jti="jid-1")
    assert get_username_from_token_string(token, mock) is None


def test_get_username_without_service_rejected():
    token = encode_token("user1", jti="jid-1")
    assert get_username_from_token_string(token, None) is None


def test_get_username_without_jti_in_payload_rejected():
    mock = MagicMock()
    mock.is_access_token_valid.return_value = True
    token = jwt.encode(
        {
            "sub": "u",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        },
        JWT_SECRET,
        algorithm="HS256",
    )
    assert get_username_from_token_string(token, mock) is None
    mock.is_access_token_valid.assert_not_called()
