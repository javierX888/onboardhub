from pydantic import BaseModel, Field
from typing import List, Optional

class TemplateTaskBase(BaseModel):
    title: str
    type: str
    description: Optional[str] = None
    order: int = 0
    stage: Optional[str] = "Stage 1"
    resource_url: Optional[str] = None
    responsible_role: Optional[str] = "HR"
    is_evidence_mandatory: Optional[bool] = False
    # SLA in days: integer between 1 and 365; None means no deadline
    sla_days: Optional[int] = Field(default=None, ge=1, le=365)

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
    area: Optional[str] = None
    parent_template_id: Optional[int] = None
    status: Optional[bool] = True
    client_id: int

class TemplateCreate(TemplateBase):
    tasks: List[TemplateTaskCreate] = []

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    area: Optional[str] = None
    parent_template_id: Optional[int] = None
    status: Optional[bool] = None
    tasks: Optional[List[TemplateTaskCreate]] = None

class Template(TemplateBase):
    id: int
    tasks: List[TemplateTask] = []

    class Config:
        from_attributes = True
