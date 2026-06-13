import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
from dotenv import load_dotenv

# Load from both possible locations
load_dotenv()
load_dotenv("backend/.env")

DATABASE_URL = os.getenv("DATABASE_URL")

async def run_migration():
    print(f"Connecting to {DATABASE_URL}...")
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        print("Adding status column to offices...")
        await conn.execute(text("ALTER TABLE offices ADD COLUMN IF NOT EXISTS status BOOLEAN DEFAULT TRUE;"))
        
        print("Adding status column to journeys...")
        await conn.execute(text("ALTER TABLE journeys ADD COLUMN IF NOT EXISTS status BOOLEAN DEFAULT TRUE;"))
        
    print("Migration complete!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_migration())
