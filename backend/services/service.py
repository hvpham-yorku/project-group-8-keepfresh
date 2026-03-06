from pymongo import MongoClient
from bson import ObjectId
from models.user import User
from models.item import Item

class Service:
    def __init__(self):
        self.client = MongoClient("mongodb://mongodb:27017")  
        self.db = self.client["keepfresh"]
        self.users_collection = self.db["users"]
        self.items_collection = self.db["items"]

    def user_exists_by_username(self, username: str) -> bool:
        return self.users_collection.find_one({"username": username}) is not None

    def create_user(self, user: User):
        if self.user_exists_by_username(user.username):
            raise ValueError("Username already taken")
        user_dict = {
            "username": user.username,
            "password": user.password
        }
        self.users_collection.insert_one(user_dict)

    def find_user(self, user: User):
        user = self.users_collection.find_one({
            "username" : user.username,
            "password" : user.password
        })
        return user

    def update_item(self, item_id: str, item: Item):
        result = self.items_collection.update_one(
            {"_id": ObjectId(item_id)},
            {"$set": item.model_dump(exclude_none=True)}
        )
        if result.matched_count == 0:
            raise ValueError("Item not found")
        doc = self.items_collection.find_one({"_id": ObjectId(item_id)})
        doc["_id"] = str(doc["_id"])
        return doc
