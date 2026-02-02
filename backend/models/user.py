from pydantic import BaseModel, Field

class User(BaseModel):
    username: str = Field(..., min_length=3, description="Username, min 3 characters")
    password: str = Field(..., min_length=3, description="Password, min 3 characters")