import pytest
from pydantic import ValidationError

from models.user import User


def test_user_model_accepts_valid_data():
    user = User(username="test-username", password="secret")

    assert user.username == "test-username"
    assert user.password == "secret"


def test_user_model_rejects_short_username():
    with pytest.raises(ValidationError):
        User(username="ab", password="secret")


def test_user_model_rejects_short_password():
    with pytest.raises(ValidationError):
        User(username="test-username", password="xy")

