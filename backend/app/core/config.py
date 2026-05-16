import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "OnBoardHub"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Base de Datos PostgreSQL
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+asyncpg://postgres:postgres@localhost:5432/onboardhub"
    )
    
    # Supabase Storage
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
