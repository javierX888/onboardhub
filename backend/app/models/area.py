from sqlalchemy import Column, String
from .base import MultiTenantBase

class Area(MultiTenantBase):
    __tablename__ = "areas"

    name = Column(String(255), nullable=False)
