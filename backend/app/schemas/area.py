from pydantic import BaseModel
from typing import Optional

class AreaBase(BaseModel):
    name: str
    client_id: int

class AreaCreate(BaseModel):
    name: str

class AreaUpdate(BaseModel):
    name: str

class Area(AreaBase):
    id: int

    class Config:
        from_attributes = True
