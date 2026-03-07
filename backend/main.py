from fastapi import FastAPI
from services.service import Service
from fastapi.middleware.cors import CORSMiddleware
from models.user import User
from models.item import Item
from fastapi import HTTPException, Header
from config.auth import encode_token, decode_token, get_user_from_token, get_username_from_token_string
from models.food import FoodItem

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
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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

@app.post("/login")
async def login(user: User):
    check = service.find_user(user)
    if check:
        token = encode_token(user.username)
        return {"status": "ok", "user_token": token, "username": user.username}
    else:
        raise HTTPException(status_code=401, detail="Invalid")

@app.put("/items/{item_id}", tags=["items"])
async def update_item(item_id: str, item: Item):
    try:
        return service.update_item(item_id, item)
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Item not found")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/items", tags=["items"])
async def add_food_item(food_item: FoodItem, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not Authorized")
    
    token = authorization.replace("Bearer ", "").strip()
    username = get_username_from_token_string(token)

    if not username:
        raise HTTPException(status_code=401, detail="invalid user token")
    try:
        result = service.add_user_food_item(username, food_item)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid")
    
@app.get("/items", tags=["items"])
async def get_food_items(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not Authorized")

    token = authorization.replace("Bearer ", "").strip()
    username = get_username_from_token_string(token)

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
    username = get_username_from_token_string(token)

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
        