from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.template import Template as TemplateModel, TemplateTask as TemplateTaskModel
from app.schemas.template import Template, TemplateCreate, TemplateUpdate

router = APIRouter()

@router.get("/", response_model=List[Template])
async def read_templates(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    # Use selectinload for tasks to avoid MissingGreenlet error
    result = await db.execute(
        select(TemplateModel)
        .options(selectinload(TemplateModel.tasks))
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

@router.get("/company/{client_id}", response_model=List[Template])
async def read_templates_by_company(
    client_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    result = await db.execute(
        select(TemplateModel)
        .options(selectinload(TemplateModel.tasks))
        .where(TemplateModel.client_id == client_id)
    )
    return result.scalars().all()

@router.post("/", response_model=Template)
async def create_template(
    *,
    db: AsyncSession = Depends(get_db),
    template_in: TemplateCreate,
) -> Any:
    template_data = template_in.model_dump()
    tasks_data = template_data.pop("tasks", [])
    
    template = TemplateModel(**template_data)
    db.add(template)
    await db.commit()
    await db.refresh(template)
    
    for task_data in tasks_data:
        task = TemplateTaskModel(**task_data, template_id=template.id, client_id=template.client_id)
        db.add(task)
    
    await db.commit()
    
    # Reload with tasks to avoid MissingGreenlet error in response
    result = await db.execute(
        select(TemplateModel)
        .options(selectinload(TemplateModel.tasks))
        .where(TemplateModel.id == template.id)
    )
    return result.unique().scalar_one()


@router.put("/{id}", response_model=Template)
async def update_template(
    *,
    db: AsyncSession = Depends(get_db),
    id: int,
    template_in: TemplateUpdate,
) -> Any:
    result = await db.execute(
        select(TemplateModel)
        .options(selectinload(TemplateModel.tasks))
        .where(TemplateModel.id == id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    update_data = template_in.model_dump(exclude_unset=True)
    tasks_data = update_data.pop("tasks", None)
    
    for field, value in update_data.items():
        setattr(template, field, value)
    
    if tasks_data is not None:
        # Simple implementation: Delete old tasks and create new ones
        await db.execute(
            select(TemplateTaskModel).where(TemplateTaskModel.template_id == id)
        )
        # Actually, let's just delete them
        from sqlalchemy import delete
        await db.execute(delete(TemplateTaskModel).where(TemplateTaskModel.template_id == id))
        
        for task_data in tasks_data:
            task = TemplateTaskModel(**task_data, template_id=id, client_id=template.client_id)
            db.add(task)
            
    await db.commit()
    
    # Reload with tasks for the response
    result = await db.execute(
        select(TemplateModel)
        .options(selectinload(TemplateModel.tasks))
        .where(TemplateModel.id == id)
    )
    return result.unique().scalar_one()


@router.delete("/{id}", response_model=Template)
async def delete_template(
    *,
    db: AsyncSession = Depends(get_db),
    id: int,
) -> Any:
    result = await db.execute(select(TemplateModel).where(TemplateModel.id == id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    await db.delete(template)
    await db.commit()
    return template
