from pydantic import BaseModel, Field, EmailStr
from typing import Optional

class User(BaseModel):
    username: str = Field(..., min_length=3, description="Username, min 3 characters")
    password: str = Field(..., min_length=3, description="Password, min 3 characters")
    email: EmailStr = Field(..., description="User email for notifications")
    notification_days_before_expiry: int = Field(default=7, ge=0, description="Default days before expiry to send notification")
    custom_notification_days_before_expiry: Optional[int] = Field(default=None, ge=0, description="Optional custom day to send notification")

    