from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.company import Company as CompanyModel
from app.schemas.company import Company, CompanyCreate, CompanyUpdate

router = APIRouter()

def apply_status_filter(query, model, status: str):
    if status == "active":
        return query.where(model.status == True)
    if status == "inactive":
        return query.where(model.status == False)
    if status == "all":
        return query
    raise HTTPException(status_code=400, detail="Invalid status filter. Use active, inactive or all")

@router.get("/", response_model=List[Company])
async def read_companies(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    status: str = "active",
) -> Any:
    query = apply_status_filter(select(CompanyModel), CompanyModel, status).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{id}", response_model=Company)
async def read_company(
    id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    result = await db.execute(select(CompanyModel).where(CompanyModel.id == id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@router.post("/", response_model=Company)
async def create_company(
    *,
    db: AsyncSession = Depends(get_db),
    company_in: CompanyCreate,
) -> Any:
    company = CompanyModel(**company_in.model_dump())
    db.add(company)
    await db.commit()
    await db.refresh(company)
    return company

@router.put("/{id}", response_model=Company)
async def update_company(
    *,
    db: AsyncSession = Depends(get_db),
    id: int,
    company_in: CompanyUpdate,
) -> Any:
    result = await db.execute(select(CompanyModel).where(CompanyModel.id == id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    update_data = company_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company, field, value)
    
    await db.commit()
    await db.refresh(company)
    return company

@router.delete("/{id}", response_model=Company)
async def delete_company(
    *,
    db: AsyncSession = Depends(get_db),
    id: int,
) -> Any:
    result = await db.execute(select(CompanyModel).where(CompanyModel.id == id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    company.status = False
    db.add(company)
    await db.commit()
    return company
