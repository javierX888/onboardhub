from sqlalchemy import Column, String
from .base import MultiTenantBase

class Office(MultiTenantBase):
    __tablename__ = "offices"

    name = Column(String(255), nullable=False)
