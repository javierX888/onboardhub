from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import hashlib

from ...deps import get_db
from ....models.usuario import Usuario
from ....schemas.usuario import UsuarioCreate, UsuarioResponse, UsuarioUpdate

router = APIRouter()

# Función hash muy simple para MVP antes de Keycloak
def get_password_hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@router.post("/", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
async def create_usuario(usuario: UsuarioCreate, db: AsyncSession = Depends(get_db)):
    # Check if email exists
    result = await db.execute(select(Usuario).where(Usuario.email == usuario.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    
    hashed_password = get_password_hash(usuario.password)
    
    db_usuario = Usuario(
        email=usuario.email,
        nombre=usuario.nombre,
        password_hash=hashed_password,
        rol=usuario.rol,
        estado=usuario.estado,
        client_id=usuario.client_id
    )
    db.add(db_usuario)
    await db.commit()
    await db.refresh(db_usuario)
    return db_usuario

@router.get("/empresa/{client_id}", response_model=list[UsuarioResponse])
async def read_usuarios_by_empresa(client_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Usuario).where(Usuario.client_id == client_id))
    return result.scalars().all()

@router.put("/{usuario_id}", response_model=UsuarioResponse)
async def update_usuario(usuario_id: int, usuario_data: UsuarioUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Usuario).where(Usuario.id == usuario_id))
    db_usuario = result.scalars().first()
    
    if not db_usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    update_data = usuario_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_usuario, key, value)
    
    await db.commit()
    await db.refresh(db_usuario)
    return db_usuario
