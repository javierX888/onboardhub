from pydantic import BaseModel
from typing import Optional

class EmpresaBase(BaseModel):
    nombre: str
    rut: str
    estado: Optional[bool] = True

class EmpresaCreate(EmpresaBase):
    pass

class EmpresaUpdate(EmpresaBase):
    nombre: Optional[str] = None
    rut: Optional[str] = None

class Empresa(EmpresaBase):
    id: int

    class Config:
        from_attributes = True
