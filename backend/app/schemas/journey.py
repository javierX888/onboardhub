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
    rol: str
    progreso: int

class Journey(JourneyBase):
    id: int
    client_id: int
    tasks: List[Task] = []

    class Config:
        from_attributes = True
