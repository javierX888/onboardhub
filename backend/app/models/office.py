from sqlalchemy import Column, String, Boolean
from .base import MultiTenantBase

class Office(MultiTenantBase):
    __tablename__ = "offices"

    name = Column(String(255), nullable=False)
    status = Column(Boolean, default=True)

