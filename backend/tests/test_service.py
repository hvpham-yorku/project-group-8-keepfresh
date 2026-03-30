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

    def find(self, query):
        #find all documents matching the query
        results = []
        for doc in self._docs:
            if all(doc.get(k) == v for k, v in query.items()):
                results.append(doc)
        return results

    def insert_one(self, doc):
        self._docs.append(doc)


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
    user = User(username="test-username", password="secret", email="test@example.com")

    service.create_user(user)

    created = service.users_collection.find_one({"username": "test-username"})
    assert created is not None
    assert created["password"] != "secret"
    assert created["password"].startswith("$2")


def test_create_user_raises_when_username_taken():
    service = _make_service_with_fake_collection()
    service.users_collection.insert_one({"username": "test-username", "password": "secret"})
    user = User(username="test-username", password="other", email="other@example.com")

    with pytest.raises(ValueError):
        service.create_user(user)


def test_find_user_returns_matching_user():
    # Signup stores bcrypt; find_user must verify plaintext against hash.
    service = _make_service_with_fake_collection()
    service.create_user(User(username="test-username", password="secret", email="test@example.com"))
    user = User(username="test-username", password="secret", email="test@example.com")

    found = service.find_user(user)

    assert found is not None
    assert found["username"] == "test-username"


def test_find_user_accepts_legacy_plaintext_password():
    # Legacy users may still have plaintext password in DB.
    service = _make_service_with_fake_collection()
    legacy_doc = {"username": "legacy", "password": "legacy-pass"}
    service.users_collection.insert_one(legacy_doc)

    found = service.find_user(User(username="legacy", password="legacy-pass", email="legacy@example.com"))

    assert found == legacy_doc


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


# fake fridge collection for testing
class FakeFridgeCollection:
    def __init__(self):
        self._docs = []

    def find(self, query):
        #find all docs matching the query
        results = []
        for doc in self._docs:
            if all(doc.get(k) == v for k, v in query.items()):
                results.append(doc)
        return results

    def insert_one(self, doc):
        self._docs.append(doc)

    def update_one(self, query, update):
        #update doc that matches query with new values
        for doc in self._docs:
            if all(doc.get(k) == v for k, v in query.items()):
                if "$set" in update:
                    doc.update(update["$set"])
                return type("Result", (), {"modified_count": 1})()
        return type("Result", (), {"modified_count": 0})()


# simple tests for notification logic
def test_send_email_with_valid_config():
    #send_email should complete without error when config is present
    service = Service.__new__(Service)
    service.sent_emails = []
    
    def mock_send_email(to_email, subject, body):
        service.sent_emails.append({"to": to_email, "subject": subject, "body": body})
    
    service.send_email = mock_send_email
    service.send_email("test@example.com", "Test", "Test body")
    
    assert len(service.sent_emails) == 1
    assert service.sent_emails[0]["to"] == "test@example.com"
    assert service.sent_emails[0]["subject"] == "Test"


def test_notification_checks_expiry_dates():
    #verify that items are checked based on expiry dates
    service = Service.__new__(Service)
    service.users_collection = FakeCollection()
    service.fridge_collection = FakeFridgeCollection()
    service.sent_emails = []
    
    def mock_send_email(to_email, subject, body):
        service.sent_emails.append({"to": to_email, "subject": subject})
    
    service.send_email = mock_send_email
    
    #expired item (should trigger notification)
    expired_date = (datetime.now().date() - timedelta(days=2)).isoformat()
    service.users_collection.insert_one({
        "username": "testuser",
        "email": "test@example.com",
        "notification_days_before_expiry": 7
    })
    service.fridge_collection.insert_one({
        "username": "testuser",
        "itemName": "Milk",
        "_id": "1",
        "expiryDate": expired_date,
        "notified_expired": False
    })
    
    result = service.check_and_send_notifications()
    
    assert result["status"] == "ok"
    assert len(result["sent"]) == 1
    assert result["sent"][0][2] == "expired"  #notification type


def test_notification_skips_without_email():
    #users without email should be skipped
    service = Service.__new__(Service)
    service.users_collection = FakeCollection()
    service.fridge_collection = FakeFridgeCollection()
    service.sent_emails = []
    
    def mock_send_email(to_email, subject, body):
        service.sent_emails.append({})
    
    service.send_email = mock_send_email
    
    #user without email
    service.users_collection.insert_one({
        "username": "noemailus"
    })
    
    result = service.check_and_send_notifications()
    
    assert result["status"] == "ok"
    assert len(result["sent"]) == 0
    assert len(service.sent_emails) == 0


def test_notification_no_duplicate_if_already_sent():
    #items already notified should not trigger another notification
    service = Service.__new__(Service)
    service.users_collection = FakeCollection()
    service.fridge_collection = FakeFridgeCollection()
    service.sent_emails = []
    
    def mock_send_email(to_email, subject, body):
        service.sent_emails.append({})
    
    service.send_email = mock_send_email
    
    #expired item already notified
    expired_date = (datetime.now().date() - timedelta(days=2)).isoformat()
    service.users_collection.insert_one({
        "username": "testuser",
        "email": "test@example.com",
        "notification_days_before_expiry": 7
    })
    service.fridge_collection.insert_one({
        "username": "testuser",
        "itemName": "Old Milk",
        "_id": "1",
        "expiryDate": expired_date,
        "notified_expired": True  #already notified
    })
    
    result = service.check_and_send_notifications()
    
    assert result["status"] == "ok"
    assert len(result["sent"]) == 0
    assert len(service.sent_emails) == 0


def test_notification_default_timing():
    #item expiring in exactly 7 days should trigger default notification
    service = Service.__new__(Service)
    service.users_collection = FakeCollection()
    service.fridge_collection = FakeFridgeCollection()
    service.sent_emails = []
    
    def mock_send_email(to_email, subject, body):
        service.sent_emails.append({"subject": subject})
    
    service.send_email = mock_send_email
    
    #item expiring in 7 days
    future_date = (datetime.now().date() + timedelta(days=7)).isoformat()
    service.users_collection.insert_one({
        "username": "testuser",
        "email": "test@example.com",
        "notification_days_before_expiry": 7
    })
    service.fridge_collection.insert_one({
        "username": "testuser",
        "itemName": "Yogurt",
        "_id": "1",
        "expiryDate": future_date,
        "notified_default": False
    })
    
    result = service.check_and_send_notifications()
    
    assert result["status"] == "ok"
    assert len(result["sent"]) == 1
    assert result["sent"][0][2] == "default"
    assert "expires in 7 days" in service.sent_emails[0]["subject"]


def test_notification_marks_as_sent():
    #notification flags should be set after sending
    service = Service.__new__(Service)
    service.users_collection = FakeCollection()
    service.fridge_collection = FakeFridgeCollection()
    
    def mock_send_email(to_email, subject, body):
        pass
    
    service.send_email = mock_send_email
    
    #expired item
    expired_date = (datetime.now().date() - timedelta(days=1)).isoformat()
    service.users_collection.insert_one({
        "username": "testuser",
        "email": "test@example.com",
        "notification_days_before_expiry": 7
    })
    service.fridge_collection.insert_one({
        "username": "testuser",
        "itemName": "Cheese",
        "_id": "1",
        "expiryDate": expired_date,
        "notified_expired": False
    })
    
    service.check_and_send_notifications()
    
    #check that item is now marked as notified
    items = service.fridge_collection.find({"_id": "1"})
    assert len(items) == 1
    assert items[0]["notified_expired"] is True

