from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.v1.endpoints import empresas, empleado, usuarios, plantillas

app = FastAPI(
    title="OnBoardHub API",
    description="Sistema inteligente para gestionar la incorporación de talento en Alloxentric (SaaS Multi-tenant)",
    version="0.1.0",
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ajustar en producción
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(empresas.router, prefix="/api/v1/empresas", tags=["empresas"])
app.include_router(empleado.router, prefix="/api/v1/empleado", tags=["empleado"])
app.include_router(usuarios.router, prefix="/api/v1/usuarios", tags=["usuarios"])
app.include_router(plantillas.router, prefix="/api/v1/plantillas", tags=["plantillas"])

@app.get("/")
async def root():
    return {
        "message": "Bienvenido a OnBoardHub API",
        "status": "Running",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
