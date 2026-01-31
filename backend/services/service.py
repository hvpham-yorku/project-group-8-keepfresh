from pymongo import MongoClient
from models.user import User

class Service:
    def __init__(self):
        self.client = MongoClient("mongodb://mongodb:27017")  
        self.db = self.client["keepfresh"]
        self.users_collection = self.db["users"]

    def create_user(self, user: User):
        user_dict = {
            "username": user.username,
            "password": user.password
        }
        self.users_collection.insert_one(user_dict)

        