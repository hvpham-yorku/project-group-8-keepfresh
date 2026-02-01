from fastapi import FastAPI
from services.service import Service
from fastapi.middleware.cors import CORSMiddleware
from models.user import User
from fastapi import HTTPException

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
        return {"status": "ok"}
    else:
        raise HTTPException(status_code=401, detail="Invalid")

