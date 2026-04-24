# 🚀 OnBoardHub

Plataforma SaaS de Onboarding de Empleados desarrollada con **FastAPI** (Backend) y **React** (Frontend).

## Tecnologías
- **Backend:** Python 3.10, FastAPI, SQLAlchemy (async), PostgreSQL
- **Frontend:** React 18, Vite, Vanilla CSS
- **Base de Datos:** PostgreSQL 14+

## Estructura
```
onboardhub/
├── backend/          # API FastAPI
│   ├── app/
│   │   ├── api/      # Endpoints REST
│   │   ├── core/     # Config y Database
│   │   ├── models/   # Modelos SQLAlchemy
│   │   └── schemas/  # Schemas Pydantic
│   └── tests/        # Tests pytest
├── frontend/         # App React (Vite)
│   └── src/
│       ├── pages/    # Páginas (admin + employee)
│       └── services/ # Servicios API
└── docker-compose.yml
```

## Levantar el proyecto

```bash
# 1. Base de datos
sudo pg_ctlcluster 14 main start

# 2. Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 3. Frontend
cd frontend
npm run dev
```

## Rutas
| Ruta | Descripción |
|------|-------------|
| `/` | Redirige a App Móvil |
| `/employee` | App Móvil del Empleado |
| `/admin/empresas` | Gestión de Empresas |
| `/admin/usuarios` | Gestión de Usuarios |

## Tests
```bash
cd backend
pytest tests/ -v
```
