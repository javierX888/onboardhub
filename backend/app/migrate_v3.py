import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def run_migration():
    print(f"Connecting to {DATABASE_URL}...")
    engine = create_async_engine(DATABASE_URL, echo=True, connect_args={"statement_cache_size": 0})
    
    async with engine.begin() as conn:
        print("Adding supervisor_id column to journeys...")
        await conn.execute(text("ALTER TABLE journeys ADD COLUMN IF NOT EXISTS supervisor_id INTEGER NULL;"))
        
        print("Adding area column to users...")
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS area VARCHAR(255) NULL;"))
        
    print("Migration complete!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_migration())
