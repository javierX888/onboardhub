from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from .base import MultiTenantBase

class Template(MultiTenantBase):
    __tablename__ = "templates"

    name = Column(String(255), nullable=False) # Previously 'nombre'
    description = Column(String(500), nullable=True) # Previously 'descripcion'

    tasks = relationship(
        "TemplateTask",
        back_populates="template",
        cascade="all, delete-orphan",
        order_by="TemplateTask.order"
    )

class TemplateTask(MultiTenantBase):
    __tablename__ = "template_tasks"

    template_id = Column(Integer, ForeignKey("templates.id"), nullable=False)
    title = Column(String(200), nullable=False) # Previously 'titulo'
    type = Column(String(50), nullable=False) # document, video, link, form, etc.
    description = Column(String(500), nullable=True)
    order = Column(Integer, nullable=False, default=0) # Previously 'orden'
    
    # New field: Who is responsible for this step (User ID or Role)
    responsible_role = Column(String(50), nullable=True, default="HR")

    template = relationship("Template", back_populates="tasks")
