from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from ..core.database import AsyncSessionLocal

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency para inyectar la sesión de la base de datos
    en los endpoints de FastAPI de forma asíncrona.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
