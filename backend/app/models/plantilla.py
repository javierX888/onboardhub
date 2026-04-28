from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from .base import MultiTenantBase

class PlantillaOnboarding(MultiTenantBase):
    __tablename__ = "plantillas"

    nombre = Column(String(255), nullable=False)
    descripcion = Column(String(500), nullable=True)

    # Relación con las tareas de la plantilla
    tareas = relationship(
        "TareaPlantilla",
        back_populates="plantilla",
        cascade="all, delete-orphan",
        order_by="TareaPlantilla.orden"
    )

class TareaPlantilla(MultiTenantBase):
    __tablename__ = "tareas_plantilla"

    plantilla_id = Column(Integer, ForeignKey("plantillas.id"), nullable=False)
    titulo = Column(String(200), nullable=False)
    tipo = Column(String(50), nullable=False) # document, video, link, form, etc.
    descripcion = Column(String(500), nullable=True)
    orden = Column(Integer, nullable=False, default=0)

    plantilla = relationship("PlantillaOnboarding", back_populates="tareas")
