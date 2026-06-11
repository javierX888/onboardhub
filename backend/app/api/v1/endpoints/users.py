from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.user import User as UserModel
from app.schemas.user import User, UserCreate, UserUpdate
from app.core.security import get_password_hash

router = APIRouter()

def apply_status_filter(query, model, status: str):
    if status == "active":
        return query.where(model.status == True)
    if status == "inactive":
        return query.where(model.status == False)
    if status == "all":
        return query
    raise HTTPException(status_code=400, detail="Invalid status filter. Use active, inactive or all")

@router.get("/", response_model=List[User])
async def read_users(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    status: str = "active",
) -> Any:
    query = apply_status_filter(select(UserModel), UserModel, status).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{id}", response_model=User)
async def read_user(
    id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    result = await db.execute(select(UserModel).where(UserModel.id == id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/company/{client_id}", response_model=List[User])
async def read_users_by_company(
    client_id: int,
    db: AsyncSession = Depends(get_db),
    status: str = "active",
) -> Any:
    query = apply_status_filter(
        select(UserModel)
        .where(UserModel.client_id == client_id),
        UserModel,
        status,
    )
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/", response_model=User)
async def create_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    # Check if email exists
    result = await db.execute(select(UserModel).where(UserModel.email == user_in.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Map 'password' from schema to 'password_hash' in model
    user_data = user_in.model_dump()
    password = user_data.pop("password")
    user_data["password_hash"] = get_password_hash(password)
    
    user = UserModel(**user_data)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.put("/{id}", response_model=User)
async def update_user(
    *,
    db: AsyncSession = Depends(get_db),
    id: int,
    user_in: UserUpdate,
) -> Any:
    result = await db.execute(select(UserModel).where(UserModel.id == id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data:
        password = update_data.pop("password")
        update_data["password_hash"] = get_password_hash(password)
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/{id}", response_model=User)
async def delete_user(
    *,
    db: AsyncSession = Depends(get_db),
    id: int,
) -> Any:
    result = await db.execute(select(UserModel).where(UserModel.id == id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = False
    db.add(user)
    await db.commit()
    return user
