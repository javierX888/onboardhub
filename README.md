# OnBoardHub - Sistema de OnBoarding Inteligente 🚀

![OnBoardHub Logo](https://img.shields.io/badge/Project-OnBoardHub-0c4e54?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Sprint%201-blue?style=for-the-badge)
![Company](https://img.shields.io/badge/Company-Alloxentric-01696f?style=for-the-badge)
![Stack](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python-009688?style=for-the-badge&logo=fastapi)
![Stack](https://img.shields.io/badge/Frontend-React.js-61DAFB?style=for-the-badge&logo=react)
![Stack](https://img.shields.io/badge/Mobile-Flutter-02569B?style=for-the-badge&logo=flutter)

**OnBoardHub** es una solución SaaS multi-tenant desarrollada para **Alloxentric** con el objetivo de automatizar y optimizar los procesos operativos de incorporación (onboarding) de nuevo talento.

---

## 📋 Tabla de Contenidos
- [Sobre el Proyecto](#-sobre-el-proyecto)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Levantamiento](#-instalación-y-levantamiento)
- [Estado del Proyecto](#-estado-del-proyecto)
- [Estructura del Repositorio](#-estructura-del-repositorio)
- [Tecnologías](#️-tecnologías)
- [Estándares Técnicos Alloxentric](#-estándares-técnicos-alloxentric)
- [Convenciones de Trabajo](#-convenciones-de-trabajo)
- [Equipo](#-equipo)

---

## 🎯 Sobre el Proyecto

El proyecto busca abordar la necesidad de automatizar procesos mecánicos y repetitivos que consumen tiempo valioso del área de RRHH. OnBoardHub permite a las organizaciones gestionar el onboarding de sus empleados de forma estructurada, medible y escalable.

### Características Principales
- **Gestión Multi-tenant:** Múltiples empresas con aislamiento lógico estricto por `client_id`.
- **Autenticación Centralizada:** Integración con **Keycloak** para RBAC granular (Admin, Manager RRHH, Empleado).
- **Constructor de Procesos:** Plantillas reutilizables de onboarding con etapas, tareas y SLA configurables.
- **Portal Web y App Móvil:** Experiencia diferenciada por rol: administración web (React) y seguimiento móvil (Flutter).
- **Auditoría y Trazabilidad:** Logs inmutables con 5 dimensiones (quién, qué, cuándo, desde dónde, resultado).

---

## 📌 Requisitos Previos

Antes de empezar, asegúrate de tener instalado:

| Herramienta | Versión Mínima | Descarga |
|:-----------|:--------------|:---------|
| **Python** | 3.10+ | [python.org/downloads](https://www.python.org/downloads/) |
| **Node.js** | 18+ (incluye npm) | [nodejs.org](https://nodejs.org/) |
| **PostgreSQL** | 14+ | [postgresql.org/download](https://www.postgresql.org/download/) |
| **Git** | 2.30+ | [git-scm.com](https://git-scm.com/) |

> **Windows:** Al instalar PostgreSQL, el instalador de Windows incluye **pgAdmin** y configura el servicio automáticamente. Recuerda la contraseña que asignas al usuario `postgres` durante la instalación.

> **Linux:** Instala PostgreSQL desde el gestor de paquetes de tu distribución (ej: `sudo apt install postgresql`).

---

## 🏗 Instalación y Levantamiento

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/javierX888/onboardhub.git
cd onboardhub
```

---

### Paso 2: Configurar la Base de Datos

#### 🪟 Windows

1. Abre **pgAdmin** (se instala junto con PostgreSQL).
2. Conéctate al servidor local (`localhost`, usuario: `postgres`, contraseña: la que pusiste al instalar).
3. Haz clic derecho en **Databases** → **Create** → **Database**.
4. Nombre: `onboardhub` → **Save**.

Alternativamente, desde **PowerShell** o **CMD**:
```powershell
# Abre la consola de PostgreSQL (ajusta la ruta si es diferente)
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres

# Dentro de psql:
CREATE DATABASE onboardhub;
\q
```

#### 🐧 Linux

```bash
sudo -u postgres psql
CREATE DATABASE onboardhub;
\q
```

---

### Paso 3: Configurar Variables de Entorno

Crea un archivo `.env` dentro de la carpeta `backend/`:

#### 🪟 Windows (PowerShell)
```powershell
cd backend
Copy-Item .env.example .env
notepad .env
```

#### 🐧 Linux
```bash
cd backend
cp .env.example .env
nano .env
```

Edita el archivo `.env` con tus credenciales:
```env
DATABASE_URL=postgresql+asyncpg://postgres:TU_CONTRASEÑA@localhost:5432/onboardhub
```

> **Importante:** Reemplaza `TU_CONTRASEÑA` con la contraseña de tu usuario `postgres`. Si usas la contraseña `postgres` (por defecto en desarrollo), queda así:
> ```
> DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/onboardhub
> ```

---

### Paso 4: Instalar y Levantar el Backend

#### 🪟 Windows (PowerShell)

```powershell
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
.\venv\Scripts\Activate.ps1

# Si da error de ejecución de scripts, ejecuta primero:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Instalar dependencias
pip install -r requirements.txt
pip install email-validator

# Crear las tablas en la base de datos
python -m app.create_tables

# Levantar el servidor
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 🐧 Linux

```bash
cd backend

# Crear entorno virtual
python3 -m venv venv

# Activar entorno virtual
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
pip install email-validator

# Crear las tablas en la base de datos
python -m app.create_tables

# Levantar el servidor
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Si todo sale bien, verás:
```
✅ Todas las tablas fueron creadas exitosamente en PostgreSQL.
   Tablas: ['empresas', 'usuarios', 'journeys', 'tasks']
```

Y el servidor estará disponible en:
- **API:** http://localhost:8000
- **Docs Swagger:** http://localhost:8000/docs

---

### Paso 5: Instalar y Levantar el Frontend

Abre una **nueva terminal** (deja el backend corriendo en la anterior):

```bash
cd frontend

# Instalar dependencias de Node.js
npm install

# Levantar el servidor de desarrollo
npm run dev
```

El frontend estará disponible en: **http://localhost:5173**

---

### Paso 6: Verificar que todo funciona

| URL | Qué deberías ver |
|:----|:-----------------|
| http://localhost:8000/docs | Swagger UI con todos los endpoints |
| http://localhost:5173/admin/empresas | Panel de administración de empresas |
| http://localhost:5173/admin/usuarios | Panel de gestión de usuarios |
| http://localhost:5173/employee | App móvil del empleado (prototipo) |

---

### 🧪 Ejecutar Tests

```bash
cd backend
source venv/bin/activate       # Linux
# .\venv\Scripts\Activate.ps1  # Windows

pip install pytest httpx pytest-asyncio
pytest tests/ -v
```

Resultado esperado:
```
tests/test_hu01_hu02.py::test_crear_empresa PASSED
tests/test_hu01_hu02.py::test_rut_duplicado PASSED
tests/test_hu01_hu02.py::test_listar_empresas PASSED
tests/test_hu01_hu02.py::test_editar_empresa PASSED
tests/test_hu01_hu02.py::test_crear_usuario PASSED
tests/test_hu01_hu02.py::test_email_duplicado PASSED
tests/test_hu01_hu02.py::test_editar_usuario_rol PASSED
tests/test_hu01_hu02.py::test_desactivar_usuario PASSED
============================== 8 passed ===============================
```

> **Nota:** Los tests se ejecutan contra el backend en `localhost:8000`, por lo que el servidor debe estar corriendo.

---

## 🚀 Estado del Proyecto

| Sprint | Foco | Estado |
|--------|------|--------|
| **Sprint 0** | Base técnica: repo, endpoints, setup | ✅ Completado |
| **Sprint 1** | Core onboarding: empresas, usuarios, plantillas, asignación | 🔄 En progreso |
| **Sprint 2** | Seguimiento, carga documental, SLA, alertas, app móvil | ⏳ Pendiente |
| **Sprint 3** | Recordatorios, reportes, feedback de etapas | ⏳ Pendiente |
| **Sprint 4** | QA, manuales, documentación de deployment | ⏳ Pendiente |

### Checklist Sprint 1
- [x] HU-01: Registro de empresas (CRUD completo + validación RUT)
- [x] HU-02: Gestión de usuarios y roles (CRUD + desactivación)
- [ ] HU-03: Plantillas de onboarding con etapas

---

## 📁 Estructura del Repositorio

```text
onboardhub/
├── backend/                        # API REST con FastAPI + Python
│   ├── app/
│   │   ├── api/                    # Routers por módulo (empresas, usuarios, etc.)
│   │   │   ├── deps.py             # Inyección de dependencias (sesión BD)
│   │   │   └── v1/endpoints/       # Endpoints versionados
│   │   ├── core/                   # Configuración y conexión a BD
│   │   │   ├── config.py           # Variables de entorno (Pydantic Settings)
│   │   │   └── database.py         # Motor async SQLAlchemy
│   │   ├── models/                 # Modelos SQLAlchemy (ORM)
│   │   │   ├── base.py             # Base y MultiTenantBase
│   │   │   ├── empresa.py          # Modelo Empresa
│   │   │   ├── usuario.py          # Modelo Usuario
│   │   │   └── journey.py          # Modelos Journey y Task
│   │   ├── schemas/                # Schemas Pydantic (request/response)
│   │   └── services/               # Lógica de negocio por módulo
│   ├── tests/                      # Tests con pytest
│   │   └── test_hu01_hu02.py       # 8 tests para HU-01 y HU-02
│   ├── .env.example                # Variables de entorno base
│   └── requirements.txt
│
├── frontend/                       # Portal Web (React + Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/              # Panel Admin: Empresas y Usuarios
│   │   │   └── employee/           # App Móvil del Empleado (prototipo)
│   │   └── services/               # Llamadas a la API (Axios)
│   ├── index.css                   # Design System (CSS Variables)
│   ├── index.html
│   └── package.json
│
├── docker-compose.yml              # PostgreSQL en contenedor (opcional)
└── README.md
```

---

## 🛠️ Tecnologías

| Capa | Tecnología | Justificación |
|:-----|:-----------|:--------------|
| **Backend** | Python + FastAPI | Indicado por Alloxentric. Alto rendimiento async, ideal para APIs REST |
| **ORM** | SQLAlchemy (async) + Alembic | ORM estándar Python, soporte multi-tenant, migraciones versionadas |
| **Base de Datos** | PostgreSQL | Modelo relacional robusto, soporte multi-tenant por `client_id` |
| **Autenticación** | Keycloak | Requerimiento directo del cliente (Max Kreimerman, reunión 14-04-2026) |
| **Driver BD** | asyncpg | Driver asíncrono nativo para PostgreSQL |
| **Frontend Web** | React.js | Portal Admin y Portal RRHH/Empleado |
| **App Móvil** | Flutter (Dart) | Multiplataforma iOS/Android; persistencia local con Drift |
| **Documentación API** | Swagger / OpenAPI | Autogenerado por FastAPI en `/docs` |

---

## 🏛 Estándares Técnicos Alloxentric

Todos los módulos deben cumplir los estándares transversales definidos por Alloxentric:

- **Multi-tenancy:** Aislamiento lógico estricto. Todo registro incluye `client_id` o `empresa_id`. Ninguna consulta cruza datos entre tenants.
- **RBAC Granular:** Roles `Administrador`, `Manager RRHH` y `Empleado`. Los tokens Keycloak transportan los claims de permisos. El backend valida permisos por recurso, no solo por sesión activa.
- **Feature Gating:** Middleware que evalúa el plan comercial del cliente antes de resolver cada solicitud. Retorna `403` o `402` si el módulo no está habilitado.
- **Auditoría de Logs:** Cada acción registra: quién (usuario + rol), qué (verbo + recurso), cuándo (ISO 8601 ms), desde dónde (IP + User-Agent) y resultado (status code).
- **API-First:** Toda acción de usuario pasa por un endpoint REST documentado. No hay lógica de negocio acoplada al frontend.
- **i18n:** Sin strings hardcodeados. Soporte mínimo Español / Inglés.
- **Light / Dark Mode:** Implementado mediante CSS Custom Properties en el frontend.

---

## 🤝 Convenciones de Trabajo

### Estrategia de Ramas (GitFlow Simplificado)
- `main` — Código estable, listo para presentar al cliente.
- `develop` — Integración continua de funcionalidades del sprint activo.
- `feature/HU-XX-descripcion` — Una rama por historia de usuario (ej: `feature/HU-01-gestion-empresas`).
- `fix/descripcion` — Corrección de errores detectados en QA.

### Convención de Commits (Conventional Commits)

```
feat(HU-01): implementar CRUD de empresas multi-tenant
fix(HU-03): corregir validación de orden de tareas en plantilla
docs: actualizar endpoints en Swagger
chore: configurar Alembic con conexión asyncpg
test(HU-05): agregar pruebas de vista de onboarding del empleado
```

| Prefijo | Uso |
|---------|-----|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de errores |
| `docs:` | Cambios en documentación |
| `test:` | Adición o corrección de pruebas |
| `chore:` | Tareas de mantenimiento (deps, config) |
| `refactor:` | Refactorización sin cambio de comportamiento |

### Pull Requests
- Todo PR debe referenciar la HU correspondiente (ej: `Closes HU-04`).
- Requiere revisión de al menos un integrante antes de hacer merge a `develop`.
- No se hace merge directo a `main` sin demo validada con el cliente.

---

## 👥 Equipo

| Integrante | Rol en el Proyecto |
|:-----------|:-------------------|
| **Javier Gacitúa** | Backend (FastAPI + BD), configuración Git/Keycloak, integración de módulos y deployment |
| **Alejandra Guzmán Sánchez** | QA, documentación técnica y funcional, análisis de requerimientos, manuales de usuario |

> Ambos participan en las reuniones semanales con Alloxentric (martes 10:30 AM) y en la planificación de sprints.

---

*Proyecto desarrollado para **Alloxentric** como parte del Portafolio de Título — Ingeniería en Informática, Duoc UC.*