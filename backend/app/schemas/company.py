from pydantic import BaseModel
from typing import Optional

class CompanyBase(BaseModel):
    name: str
    tax_id: str
    status: Optional[bool] = True
    domain: Optional[str] = None
    location: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(CompanyBase):
    name: Optional[str] = None
    tax_id: Optional[str] = None

class Company(CompanyBase):
    id: int

    class Config:
        from_attributes = True
