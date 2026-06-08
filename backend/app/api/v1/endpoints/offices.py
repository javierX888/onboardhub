from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.office import Office as OfficeModel
from app.schemas.office import Office, OfficeCreate, OfficeUpdate

router = APIRouter()

@router.get("/", response_model=List[Office])
async def read_offices(
    client_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    result = await db.execute(select(OfficeModel).where(OfficeModel.client_id == client_id))
    return result.scalars().all()

@router.post("/", response_model=Office)
async def create_office(
    *,
    client_id: int,
    office_in: OfficeCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    office = OfficeModel(name=office_in.name, client_id=client_id)
    db.add(office)
    await db.commit()
    await db.refresh(office)
    return office

@router.put("/{id}", response_model=Office)
async def update_office(
    *,
    id: int,
    client_id: int,
    office_in: OfficeUpdate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    result = await db.execute(
        select(OfficeModel)
        .where(OfficeModel.id == id)
        .where(OfficeModel.client_id == client_id)
    )
    office = result.scalar_one_or_none()
    if not office:
        raise HTTPException(status_code=404, detail="Office not found")
    
    office.name = office_in.name
    await db.commit()
    await db.refresh(office)
    return office

@router.delete("/{id}", response_model=Office)
async def delete_office(
    *,
    id: int,
    client_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    result = await db.execute(
        select(OfficeModel)
        .where(OfficeModel.id == id)
        .where(OfficeModel.client_id == client_id)
    )
    office = result.scalar_one_or_none()
    if not office:
        raise HTTPException(status_code=404, detail="Office not found")
    
    await db.delete(office)
    await db.commit()
    return office
