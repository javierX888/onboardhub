from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.area import Area as AreaModel
from app.schemas.area import Area, AreaCreate, AreaUpdate

router = APIRouter()

@router.get("/", response_model=List[Area])
async def read_areas(
    client_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    result = await db.execute(select(AreaModel).where(AreaModel.client_id == client_id))
    return result.scalars().all()

@router.post("/", response_model=Area)
async def create_area(
    *,
    client_id: int,
    area_in: AreaCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    area = AreaModel(name=area_in.name, client_id=client_id)
    db.add(area)
    await db.commit()
    await db.refresh(area)
    return area

@router.put("/{id}", response_model=Area)
async def update_area(
    *,
    id: int,
    client_id: int,
    area_in: AreaUpdate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    result = await db.execute(
        select(AreaModel)
        .where(AreaModel.id == id)
        .where(AreaModel.client_id == client_id)
    )
    area = result.scalar_one_or_none()
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")
    
    area.name = area_in.name
    await db.commit()
    await db.refresh(area)
    return area

@router.delete("/{id}", response_model=Area)
async def delete_area(
    *,
    id: int,
    client_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    result = await db.execute(
        select(AreaModel)
        .where(AreaModel.id == id)
        .where(AreaModel.client_id == client_id)
    )
    area = result.scalar_one_or_none()
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")
    
    await db.delete(area)
    await db.commit()
    return area
