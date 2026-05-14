import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
from dotenv import load_dotenv

# Cargar variables de entorno si existe .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def test_connection():
    if not DATABASE_URL:
        print("❌ Error: No se encontró la variable DATABASE_URL en el entorno o archivo .env")
        return

    print(f"🔗 Intentando conectar a: {DATABASE_URL.split('@')[-1]} ...")
    
    try:
        engine = create_async_engine(DATABASE_URL)
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT version();"))
            version = result.scalar()
            print(f"✅ ¡Conexión exitosa!")
            print(f"📊 Versión de PostgreSQL: {version}")
        await engine.dispose()
    except Exception as e:
        print(f"❌ Falló la conexión: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
