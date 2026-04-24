from datetime import datetime
from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.orm import DeclarativeBase, declared_attr

class Base(DeclarativeBase):
    @declared_attr
    def __tablename__(cls):
        return cls.__name__.lower()

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class MultiTenantBase(Base):
    __abstract__ = True
    # client_id es fundamental para el estándar Alloxentric
    client_id = Column(Integer, index=True, nullable=False)
