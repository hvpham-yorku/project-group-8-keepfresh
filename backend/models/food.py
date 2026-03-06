from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class FoodItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    itemName: str = Field(..., min_length=1, description="Name of the food item")
    purchaseDate: str = Field(..., description = "Date purchased (YYYY-MM-DD)")
    expiryDate: str = Field(..., description ="Expiry date (YYYY-MM-DD)")
    quantity: int = Field(..., gt=0, description="Number of items")
    notes: Optional[str] = Field(default=None, description="Additional information about the item")

