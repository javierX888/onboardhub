from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class TaskBase(BaseModel):
    titulo: str
    etapa: str
    tipo: str
    completada: bool
    fecha_limite: Optional[datetime] = None
    descripcion: Optional[str] = None
    texto_boton: Optional[str] = "Ingresar a Tarea"

class Task(TaskBase):
    id: int
    journey_id: int

    class Config:
        from_attributes = True

class JourneyBase(BaseModel):
    empleado_id: int
    plantilla_id: Optional[int] = None
    rol: Optional[str] = None
    progreso: int = 0
    fecha_inicio: Optional[datetime] = None
    fecha_termino: Optional[datetime] = None

class JourneyAsignar(BaseModel):
    empleado_id: int
    plantilla_id: int
    fecha_inicio: Optional[datetime] = None
    fecha_termino: Optional[datetime] = None

class Journey(JourneyBase):
    id: int
    client_id: int
    tasks: List[Task] = []

    class Config:
        from_attributes = True
