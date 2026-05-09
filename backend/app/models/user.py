from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from .base import MultiTenantBase

class User(MultiTenantBase):
    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False) # Previously 'nombre'
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False) # Previously 'rol'. Roles: ADMIN, HR, EMPLOYEE
    status = Column(Boolean, default=True) # Previously 'estado'
    
    company = relationship("Company", foreign_keys="User.client_id", primaryjoin="User.client_id == Company.id")
