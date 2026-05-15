from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
import os
import shutil
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
import re
from typing import Any, List

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
                task_deadline = None
                if journey.start_date:
                    days_offset = 0
                    if t_task.stage:
                        match = re.search(r'\d+', t_task.stage)
                        if match:
                            days_offset = int(match.group())
                    task_deadline = journey.start_date + timedelta(days=days_offset)

                j_task = JourneyTaskModel(
                    journey_id=journey.id,
                    client_id=journey.client_id,
                    title=t_task.title,
                    type=t_task.type,
                    description=t_task.description,
                    stage=t_task.stage if t_task.stage else f"Step {t_task.order}",
                    deadline=task_deadline,
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
# ... existing code ...

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
    
    if task_in.document_url is not None:
        task.document_url = task_in.document_url

    await db.commit()
    return {"status": "success"}

@router.post("/task/{task_id}/complete")
async def complete_task(
    task_id: int,
    client_id: int = Form(...),
    file: UploadFile = File(None),
    db: AsyncSession = Depends(get_db),
):
    # 1. Buscar la tarea
    result = await db.execute(
        select(JourneyTaskModel)
        .where(JourneyTaskModel.id == task_id)
        .where(JourneyTaskModel.client_id == client_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # 2. Si hay archivo, validarlo y guardarlo
    if file:
        try:
            # Validar tipo de archivo
            allowed_types = ["application/pdf", "image/jpeg", "image/png"]
            if file.content_type not in allowed_types:
                raise HTTPException(status_code=400, detail="Only PDF, JPG, and PNG are allowed")
            
            # Validar tamaño (5MB)
            contents = await file.read()
            if len(contents) > 5 * 1024 * 1024:
                raise HTTPException(status_code=400, detail="File too large (Max 5MB)")

            # Usar ruta absoluta para evitar problemas en Render
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            upload_dir = os.path.join(base_dir, "uploads")
            
            if not os.path.exists(upload_dir):
                os.makedirs(upload_dir)

            # Nombre de archivo único
            file_ext = os.path.splitext(file.filename)[1]
            file_name = f"task_{task_id}_{int(datetime.now().timestamp())}{file_ext}"
            file_path = os.path.join(upload_dir, file_name)

            # Guardar archivo
            with open(file_path, "wb") as f:
                f.write(contents)
            
            task.document_url = f"/uploads/{file_name}"
        except Exception as e:
            print(f"Error saving file: {e}")
            raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")

    # 3. Marcar como completada
    task.completed = True
    await db.commit()

    # 4. Recalcular progreso del Journey
    try:
        result = await db.execute(
            select(JourneyModel)
            .options(selectinload(JourneyModel.tasks))
            .where(JourneyModel.id == task.journey_id)
        )
        journey = result.unique().scalar_one()
        
        total_tasks = len(journey.tasks)
        completed_tasks = sum(1 for t in journey.tasks if t.completed)
        journey.progress = int((completed_tasks / total_tasks) * 100) if total_tasks > 0 else 0
        
        await db.commit()
    except Exception as e:
        print(f"Error updating progress: {e}")
        # No fallar si el progreso falla, al menos la tarea se marcó como completada
        pass

    return {
        "status": "success",
        "progress": journey.progress if 'journey' in locals() else 0,
        "document_url": task.document_url
    }
