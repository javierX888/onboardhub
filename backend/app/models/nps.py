from sqlalchemy import Column, Integer, String, ForeignKey, CheckConstraint
from .base import MultiTenantBase

class NPSResponse(MultiTenantBase):
    __tablename__ = "nps_responses"

    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Integer, nullable=False)
    comment = Column(String(500), nullable=True)
    
    __table_args__ = (
        CheckConstraint('score >= 0 AND score <= 10', name='check_score_range'),
    )
