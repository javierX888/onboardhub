from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.user import User as UserModel
from app.schemas.user import User, UserCreate, UserUpdate

router = APIRouter()

@router.get("/", response_model=List[User])
async def read_users(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    result = await db.execute(select(UserModel).offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/company/{client_id}", response_model=List[User])
async def read_users_by_company(
    client_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    result = await db.execute(select(UserModel).where(UserModel.client_id == client_id))
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
    
    # Map 'password' from schema to 'password_hash' in model (Simulated hash for now)
    user_data = user_in.model_dump()
    password = user_data.pop("password")
    user_data["password_hash"] = f"hashed_{password}"
    
    user = UserModel(**user_data)
    db.add(user)
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
    await db.delete(user)
    await db.commit()
    return user
