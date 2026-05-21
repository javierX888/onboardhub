import asyncio
from sqlalchemy import text
from app.core.database import engine

async def update_db():
    print("Adding columns area and resource_url...")
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE templates ADD COLUMN IF NOT EXISTS area VARCHAR(100);"))
            print("✅ Column 'area' added to templates.")
            await conn.execute(text("ALTER TABLE template_tasks ADD COLUMN IF NOT EXISTS resource_url VARCHAR(500);"))
            print("✅ Column 'resource_url' added to template_tasks.")
            
            # Since we will also need this in journey_tasks for the employee view
            await conn.execute(text("ALTER TABLE journey_tasks ADD COLUMN IF NOT EXISTS resource_url VARCHAR(500);"))
            print("✅ Column 'resource_url' added to journey_tasks.")
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(update_db())
