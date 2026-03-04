from fastapi import FastAPI
from services.service import Service
from fastapi.middleware.cors import CORSMiddleware
from models.user import User
from fastapi import HTTPException
from config.auth import encode_token, decode_token, get_user_from_token

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

@app.post("/items", tags=["items"])
async def add_food_item(food_item: FoodItem, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not Authorized")
    
    token = authorization.replace("Bearer ", "").strip()
    username = extract_user_from_token(token)

    if not username:
        raise HTTPException(status_code=401, detail="invalid user token")
    try:
        result = service.add_food_item(username, food_item)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid")
    
@app.get("/items", tags=["items"])
async def get_food_items(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not Authorized")

    token = authorization.replace("Bearer ", "").strip()
    username = extract_user_from_token(token)

    if not username:
        raise HTTPException(status_code=401, detail="invalid user token")
    try:
        items = service.get_user_food_items(username)
        return {"status": "ok", "items": items}
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid")
