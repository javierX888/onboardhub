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
    
    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "client_id": user.client_id
        },
        "journey": journey
    }
