from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AlertBase(BaseModel):
    type: str
    message: str
    severity: str
    journey_id: Optional[int] = None
    journey_task_id: Optional[int] = None
    is_read: bool = False


class Alert(AlertBase):
    id: int
    client_id: int
    employee_name: Optional[str] = None
    task_title: Optional[str] = None
    deadline: Optional[datetime] = None
    days_overdue: int = 0
    attended_at: Optional[datetime] = None
    attended_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AlertAttendResponse(BaseModel):
    status: str
    alert: Alert