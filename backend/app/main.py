from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .api.v1.endpoints import companies, employee, users, templates, journeys, dashboard

app = FastAPI(
    title="OnBoardHub API",
    description="Intelligent system to manage talent onboarding at Alloxentric (Multi-tenant SaaS)",
    version="0.2.0",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(companies.router, prefix="/api/v1/companies", tags=["companies"])
app.include_router(employee.router, prefix="/api/v1/employee", tags=["employee"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(templates.router, prefix="/api/v1/templates", tags=["templates"])
app.include_router(journeys.router, prefix="/api/v1/journeys", tags=["journeys"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])

# Serve Static Files (Uploaded documents)
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
async def root():
    return {
        "message": "Welcome to OnBoardHub API",
        "status": "Running",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
