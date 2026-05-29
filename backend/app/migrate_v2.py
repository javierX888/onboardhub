import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def run_migration():
    print(f"Connecting to {DATABASE_URL}...")
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        print("Adding columns to template_tasks...")
        await conn.execute(text("ALTER TABLE template_tasks ADD COLUMN IF NOT EXISTS is_evidence_mandatory BOOLEAN DEFAULT FALSE;"))
        
        print("Adding columns to journey_tasks...")
        await conn.execute(text("ALTER TABLE journey_tasks ADD COLUMN IF NOT EXISTS is_evidence_mandatory BOOLEAN DEFAULT FALSE;"))
        await conn.execute(text("ALTER TABLE journey_tasks ADD COLUMN IF NOT EXISTS supervisor_document_url VARCHAR(500) NULL;"))
        
        print("Creating areas table...")
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS areas (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                client_id INTEGER NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
    print("Migration complete!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_migration())
