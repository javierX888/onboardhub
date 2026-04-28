from pydantic import BaseModel
from typing import List, Optional

# --- TareaPlantilla Schemas ---

class TareaPlantillaBase(BaseModel):
    titulo: str
    tipo: str
    descripcion: Optional[str] = None
    orden: int

class TareaPlantillaCreate(TareaPlantillaBase):
    pass

class TareaPlantilla(TareaPlantillaBase):
    id: int
    plantilla_id: int

    class Config:
        from_attributes = True

# --- PlantillaOnboarding Schemas ---

class PlantillaOnboardingBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class PlantillaOnboardingCreate(PlantillaOnboardingBase):
    client_id: int
    tareas: List[TareaPlantillaCreate] = []

class PlantillaOnboardingUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    tareas: Optional[List[TareaPlantillaCreate]] = None

class PlantillaOnboardingResponse(PlantillaOnboardingBase):
    id: int
    client_id: int
    tareas: List[TareaPlantilla] = []

    class Config:
        from_attributes = True
