from pydantic import BaseModel, EmailStr
from typing import Optional

class UsuarioBase(BaseModel):
    email: EmailStr
    nombre: str
    rol: str
    estado: bool = True

class UsuarioCreate(UsuarioBase):
    password: str
    client_id: int

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    rol: Optional[str] = None
    estado: Optional[bool] = None

class UsuarioResponse(UsuarioBase):
    id: int
    client_id: int

    class Config:
        from_attributes = True
