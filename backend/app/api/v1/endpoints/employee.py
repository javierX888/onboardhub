from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.user import User as UserModel
from app.models.journey import Journey as JourneyModel
from app.schemas.journey import Journey

router = APIRouter()

@router.get("/{email}", response_model=dict)
async def get_employee_dashboard(
    email: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Endpoint principal para la App Móvil.
    Busca al usuario por email y devuelve su información básica + su Journey activo.
    """
    # 1. Buscar usuario
    result = await db.execute(select(UserModel).where(UserModel.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # 2. Buscar su Journey activo (con tareas)
    result = await db.execute(
        select(JourneyModel)
        .options(selectinload(JourneyModel.tasks))
        .where(JourneyModel.employee_id == user.id)
        .order_by(JourneyModel.id.desc())
    )
    journey = result.scalars().first()
    
    journey_data = None
    if journey:
        journey_data = {
            "id": journey.id,
            "employee_id": journey.employee_id,
            "template_id": journey.template_id,
            "role": journey.role,
            "progress": journey.progress,
            "start_date": journey.start_date.isoformat() if journey.start_date else None,
            "end_date": journey.end_date.isoformat() if journey.end_date else None,
            "location": journey.location,
            "client_id": journey.client_id,
            "tasks": [
                {
                    "id": t.id,
                    "title": t.title,
                    "stage": t.stage,
                    "type": t.type,
                    "description": t.description,
                    "completed": t.completed,
                    "deadline": t.deadline.isoformat() if t.deadline else None,
                    "responsible_id": t.responsible_id,
                    "journey_id": t.journey_id,
                }
                for t in journey.tasks
            ]
        }

    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "client_id": user.client_id
        },
        "journey": journey_data
    }
