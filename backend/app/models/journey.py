from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .base import MultiTenantBase
from datetime import datetime

class Journey(MultiTenantBase):
    __tablename__ = "journeys"

    empleado_id = Column(Integer, index=True, nullable=False) # Quemado para la demo
    rol = Column(String(50))
    progreso = Column(Integer, default=0) # Porcentaje 0-100
    
    tasks = relationship("Task", back_populates="journey")

class Task(MultiTenantBase):
    __tablename__ = "tasks"
    
    journey_id = Column(Integer, ForeignKey("journeys.id"), nullable=False)
    titulo = Column(String(200), nullable=False)
    etapa = Column(String(100)) # ej. "Día 1: Bienvenida"
    tipo = Column(String(50)) # ej. "document", "video", "form"
    completada = Column(Boolean, default=False)
    fecha_limite = Column(DateTime, nullable=True)

    journey = relationship("Journey", back_populates="tasks")
