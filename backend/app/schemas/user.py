from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str
    status: Optional[bool] = True
    client_id: int
    area: Optional[str] = None
    pais: Optional[str] = None
    ciudad: Optional[str] = None
    comuna: Optional[str] = None
    sucursal: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: Optional[str] = None
    status: Optional[bool] = None
    area: Optional[str] = None
    pais: Optional[str] = None
    ciudad: Optional[str] = None
    comuna: Optional[str] = None
    sucursal: Optional[str] = None

class User(UserBase):
    id: int

    class Config:
        from_attributes = True
