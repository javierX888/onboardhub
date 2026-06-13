from pydantic import BaseModel
from typing import Optional

class OfficeBase(BaseModel):
    name: str
    client_id: int
    status: Optional[bool] = True

class OfficeCreate(BaseModel):
    name: str

class OfficeUpdate(BaseModel):
    name: str

class Office(OfficeBase):
    id: int

    class Config:
        from_attributes = True
