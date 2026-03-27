from datetime import datetime, timedelta, timezone

import pytest

from models.user import User
from services.service import Service


class FakeCollection:
    def __init__(self):
        self._docs = []

    def find_one(self, query):
        for doc in self._docs:
            if all(doc.get(k) == v for k, v in query.items()):
                return doc
        return None

    def insert_one(self, doc):
        self._docs.append(doc)

    def update_one(self, query, update):
        for doc in self._docs:
            if all(doc.get(k) == v for k, v in query.items()):
                if "$set" in update:
                    doc.update(update["$set"])
                return type("Result", (), {"modified_count": 1})()
        return type("Result", (), {"modified_count": 0})()


class FakeAccessTokensCollection:
    def __init__(self):
        self._docs = []

    def create_index(self, *args, **kwargs):
        return None

    def insert_one(self, doc):
        self._docs.append(dict(doc))

    def find_one(self, query):
        for doc in self._docs:
            if all(doc.get(k) == v for k, v in query.items()):
                return doc
        return None

    def update_one(self, query, update):
        for doc in self._docs:
            if all(doc.get(k) == v for k, v in query.items()):
                if "$set" in update:
                    doc.update(update["$set"])
                return type("Result", (), {"modified_count": 1})()
        return type("Result", (), {"modified_count": 0})()


def _make_service_with_fake_collection():
    service = Service.__new__(Service)
    service.client = None
    service.db = None
    service.users_collection = FakeCollection()
    return service


def test_user_exists_by_username():
    service = _make_service_with_fake_collection()
    service.users_collection.insert_one({"username": "test-username", "password": "secret"})

    assert service.user_exists_by_username("test-username") is True
    assert service.user_exists_by_username("test-username-2") is False


def test_create_user_inserts_when_not_existing():
    service = _make_service_with_fake_collection()
    user = User(
        username="test-username",
        password="secret",
        email="test@example.com",
        notification_days_before_expiry=7,
        custom_notification_days_before_expiry=4,
    )

    service.create_user(user)

    saved = service.users_collection.find_one({"username": "test-username"})
    assert saved is not None
    assert saved["email"] == "test@example.com"
    assert saved["notification_days_before_expiry"] == 7
    assert saved["custom_notification_days_before_expiry"] == 4


def test_create_user_raises_when_username_taken():
    service = _make_service_with_fake_collection()
    service.users_collection.insert_one({"username": "test-username", "password": "secret", "email": "test@example.com"})
    user = User(
        username="test-username",
        password="other",
        email="test@example.com",
        notification_days_before_expiry=7,
        custom_notification_days_before_expiry=None,
    )

    with pytest.raises(ValueError):
        service.create_user(user)


def test_find_user_returns_matching_user():
    service = _make_service_with_fake_collection()
    doc = {"username": "test-username", "password": "secret", "email": "test@example.com"}
    service.users_collection.insert_one(doc)
    user = User(
        username="test-username",
        password="secret",
        email="test@example.com",
        notification_days_before_expiry=7,
        custom_notification_days_before_expiry=None,
    )

    found = service.find_user(user)

    assert found == doc


def _service_with_access_tokens():
    service = Service.__new__(Service)
    service.access_tokens_collection = FakeAccessTokensCollection()
    return service


def test_create_and_validate_access_token():
    service = _service_with_access_tokens()
    exp = datetime.now(timezone.utc) + timedelta(hours=1)
    service.create_access_token("jti-1", "alice", exp)
    assert service.is_access_token_valid("jti-1", "alice") is True
    assert service.is_access_token_valid("jti-1", "bob") is False
    assert service.is_access_token_valid("missing", "alice") is False


def test_access_token_expired():
    service = _service_with_access_tokens()
    exp = datetime.now(timezone.utc) - timedelta(minutes=1)
    service.create_access_token("jti-exp", "alice", exp)
    assert service.is_access_token_valid("jti-exp", "alice") is False


def test_revoke_access_token():
    service = _service_with_access_tokens()
    exp = datetime.now(timezone.utc) + timedelta(hours=1)
    service.create_access_token("jti-r", "alice", exp)
    assert service.revoke_access_token("jti-r", "alice") is True
    assert service.is_access_token_valid("jti-r", "alice") is False


def test_update_user_notification_preferences():
    service = _make_service_with_fake_collection()
    service.users_collection.insert_one({
        "username": "test-username",
        "password": "secret",
        "email": "test@example.com",
        "notification_days_before_expiry": 7,
        "custom_notification_days_before_expiry": None,
    })

    updated = service.update_user_notification_preferences(
        "test-username", notification_days_before_expiry=5, custom_notification_days_before_expiry=2
    )

    assert updated["notification_days_before_expiry"] == 5
    assert updated["custom_notification_days_before_expiry"] == 2


