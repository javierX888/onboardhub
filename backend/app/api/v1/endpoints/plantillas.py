from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from ....schemas.plantilla import (
    PlantillaOnboardingCreate,
    PlantillaOnboardingUpdate,
    PlantillaOnboardingResponse
)
from ....models.plantilla import PlantillaOnboarding, TareaPlantilla
from ...deps import get_db

router = APIRouter()

@router.post("/", response_model=PlantillaOnboardingResponse, status_code=status.HTTP_201_CREATED)
async def create_plantilla(plantilla_in: PlantillaOnboardingCreate, db: AsyncSession = Depends(get_db)):
    """
    Crea una nueva plantilla de onboarding y sus tareas asociadas.
    """
    # 1. Crear la Plantilla
    db_plantilla = PlantillaOnboarding(
        nombre=plantilla_in.nombre,
        descripcion=plantilla_in.descripcion,
        client_id=plantilla_in.client_id
    )
    db.add(db_plantilla)
    await db.flush() # Para obtener el ID de la plantilla
    
    # 2. Crear las Tareas
    if plantilla_in.tareas:
        for index, tarea_in in enumerate(plantilla_in.tareas):
            db_tarea = TareaPlantilla(
                plantilla_id=db_plantilla.id,
                titulo=tarea_in.titulo,
                tipo=tarea_in.tipo,
                descripcion=tarea_in.descripcion,
                orden=tarea_in.orden if tarea_in.orden is not None else index,
                client_id=plantilla_in.client_id
            )
            db.add(db_tarea)
            
    await db.commit()
    
    # Recargar la plantilla con las tareas para retornarla
    result = await db.execute(
        select(PlantillaOnboarding)
        .options(selectinload(PlantillaOnboarding.tareas))
        .filter(PlantillaOnboarding.id == db_plantilla.id)
    )
    return result.scalars().first()

@router.get("/", response_model=List[PlantillaOnboardingResponse])
async def list_plantillas(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    """
    Lista todas las plantillas de onboarding con sus tareas.
    """
    result = await db.execute(
        select(PlantillaOnboarding)
        .options(selectinload(PlantillaOnboarding.tareas))
        .order_by(PlantillaOnboarding.id.desc())
        .offset(skip).limit(limit)
    )
    return result.scalars().all()

@router.get("/{plantilla_id}", response_model=PlantillaOnboardingResponse)
async def get_plantilla(plantilla_id: int, db: AsyncSession = Depends(get_db)):
    """
    Obtiene los detalles de una plantilla específica.
    """
    result = await db.execute(
        select(PlantillaOnboarding)
        .options(selectinload(PlantillaOnboarding.tareas))
        .filter(PlantillaOnboarding.id == plantilla_id)
    )
    plantilla = result.scalars().first()
    if not plantilla:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return plantilla

@router.put("/{plantilla_id}", response_model=PlantillaOnboardingResponse)
async def update_plantilla(plantilla_id: int, plantilla_in: PlantillaOnboardingUpdate, db: AsyncSession = Depends(get_db)):
    """
    Actualiza una plantilla de onboarding. Reemplaza sus tareas si se proveen en el payload.
    """
    result = await db.execute(
        select(PlantillaOnboarding)
        .options(selectinload(PlantillaOnboarding.tareas))
        .filter(PlantillaOnboarding.id == plantilla_id)
    )
    plantilla = result.scalars().first()
    if not plantilla:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
        
    # Actualizar campos base
    if plantilla_in.nombre is not None:
        plantilla.nombre = plantilla_in.nombre
    if plantilla_in.descripcion is not None:
        plantilla.descripcion = plantilla_in.descripcion
        
    # Actualizar tareas (estrategia de reemplazo completo para mantenerlo simple)
    if plantilla_in.tareas is not None:
        # 1. Eliminar tareas actuales (se maneja automáticamente si configuramos cascade delete-orphan, pero mejor explícito para estar seguros si no lo hicimos bien)
        for tarea in list(plantilla.tareas):
            await db.delete(tarea)
            
        # 2. Insertar nuevas tareas
        for index, tarea_in in enumerate(plantilla_in.tareas):
            db_tarea = TareaPlantilla(
                plantilla_id=plantilla.id,
                titulo=tarea_in.titulo,
                tipo=tarea_in.tipo,
                descripcion=tarea_in.descripcion,
                orden=tarea_in.orden if tarea_in.orden is not None else index,
                client_id=plantilla.client_id
            )
            db.add(db_tarea)
            
    await db.commit()
    
    # Recargar
    result = await db.execute(
        select(PlantillaOnboarding)
        .options(selectinload(PlantillaOnboarding.tareas))
        .filter(PlantillaOnboarding.id == plantilla_id)
    )
    return result.scalars().first()

@router.delete("/{plantilla_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plantilla(plantilla_id: int, db: AsyncSession = Depends(get_db)):
    """
    Elimina una plantilla de onboarding y todas sus tareas.
    """
    result = await db.execute(
        select(PlantillaOnboarding)
        .filter(PlantillaOnboarding.id == plantilla_id)
    )
    plantilla = result.scalars().first()
    if not plantilla:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
        
    await db.delete(plantilla)
    await db.commit()
