from pymongo import MongoClient
from models.user import User
from models.food import FoodItem


class Service:
    def __init__(self):
        self.client = MongoClient("mongodb://mongodb:27017")  
        self.db = self.client["keepfresh"]
        self.users_collection = self.db["users"]

    def user_exists_by_username(self, username: str) -> bool:
        return self.users_collection.find_one({"username": username}) is not None

    def create_user(self, user: User):
        if self.user_exists_by_username(user.username):
            raise ValueError("Username already taken")
        user_dict = {
            "username": user.username,
            "password": user.password,
            "food_items": []
        }
        self.users_collection.insert_one(user_dict)

    def find_user(self, user: User):
        user = self.users_collection.find_one({
            "username" : user.username,
            "password" : user.password
        })
        return user

    def add_user_food_item(self, username: str, food_item: FoodItem):
        result = self.users_collection.update_one(
            {"username": username},
            {"$push": {"food_items": food_item.dict()}}
        )
        if result.matched_count == 0:
            raise ValueError(f"User not found")
        return {"status": "ok", "item_id": food_item.id}

    def get_user_food_items(self, username: str):
        user = self.users_collection.find_one({"username": username})
        if not user:
            raise ValueError(f"User not found")
        return user.get("food_items", [])
