from fastapi import APIRouter, HTTPException, Depends
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from ....schemas.empresa import EmpresaCreate, EmpresaUpdate, Empresa as EmpresaSchema
from ....models.empresa import Empresa
from ...deps import get_db

router = APIRouter()

@router.get("/", response_model=List[EmpresaSchema])
async def get_empresas(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Empresa))
    empresas = result.scalars().all()
    return empresas

@router.post("/", response_model=EmpresaSchema)
async def create_empresa(empresa: EmpresaCreate, db: AsyncSession = Depends(get_db)):
    # Validación RUT (ejemplo básico, se puede extender)
    result = await db.execute(select(Empresa).filter(Empresa.rut == empresa.rut))
    db_empresa = result.scalars().first()
    if db_empresa:
        raise HTTPException(status_code=400, detail="El RUT ya está registrado")
    
    new_empresa = Empresa(
        nombre=empresa.nombre,
        rut=empresa.rut,
        estado=empresa.estado
    )
    db.add(new_empresa)
    await db.commit()
    await db.refresh(new_empresa)
    return new_empresa

@router.get("/{empresa_id}", response_model=EmpresaSchema)
async def get_empresa(empresa_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Empresa).filter(Empresa.id == empresa_id))
    empresa = result.scalars().first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    return empresa

@router.put("/{empresa_id}", response_model=EmpresaSchema)
async def update_empresa(empresa_id: int, empresa_data: EmpresaUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Empresa).filter(Empresa.id == empresa_id))
    db_empresa = result.scalars().first()
    
    if not db_empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    # Actualizar campos permitidos
    update_data = empresa_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_empresa, key, value)
        
    await db.commit()
    await db.refresh(db_empresa)
    return db_empresa
