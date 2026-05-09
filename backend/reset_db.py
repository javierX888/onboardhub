import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.models.base import Base
from app.models.company import Company
from app.models.user import User
from app.models.template import Template, TemplateTask
from app.models.journey import Journey, JourneyTask
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def reset_database():
    print(f"Connecting to {DATABASE_URL}...")
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        print("Dropping all tables...")
        # Explicitly drop old Spanish tables and new English ones to ensure a clean state
        drop_queries = [
            "DROP TABLE IF EXISTS journey_tasks CASCADE;",
            "DROP TABLE IF EXISTS tasks CASCADE;",
            "DROP TABLE IF EXISTS journeys CASCADE;",
            "DROP TABLE IF EXISTS template_tasks CASCADE;",
            "DROP TABLE IF EXISTS tareas_plantilla CASCADE;",
            "DROP TABLE IF EXISTS templates CASCADE;",
            "DROP TABLE IF EXISTS plantillas CASCADE;",
            "DROP TABLE IF EXISTS users CASCADE;",
            "DROP TABLE IF EXISTS usuarios CASCADE;",
            "DROP TABLE IF EXISTS companies CASCADE;",
            "DROP TABLE IF EXISTS empresas CASCADE;"
        ]
        
        for query in drop_queries:
            await conn.execute(text(query))
        
        print("Creating new tables...")
        await conn.run_sync(Base.metadata.create_all)
    
    print("Database reset complete!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(reset_database())
