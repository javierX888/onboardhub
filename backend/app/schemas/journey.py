from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class JourneyTaskBase(BaseModel):
    title: str
    stage: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    completed: bool = False
    deadline: Optional[datetime] = None
    responsible_id: Optional[int] = None

class JourneyTaskUpdate(BaseModel):
    completed: Optional[bool] = None
    responsible_id: Optional[int] = None

class JourneyTask(JourneyTaskBase):
    id: int
    journey_id: int

    class Config:
        from_attributes = True

class JourneyBase(BaseModel):
    employee_id: int
    template_id: Optional[int] = None
    role: Optional[str] = None
    progress: int = 0
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    location: Optional[str] = None
    client_id: int

class JourneyCreate(JourneyBase):
    pass

class Journey(JourneyBase):
    id: int
    tasks: List[JourneyTask] = []

    class Config:
        from_attributes = True
