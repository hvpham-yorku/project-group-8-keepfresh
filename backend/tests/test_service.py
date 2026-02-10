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
    user = User(username="test-username", password="secret")

    service.create_user(user)

    assert service.users_collection.find_one({"username": "test-username"}) is not None


def test_create_user_raises_when_username_taken():
    service = _make_service_with_fake_collection()
    service.users_collection.insert_one({"username": "test-username", "password": "secret"})
    user = User(username="test-username", password="other")

    with pytest.raises(ValueError):
        service.create_user(user)


def test_find_user_returns_matching_user():
    service = _make_service_with_fake_collection()
    doc = {"username": "test-username", "password": "secret"}
    service.users_collection.insert_one(doc)
    user = User(username="test-username", password="secret")

    found = service.find_user(user)

    assert found == doc

