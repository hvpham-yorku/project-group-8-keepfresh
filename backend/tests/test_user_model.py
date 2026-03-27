import pytest
from pydantic import ValidationError

from models.user import User


def test_user_model_accepts_valid_data():
    user = User(
        username="test-username",
        password="secret",
        email="test@example.com",
        notification_days_before_expiry=7,
        custom_notification_days_before_expiry=4,
    )

    assert user.username == "test-username"
    assert user.password == "secret"
    assert user.email == "test@example.com"
    assert user.notification_days_before_expiry == 7
    assert user.custom_notification_days_before_expiry == 4


def test_user_model_rejects_short_username():
    with pytest.raises(ValidationError):
        User(username="ab", password="secret", email="test@example.com")


def test_user_model_rejects_short_password():
    with pytest.raises(ValidationError):
        User(username="test-username", password="xy", email="test@example.com")

