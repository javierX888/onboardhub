from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_db
from app.models.journey import Journey, Task
from app.models.plantilla import PlantillaOnboarding, TareaPlantilla
from app.models.usuario import Usuario
from app.schemas.journey import JourneyAsignar, Journey as JourneySchema

router = APIRouter()

@router.post("/asignar", response_model=JourneySchema)
async def asignar_plantilla_a_empleado(asignacion: JourneyAsignar, db: AsyncSession = Depends(get_db)):
    # 1. Validar que el usuario (empleado) exista
    # En un sistema real se verificaría el rol o permisos.
    result_user = await db.execute(select(Usuario).where(Usuario.id == asignacion.empleado_id))
    usuario = result_user.scalars().first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    # 2. Validar que la plantilla exista
    result_plantilla = await db.execute(
        select(PlantillaOnboarding).where(PlantillaOnboarding.id == asignacion.plantilla_id)
    )
    plantilla = result_plantilla.scalars().first()
    if not plantilla:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")

    # Obtener las tareas de la plantilla ordenadas
    result_tareas_plantilla = await db.execute(
        select(TareaPlantilla)
        .where(TareaPlantilla.plantilla_id == asignacion.plantilla_id)
        .order_by(TareaPlantilla.orden)
    )
    tareas_plantilla = result_tareas_plantilla.scalars().all()

    if not tareas_plantilla:
        raise HTTPException(status_code=400, detail="La plantilla no tiene tareas configuradas")

    # 3. Crear el nuevo Journey
    nuevo_journey = Journey(
        client_id=usuario.client_id, # Heredar del usuario
        empleado_id=asignacion.empleado_id,
        plantilla_id=asignacion.plantilla_id,
        fecha_inicio=asignacion.fecha_inicio,
        fecha_termino=asignacion.fecha_termino,
        progreso=0,
        rol=usuario.rol # El modelo Usuario tiene 'rol', no 'cargo'
    )
    db.add(nuevo_journey)
    await db.flush() # Para obtener el ID del journey

    # 4. Crear las tareas del Journey copiándolas de la plantilla
    for tp in tareas_plantilla:
        nueva_tarea = Task(
            client_id=usuario.client_id,
            journey_id=nuevo_journey.id,
            titulo=tp.titulo,
            tipo=tp.tipo,
            descripcion=tp.descripcion,
            etapa=tp.titulo, # Usamos titulo como etapa por ahora
            completada=False
            # fecha_limite se podría calcular basada en fecha_inicio + orden, pero por ahora lo dejamos vacío o igual a fecha_termino
        )
        db.add(nueva_tarea)

    await db.commit()
    await db.refresh(nuevo_journey)

    return nuevo_journey
