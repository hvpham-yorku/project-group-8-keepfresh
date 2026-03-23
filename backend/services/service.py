from datetime import datetime, timezone

from pymongo import MongoClient
from bson import ObjectId
from models.user import User
from models.item import Item
from models.food import FoodItem


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _as_utc_aware(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _get_recommendations_llm(item_names):
    from recommendation_llm import get_recommendations
    return get_recommendations(item_names)


class Service:
    def __init__(self):
        self.client = MongoClient("mongodb://mongodb:27017")  
        self.db = self.client["keepfresh"]
        self.users_collection = self.db["users"]
        self.items_collection = self.db["items"]
        self.fridge_collection = self.db["fridge"]
        self.receipt_sessions_collection = self.db["receipt_sessions"]
        self.recommendations_collection = self.db["recommendations"]
        self.access_tokens_collection = self.db["access_tokens"]
        self.access_tokens_collection.create_index("jti", unique=True)

    def create_access_token(self, jti: str, username: str, expires_at: datetime) -> None:
        self.access_tokens_collection.insert_one(
            {
                "jti": jti,
                "username": username,
                "expires_at": expires_at,
                "revoked": False,
                "created_at": _utc_now(),
            }
        )

    def is_access_token_valid(self, jti: str, username: str) -> bool:
        doc = self.access_tokens_collection.find_one({"jti": jti})
        if not doc:
            return False
        if doc.get("username") != username:
            return False
        if doc.get("revoked"):
            return False
        exp = doc.get("expires_at")
        if exp is not None and _utc_now() > _as_utc_aware(exp):
            return False
        return True

    def revoke_access_token(self, jti: str, username: str) -> bool:
        result = self.access_tokens_collection.update_one(
            {"jti": jti, "username": username},
            {"$set": {"revoked": True}},
        )
        return result.modified_count > 0

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

    def update_item(self, item_id: str, item: Item):
        """Update a fridge item by _id (itemName, expiryDate)."""
        update = {}
        if item.name is not None:
            update["itemName"] = item.name
        if item.expiry_date is not None:
            update["expiryDate"] = item.expiry_date
        if not update:
            doc = self.fridge_collection.find_one({"_id": ObjectId(item_id)})
            if not doc:
                raise ValueError("Item not found")
            doc["id"] = str(doc.pop("_id"))
            return doc
        result = self.fridge_collection.update_one(
            {"_id": ObjectId(item_id)},
            {"$set": update}
        )
        if result.matched_count == 0:
            raise ValueError("Item not found")
        doc = self.fridge_collection.find_one({"_id": ObjectId(item_id)})
        doc["id"] = str(doc.pop("_id"))
        return doc

    def add_user_food_item(self, username: str, food_item: FoodItem):
        item_doc = food_item.model_dump()
        item_doc["username"] = username
        result = self.fridge_collection.insert_one(item_doc)
        return {"status": "ok", "item_id": str(result.inserted_id)}

    def add_user_food_items_batch(self, username: str, food_items: list[FoodItem]):
        docs = [{**item.model_dump(), "username": username} for item in food_items]
        if not docs:
            return {"status": "ok", "item_ids": []}
        result = self.fridge_collection.insert_many(docs)
        return {"status": "ok", "item_ids": [str(id) for id in result.inserted_ids]}

    def get_user_food_items(self, username: str):
        cursor = self.fridge_collection.find({"username": username})
        items = []
        for doc in cursor:
            doc["id"] = str(doc.pop("_id", doc.get("id", "")))
            items.append(doc)
        return items

    def delete_user_food_item(self, username: str, item_id: str):
        if not ObjectId.is_valid(item_id):
            raise ValueError("Invalid item id")

        result = self.fridge_collection.delete_one({
            "_id": ObjectId(item_id),
            "username": username
        })

        if result.deleted_count == 0:
            raise ValueError("Item not found")

        return {"status": "ok", "message": "Item deleted successfully", "item_id": item_id}

    def set_receipt_session_processing(self, session_id: str) -> None:
        self.receipt_sessions_collection.update_one(
            {"_id": session_id},
            {"$set": {"status": "processing"}},
            upsert=True,
        )

    def set_receipt_session_done(self, session_id: str, items: list) -> None:
        self.receipt_sessions_collection.update_one(
            {"_id": session_id},
            {"$set": {"status": "done", "items": items}},
            upsert=True,
        )

    def get_receipt_session(self, session_id: str) -> dict | None:
        """Read session from DB only. Returns None if not found."""
        doc = self.receipt_sessions_collection.find_one({"_id": session_id})
        if not doc:
            return None
        if doc.get("status") == "processing":
            return {"status": "processing"}
        return {"status": "done", "items": doc.get("items", [])}

    def delete_receipt_session(self, session_id: str) -> None:
        self.receipt_sessions_collection.delete_one({"_id": session_id})

    def get_user_recommendations(self, username: str) -> dict | None:
        """Return stored recommendations for user, or None if never computed."""
        doc = self.recommendations_collection.find_one({"username": username})
        if not doc:
            return None
        return {
            "boughtBefore": doc.get("boughtBefore", []),
            "healthierAlternatives": doc.get("healthierAlternatives", []),
            "cheaperAlternatives": doc.get("cheaperAlternatives", []),
            "buyBecauseYouBought": doc.get("buyBecauseYouBought", []),
        }

    def set_user_recommendations(self, username: str, recs: dict, item_names_snapshot: list[str] | None = None) -> None:
        payload = {"username": username, **recs}
        if item_names_snapshot is not None:
            payload["itemNamesSnapshot"] = sorted(n for n in item_names_snapshot if n)
        self.recommendations_collection.update_one(
            {"username": username},
            {"$set": payload},
            upsert=True,
        )

    def refresh_recommendations(self, username: str) -> dict:
        """Load user's fridge items, call LLM, store and return recommendations."""
        items = self.get_user_food_items(username)
        names = [doc.get("itemName") or "" for doc in items if doc.get("itemName")]
        item_names = sorted(dict.fromkeys(n for n in names if n))
        recs = _get_recommendations_llm(item_names)
        self.set_user_recommendations(username, recs, item_names_snapshot=item_names)
        return recs

    def get_recommendations_or_refresh(self, username: str) -> dict | None:
        """Return cached recommendations if fridge items match snapshot; else run LLM and return."""
        items = self.get_user_food_items(username)
        names = [doc.get("itemName") or "" for doc in items if doc.get("itemName")]
        current_names = sorted(dict.fromkeys(n for n in names if n))
        doc = self.recommendations_collection.find_one({"username": username})
        stored_snapshot = doc.get("itemNamesSnapshot") if doc else None
        if stored_snapshot is not None and stored_snapshot == current_names:
            return {
                "boughtBefore": doc.get("boughtBefore", []),
                "healthierAlternatives": doc.get("healthierAlternatives", []),
                "cheaperAlternatives": doc.get("cheaperAlternatives", []),
                "buyBecauseYouBought": doc.get("buyBecauseYouBought", []),
            }
        try:
            return self.refresh_recommendations(username)
        except Exception:
            return self.get_user_recommendations(username)
