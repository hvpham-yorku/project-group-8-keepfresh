import pytest
from bson import ObjectId
from fastapi.testclient import TestClient
from pymongo import MongoClient
from main import app

# To Run the Tests
# First Build via command : docker-compose up --build
# Second, Open a new terminal and switch to backend via : cd backend
# Third, On the new terminal Run This: docker exec -it keepfresh-backend python3 -m pytest tests/integration_tests.py -v

class TestIntegration:

    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = TestClient(app)
        from services.service import _mongo_uri

        self.mongo = MongoClient(_mongo_uri())
        self.db = self.mongo["keepfresh"]
        yield
        self.db["users"].drop()
        self.mongo.close()

    def test_signup_API_call(self):
        payload = {"username": "testing", "password" : "testing123"}
        response = self.client.post("/signup", json=payload)
        check_user = self.db["users"].find_one({"username" : "testing"})
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
        assert check_user is not None
        assert check_user["username"] == "testing"

    def test_login_API_call(self):
        payload = {"username": "testing", "password" : "testing123"}
        response = self.client.post("/signup", json=payload)
        check_user = self.db["users"].find_one({"username" : "testing"})
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
        assert check_user is not None
        assert check_user["username"] == "testing"
        response = self.client.post("/login", json=payload)
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    def test_AddingFoodItem_API_call(self):
        payload = {"username": "testing", "password" : "testing123"}
        response = self.client.post("/signup", json=payload)
        check_user = self.db["users"].find_one({"username" : "testing"})
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
        assert check_user is not None
        assert check_user["username"] == "testing"
        response = self.client.post("/login", json=payload)
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        userToken = response.json()["user_token"]  
        payload = {
            "itemName": "Milk",
            "purchaseDate": "2026-03-20",
            "expiryDate": "2026-03-27",
            "quantity": 2
        }
        response = self.client.post("/items", json=payload, headers={"Authorization": userToken})
        assert response.status_code == 200
        check_user = self.db["users"].find_one({"username": "testing"})


    def test_GettingFoodItems_API_call(self):
        payload = {"username": "testing", "password" : "testing123"}
        response = self.client.post("/signup", json=payload)
        check_user = self.db["users"].find_one({"username" : "testing"})
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
        assert check_user is not None
        assert check_user["username"] == "testing"
        response = self.client.post("/login", json=payload)
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        userToken = response.json()["user_token"]  
        payload = {
            "itemName": "Milk",
            "purchaseDate": "2026-03-20",
            "expiryDate": "2026-03-27",
            "quantity": 2
        }
        response = self.client.post("/items", json=payload, headers={"Authorization": userToken})
        assert response.status_code == 200
        response = self.client.get("/items", headers={"Authorization": userToken})     
        assert response.json()["status"] == "ok"


    def test_DeletingFoodItem_API_call(self):
        payload = {"username": "testing", "password" : "testing123"}
        response = self.client.post("/signup", json=payload)
        check_user = self.db["users"].find_one({"username" : "testing"})
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
        assert check_user is not None
        assert check_user["username"] == "testing"
        response = self.client.post("/login", json=payload)
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        userToken = response.json()["user_token"]  
        payload = {
            "itemName": "Milk",
            "purchaseDate": "2026-03-20",
            "expiryDate": "2026-03-27",
            "quantity": 2
        }
        response = self.client.post("/items", json=payload, headers={"Authorization": userToken})
        assert response.status_code == 200
        item_id = response.json()["item_id"]
        response = self.client.delete(f"/items/{item_id}", headers={"Authorization": userToken})
        assert response.status_code == 200

    def test_UpdatingFoodItem_API_call(self):
        payload = {"username": "testing", "password" : "testing123"}
        response = self.client.post("/signup", json=payload)
        check_user = self.db["users"].find_one({"username" : "testing"})
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
        assert check_user is not None
        assert check_user["username"] == "testing"
        response = self.client.post("/login", json=payload)
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        userToken = response.json()["user_token"]  
        payload = {
            "itemName": "Milk",
            "purchaseDate": "2026-03-20",
            "expiryDate": "2026-03-27",
            "quantity": 2
        }
        response = self.client.post("/items", json=payload, headers={"Authorization": userToken})
        assert response.status_code == 200
        item_id = response.json()["item_id"]
        payload = {
            "name": "Organic Milk",
            "expiry_date": "2026-03-28",
        }
        response = self.client.put(
            f"/items/{item_id}",
            json=payload,
            headers={"Authorization": userToken},
        )
        assert response.status_code == 200
        doc = self.db["fridge"].find_one({"_id": ObjectId(item_id)})
        assert doc is not None
        assert doc.get("itemName") == "Organic Milk"
        assert doc.get("expiryDate") == "2026-03-28"
