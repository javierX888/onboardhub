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
        print("Creating offices table...")
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS offices (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                client_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        print("Adding status column to templates...")
        await conn.execute(text("ALTER TABLE templates ADD COLUMN IF NOT EXISTS status BOOLEAN DEFAULT TRUE;"))
        
    print("Migration complete!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_migration())
