from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import verify_password
from app.models.user import User as UserModel

router = APIRouter()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/login")
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserModel).where(UserModel.email == payload.email))
    user = result.scalar_one_or_none()
    
    print(f"DEBUG LOGIN: Intentando login para email='{payload.email}'")
    if user:
        is_verified = verify_password(payload.password, user.password_hash)
        print(f"DEBUG LOGIN: Usuario encontrado en BD. ID={user.id}, Hash='{user.password_hash}', Verificado={is_verified}")
        if not is_verified:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    else:
        print("DEBUG LOGIN: Usuario NO encontrado en BD")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if hasattr(user, "status") and user.status is False:
        raise HTTPException(status_code=403, detail="User inactive")

    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "client_id": user.client_id,
        }
    }
