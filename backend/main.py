from fastapi import FastAPI

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

@app.get("/", tags=["health"])
async def root():
    """Root endpoint - API status check"""
    return {"message": "Backend running", "version": "1.0.0"}
