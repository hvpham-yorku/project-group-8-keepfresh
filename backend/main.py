import os
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, File, UploadFile, HTTPException, Header
from services.service import Service
from fastapi.middleware.cors import CORSMiddleware
from models.user import User
from models.item import Item
from config.auth import encode_token, decode_token, get_username_from_token_string
from models.food import FoodItem
from receipt_ocr import extract_grocery_items

app = FastAPI(
    title="KeepFresh API",
    description="API for tracking food freshness and reducing waste",
    version="1.0.0",
    contact={
        "name": "KeepFresh Team",
        "email": "team@keepfresh.com",
    },
    license_info={
        "name": "MIT",
    },
    openapi_tags=[
        {
            "name": "health",
            "description": "Health check endpoints",
        },
        {
            "name": "items",
            "description": "Food item management",
        },
        {
            "name": "receipt",
            "description": "Receipt OCR for grocery extraction",
        },
        {
            "name": "recommendations",
            "description": "Grocery recommendations per user",
        },
        {
            "name": "auth",
            "description": "Login and session management",
        },
    ],
)

def _get_cors_origins() -> list[str]:
    origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
    dev_host = os.getenv("DEV_HOST", "").strip()
    if dev_host:
        extra = f"http://{dev_host}:3000"
        if extra not in origins:
            origins.append(extra)
    return origins


app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_cors_origins(),
    allow_methods=["*"],
    allow_headers=["*"],
)

service = Service()

@app.get("/", tags=["health"])
async def root():
    """Root endpoint - API status check"""
    return {"message": "Backend running", "version": "1.0.0"}

@app.post("/signup")
async def signup(user: User):
    try:
        service.create_user(user)
        return {"status": "ok"}
    except ValueError as e:
        if "already taken" in str(e).lower():
            raise HTTPException(status_code=409, detail="Username already taken")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/login", tags=["auth"])
async def login(user: User):
    check = service.find_user(user)
    if check:
        jti = str(uuid.uuid4())
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
        service.create_access_token(jti, user.username, expires_at)
        token = encode_token(user.username, jti=jti, exp=expires_at)
        return {"status": "ok", "user_token": token, "username": user.username}
    else:
        raise HTTPException(status_code=401, detail="Invalid")


@app.post("/logout", tags=["auth"])
async def logout(authorization: str = Header(None)):
    """Invalidate server-side session when JWT includes ``jti``; always safe for clients to call."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not Authorized")
    token = authorization.replace("Bearer ", "").strip()
    try:
        payload = decode_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="invalid user token")
    jti = payload.get("jti")
    username = payload.get("sub")
    if jti and username:
        service.revoke_access_token(jti, username)
    return {"status": "ok"}

@app.put("/items/{item_id}", tags=["items"])
async def update_item(item_id: str, item: Item):
    try:
        return service.update_item(item_id, item)
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Item not found")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/receipt/ocr", tags=["receipt"])
async def receipt_ocr(file: UploadFile = File(...), session_id: str | None = None):
    """Extract grocery items from receipt image. If session_id given, store result in DB for polling."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Image file required")
    try:
        data = await file.read()
        ct = file.content_type or "image/jpeg"
        if session_id:
            service.set_receipt_session_processing(session_id)
        items = extract_grocery_items(data, ct)
        if session_id:
            service.set_receipt_session_done(session_id, items)
            return {"status": "ok", "message": "Receipt sent to your browser. You can close this page."}
        return {"status": "ok", "items": items}
    except ValueError as e:
        if session_id:
            service.delete_receipt_session(session_id)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/receipt/result/{session_id}", tags=["receipt"])
async def receipt_result(session_id: str):
    """Poll while processing, returns 200 + items when done."""
    rec = service.get_receipt_session(session_id)
    if rec is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    if rec["status"] == "processing":
        raise HTTPException(status_code=202, detail="processing")
    return {"status": "ok", "items": rec.get("items", [])}


@app.post("/items/batch", tags=["items"])
async def add_food_items_batch(items: list[FoodItem], authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not Authorized")
    token = authorization.replace("Bearer ", "").strip()
    username = get_username_from_token_string(token, service)
    if not username:
        raise HTTPException(status_code=401, detail="invalid user token")
    try:
        return service.add_user_food_items_batch(username, items)
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid")


@app.post("/items", tags=["items"])
async def add_food_item(food_item: FoodItem, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not Authorized")
    
    token = authorization.replace("Bearer ", "").strip()
    username = get_username_from_token_string(token, service)

    if not username:
        raise HTTPException(status_code=401, detail="invalid user token")
    try:
        return service.add_user_food_item(username, food_item)
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid")

@app.get("/items", tags=["items"])
async def get_food_items(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not Authorized")

    token = authorization.replace("Bearer ", "").strip()
    username = get_username_from_token_string(token, service)

    if not username:
        raise HTTPException(status_code=401, detail="invalid user token")
    try:
        items = service.get_user_food_items(username)
        return {"status": "ok", "items": items}
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid")

@app.delete("/items/{item_id}", tags=["items"])
async def delete_food_item(item_id: str, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not Authorized")

    token = authorization.replace("Bearer ", "").strip()
    username = get_username_from_token_string(token, service)

    if not username:
        raise HTTPException(status_code=401, detail="invalid user token")

    try:
        result = service.delete_user_food_item(username, item_id)
        return result
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Item not found")
        if "invalid" in str(e).lower():
            raise HTTPException(status_code=400, detail="Invalid item id")
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/user", tags=["auth"])
async def get_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not Authorized")
    token = authorization.replace("Bearer ", "").strip()
    username = get_username_from_token_string(token, service)
    if not username:
        raise HTTPException(status_code=401, detail="invalid user token")
    user = service.get_user_by_username(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "status": "ok",
        "user": {
            "username": user.get("username"),
            "email": user.get("email"),
            "notification_days_before_expiry": user.get("notification_days_before_expiry", 7),
            "custom_notification_days_before_expiry": user.get("custom_notification_days_before_expiry"),
        },
    }


@app.put("/user", tags=["auth"])
async def update_user(notification_days_before_expiry: int | None = None, custom_notification_days_before_expiry: int | None = None, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not Authorized")
    token = authorization.replace("Bearer ", "").strip()
    username = get_username_from_token_string(token, service)
    if not username:
        raise HTTPException(status_code=401, detail="invalid user token")
    if notification_days_before_expiry is not None and notification_days_before_expiry < 0:
        raise HTTPException(status_code=400, detail="notification_days_before_expiry must be non-negative")
    if custom_notification_days_before_expiry is not None and custom_notification_days_before_expiry < 0:
        raise HTTPException(status_code=400, detail="custom_notification_days_before_expiry must be non-negative")
    user = service.update_user_notification_preferences(
        username,
        notification_days_before_expiry=notification_days_before_expiry,
        custom_notification_days_before_expiry=custom_notification_days_before_expiry,
    )
    return {
        "status": "ok",
        "user": {
            "username": user.get("username"),
            "email": user.get("email"),
            "notification_days_before_expiry": user.get("notification_days_before_expiry", 7),
            "custom_notification_days_before_expiry": user.get("custom_notification_days_before_expiry"),
        },
    }


@app.post("/notifications/run", tags=["items"])
async def run_notifications():
    return service.check_and_send_notifications()


@app.get("/recommendations", tags=["recommendations"])
async def get_recommendations(authorization: str = Header(None)):
    """Return recommendations: use cached if fridge items unchanged, else run LLM and return."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not Authorized")
    token = authorization.replace("Bearer ", "").strip()
    username = get_username_from_token_string(token, service)
    if not username:
        raise HTTPException(status_code=401, detail="invalid user token")
    recs = service.get_recommendations_or_refresh(username)
    return {"status": "ok", "recommendations": recs}


@app.post("/recommendations/refresh", tags=["recommendations"])
async def refresh_recommendations(authorization: str = Header(None)):
    """Recompute recommendations from current fridge items and store them."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not Authorized")
    token = authorization.replace("Bearer ", "").strip()
    username = get_username_from_token_string(token, service)
    if not username:
        raise HTTPException(status_code=401, detail="invalid user token")
    try:
        recs = service.refresh_recommendations(username)
        return {"status": "ok", "recommendations": recs}
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
