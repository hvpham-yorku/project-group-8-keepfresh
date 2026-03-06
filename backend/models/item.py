from pydantic import BaseModel, Field
from typing import Optional

class Item(BaseModel):
    name: str = Field(..., min_length=1)
    expiry_date: Optional[str] = None
