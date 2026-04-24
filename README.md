# OnBoardHub - Sistema de OnBoarding Inteligente 🚀

![OnBoardHub Logo](https://img.shields.io/badge/Project-OnBoardHub-0c4e54?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Sprint%200-orange?style=for-the-badge)
![Company](https://img.shields.io/badge/Company-Alloxentric-01696f?style=for-the-badge)
![Stack](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python-009688?style=for-the-badge&logo=fastapi)
![Stack](https://img.shields.io/badge/Frontend-React.js-61DAFB?style=for-the-badge&logo=react)
![Stack](https://img.shields.io/badge/Mobile-Flutter-02569B?style=for-the-badge&logo=flutter)

**OnBoardHub** es una solución SaaS multi-tenant desarrollada para **Alloxentric** con el objetivo de automatizar y optimizar los procesos operativos de incorporación (onboarding) de nuevo talento.

---

## 📋 Tabla de Contenidos
- [Sobre el Proyecto](#-sobre-el-proyecto)
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

## 🚀 Estado del Proyecto

| Sprint | Foco | Estado |
|--------|------|--------|
| **Sprint 0** | Base técnica: repo, Keycloak, endpoints, setup | ✅ Completado |
| **Sprint 1** | Core onboarding: empresas, usuarios, plantillas, asignación | 🔄 En progreso |
| **Sprint 2** | Seguimiento, carga documental, SLA, alertas, app móvil | ⏳ Pendiente |
| **Sprint 3** | Recordatorios, reportes, feedback de etapas | ⏳ Pendiente |
| **Sprint 4** | QA, manuales, documentación de deployment | ⏳ Pendiente |

### Checklist Sprint 0
- [x] Definición de estructura del repositorio y convenciones de trabajo (HU-00-01)
- [x] Inicialización técnica del backend (FastAPI) y frontend (React) (HU-00-02)
- [ ] Configuración de Keycloak: realm, roles base, flujo de sesión (HU-00-03)
- [x] Documentación de endpoints internos del modelo de datos (HU-00-04)


---

## 📁 Estructura del Repositorio

```text
Sistema-de-OnBoarding-Portafolio/
├── backend/                        # API REST con FastAPI + Python
│   ├── app/
│   │   ├── api/                    # Routers por módulo (empresas, usuarios, etc.)
│   │   ├── core/                   # Configuración, seguridad, Keycloak
│   │   ├── models/                 # Modelos SQLAlchemy (ORM)
│   │   ├── schemas/                # Schemas Pydantic (request/response)
│   │   └── services/               # Lógica de negocio por módulo
│   ├── alembic/                    # Migraciones de base de datos
│   ├── tests/                      # Pruebas unitarias e integración
│   ├── .env.example                # Variables de entorno base
│   └── requirements.txt
│
├── frontend/                       # Portal Web Admin y Portal Empleado (React.js)
│   ├── src/
│   │   ├── components/             # Componentes reutilizables
│   │   ├── pages/                  # Vistas por rol (Admin, RRHH, Empleado)
│   │   ├── services/               # Llamadas a la API
│   │   └── context/                # Estado global (auth, tenant)
│   └── package.json
│
├── mobile/                         # App Empleado (Flutter + Drift)
│   ├── lib/
│   │   ├── screens/                # Pantallas por flujo
│   │   ├── services/               # Integración con API REST
│   │   └── models/                 # Modelos Drift (persistencia local)
│   └── pubspec.yaml
│
├── docs/                           # Documentación técnica y funcional
│   ├── api/                        # Especificación OpenAPI / Swagger
│   ├── backlog/                    # Historias de Usuario y Sprints (backlog v3)
│   ├── architecture/               # Diagramas de arquitectura y modelo ER
│   └── meetings/                   # Actas de reuniones con Alloxentric
│
├── Fase 1/                         # Entregables académicos Fase 1 (PTY4478)
│   └── ...
│
├── .github/
│   └── PULL_REQUEST_TEMPLATE.md    # Template para Pull Requests
│
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

feat(HU-01): implementar CRUD de empresas multi-tenant
fix(HU-03): corregir validación de orden de tareas en plantilla
docs: actualizar endpoints en Swagger
chore: configurar Alembic con conexión asyncpg
test(HU-05): agregar pruebas de vista de onboarding del empleado

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