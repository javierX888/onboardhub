from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from .base import MultiTenantBase

class Alert(MultiTenantBase):
    __tablename__ = "alerts"

    type = Column(String(50), nullable=False) # e.g. SLA_EXPIRED
    message = Column(String(500), nullable=False)
    severity = Column(String(20), nullable=False) # danger, warning, info
    journey_id = Column(Integer, ForeignKey("journeys.id"), nullable=True)
    is_read = Column(Boolean, default=False)
