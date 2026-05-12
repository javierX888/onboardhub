from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime

from app.core.database import get_db
from app.models.journey import Journey as JourneyModel, JourneyTask as JourneyTaskModel
from app.models.template import Template as TemplateModel
from app.schemas.journey import Journey, JourneyCreate, JourneyTaskUpdate

router = APIRouter()

@router.get("/employee/{employee_id}", response_model=List[Journey])
async def read_employee_journeys(
    employee_id: int,
    client_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    result = await db.execute(
        select(JourneyModel)
        .options(selectinload(JourneyModel.tasks))
        .where(JourneyModel.employee_id == employee_id)
        .where(JourneyModel.client_id == client_id)
    )
    return result.unique().scalars().all()

@router.post("/", response_model=Journey)
async def create_journey(
    *,
    db: AsyncSession = Depends(get_db),
    journey_in: JourneyCreate,
) -> Any:
    # 1. Create Journey
    journey_data = journey_in.model_dump()
    
    # Date sanitization (standardizing to UTC without TZ info for PG compatibility)
    for date_field in ["start_date", "end_date"]:
        if journey_data.get(date_field):
            if isinstance(journey_data[date_field], datetime):
                journey_data[date_field] = journey_data[date_field].replace(tzinfo=None)

    journey = JourneyModel(**journey_data)
    db.add(journey)
    await db.commit()
    await db.refresh(journey)

    # 2. If template provided, clone tasks
    if journey.template_id:
        result = await db.execute(
            select(TemplateModel)
            .options(selectinload(TemplateModel.tasks))
            .where(TemplateModel.id == journey.template_id)
        )
        template = result.scalar_one_or_none()
        
        if template:
            for t_task in template.tasks:
                j_task = JourneyTaskModel(
                    journey_id=journey.id,
                    client_id=journey.client_id,
                    title=t_task.title,
                    type=t_task.type,
                    description=t_task.description,
                    stage=f"Step {t_task.order}",
                    completed=False
                )
                db.add(j_task)
            await db.commit()

    # Reload with tasks to avoid serialization error
    result = await db.execute(
        select(JourneyModel)
        .options(selectinload(JourneyModel.tasks))
        .where(JourneyModel.id == journey.id)
    )
    return result.unique().scalar_one()

@router.put("/task/{task_id}")
async def update_task_status(
    task_id: int,
    client_id: int,
    task_in: JourneyTaskUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(JourneyTaskModel)
        .where(JourneyTaskModel.id == task_id)
        .where(JourneyTaskModel.client_id == client_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or unauthorized")
    
    if task_in.completed is not None:
        task.completed = task_in.completed
    
    if task_in.responsible_id is not None:
        task.responsible_id = task_in.responsible_id

    await db.commit()
    return {"status": "success"}
