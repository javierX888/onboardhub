"""
Script para crear todas las tablas en PostgreSQL.
Ejecutar con: python -m app.create_tables
"""
import asyncio
from app.core.database import engine
from app.models.base import Base
# Importar todos los modelos para que SQLAlchemy los registre
from app.models.empresa import Empresa
from app.models.usuario import Usuario
from app.models.journey import Journey, Task

async def create_all():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Todas las tablas fueron creadas exitosamente en PostgreSQL.")
    print("   Tablas:", list(Base.metadata.tables.keys()))

if __name__ == "__main__":
    asyncio.run(create_all())
