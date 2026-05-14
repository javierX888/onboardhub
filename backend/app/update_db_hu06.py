import asyncio
from sqlalchemy import text
from app.core.database import engine

async def update_db():
    print("Añadiendo columna document_url a journey_tasks...")
    async with engine.begin() as conn:
        try:
            # Añadir la columna document_url si no existe
            await conn.execute(text("ALTER TABLE journey_tasks ADD COLUMN IF NOT EXISTS document_url VARCHAR(500);"))
            print("✅ Columna document_url añadida exitosamente.")
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(update_db())
