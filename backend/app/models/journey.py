from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .base import MultiTenantBase
from datetime import datetime

class Journey(MultiTenantBase):
    __tablename__ = "journeys"

    employee_id = Column(Integer, index=True, nullable=False) # Previously 'empleado_id'
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=True) # Previously 'plantilla_id'
    role = Column(String(50)) # Previously 'rol'
    progress = Column(Integer, default=0) # Previously 'progreso'
    start_date = Column(DateTime, nullable=True) # Previously 'fecha_inicio'
    end_date = Column(DateTime, nullable=True) # Previously 'fecha_termino'
    
    # New field: site/location for this specific onboarding
    location = Column(String(255), nullable=True) 
    
    tasks = relationship("JourneyTask", back_populates="journey")

class JourneyTask(MultiTenantBase):
    __tablename__ = "journey_tasks" # Previously 'tasks'
    
    journey_id = Column(Integer, ForeignKey("journeys.id"), nullable=False)
    title = Column(String(200), nullable=False) # Previously 'titulo'
    stage = Column(String(100)) # Previously 'etapa'
    type = Column(String(50)) # Previously 'tipo'
    description = Column(String(500), nullable=True)
    completed = Column(Boolean, default=False) # Previously 'completada'
    deadline = Column(DateTime, nullable=True) # Previously 'fecha_limite'
    
    # New field: Specific user responsible for this task
    responsible_id = Column(Integer, nullable=True)
    
    # New field for HU-06: Store the path/URL of the uploaded document
    document_url = Column(String(500), nullable=True)
    
    # URL provided by the manager for the employee to read/watch
    resource_url = Column(String(500), nullable=True)

    journey = relationship("Journey", back_populates="tasks")