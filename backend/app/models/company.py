from sqlalchemy import Column, String, Boolean
from .base import Base

class Company(Base):
    __tablename__ = "companies"

    name = Column(String(255), nullable=False)
    tax_id = Column(String(20), unique=True, index=True, nullable=False) # Previously 'rut'
    status = Column(Boolean, default=True) # Previously 'estado'
    domain = Column(String(100), unique=True, nullable=True)
    location = Column(String(255), nullable=True) # New field for 'Sede'
