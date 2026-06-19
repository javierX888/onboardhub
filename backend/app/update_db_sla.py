import asyncio
from sqlalchemy import text
from app.core.database import engine

async def update_db():
    print("Adding sla_days column to template_tasks...")
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE template_tasks ADD COLUMN IF NOT EXISTS sla_days INTEGER;"))
            print("✅ Column 'sla_days' added successfully.")
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(update_db())
