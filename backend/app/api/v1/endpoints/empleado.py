from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from ....schemas.journey import Journey as JourneySchema
from ....models.journey import Journey
from ...deps import get_db

router = APIRouter()

# Datos locales Mockeados listos para la DEMO en caso de que la BD falle
MOCK_JOURNEY = {
    "id": 1,
    "client_id": 1001,
    "empleado_id": 1,
    "rol": "Desarrollador Frontend",
    "progreso": 0,
    "tasks": [
        {
            "id": 1, "journey_id": 1,
            "titulo": "Firma de Contrato", "etapa": "16 Nov",
            "tipo": "document", "completada": False, "fecha_limite": None,
            "descripcion": "", "texto_boton": "Firmar Documento"
        },
        {
            "id": 2, "journey_id": 1,
            "titulo": "Reunión con Jefe", "etapa": "18 Nov",
            "tipo": "video", "completada": False, "fecha_limite": None,
            "descripcion": "Agenda una reunión de 30 minutos con tu jefe directo para conocerse.",
            "texto_boton": "Programar Reunión"
        },
        {
            "id": 3, "journey_id": 1,
            "titulo": "Capacitación Técnica", "etapa": "20 Nov",
            "tipo": "link", "completada": False, "fecha_limite": None,
            "descripcion": "", "texto_boton": "Ir al Curso"
        },
        {
            "id": 4, "journey_id": 1,
            "titulo": "Presentación al Equipo", "etapa": "22 Nov",
            "tipo": "link", "completada": False, "fecha_limite": None,
            "descripcion": "", "texto_boton": "Ir a la Reunión"
        }
    ]
}

@router.get("/journey/{empleado_id}", response_model=JourneySchema)
async def get_empleado_journey(empleado_id: int, db: AsyncSession = Depends(get_db)):
    """
    Obtiene el Progress y el Timeline de Onboarding de un empleado.
    """
    try:
        # Intentamos obtener desde Base de Datos
        result = await db.execute(
            select(Journey)
            .options(selectinload(Journey.tasks))
            .filter(Journey.empleado_id == empleado_id)
        )
        journey = result.scalars().first()
        
        if journey:
            return journey
            
        # Si la base de datos corre pero no hay registros insertados todavía,
        # retornamos este mock visual espectacular para la presentación
        return MOCK_JOURNEY
        
    except Exception as e:
        print("La Base de datos no está corriendo o conectada. Usando MOCK para DEMO.", e)
        # Fallback seguro para la presentación de mañana a las 10:30 am
        return MOCK_JOURNEY
