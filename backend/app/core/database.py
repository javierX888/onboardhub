from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from .config import settings

# Motor de base de datos asíncrono
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,  # Útil para debugging (ver SQL) en True
    future=True
)

# Fábrica de sesiones asíncronas
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)
