from pydantic import BaseModel
from typing import List, Optional

class TemplateTaskBase(BaseModel):
    title: str
    type: str
    description: Optional[str] = None
    order: int = 0
    responsible_role: Optional[str] = "HR"

class TemplateTaskCreate(TemplateTaskBase):
    pass

class TemplateTask(TemplateTaskBase):
    id: int
    template_id: int

    class Config:
        from_attributes = True

class TemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    client_id: int

class TemplateCreate(TemplateBase):
    tasks: List[TemplateTaskCreate] = []

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tasks: Optional[List[TemplateTaskCreate]] = None

class Template(TemplateBase):
    id: int
    tasks: List[TemplateTask] = []

    class Config:
        from_attributes = True
