from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
from typing import Any

from app.core.database import get_db
from app.models.journey import Journey as JourneyModel, JourneyTask as JourneyTaskModel
from app.models.user import User as UserModel
from app.models.nps import NPSResponse as NPSModel
from app.models.template import Template as TemplateModel
from app.models.alert import Alert as AlertModel

router = APIRouter()

@router.get("/admin")
async def get_admin_dashboard_stats(
    client_id: int = Query(...),
    db: AsyncSession = Depends(get_db),
) -> Any:
    # 1. KPIs
    # Active Processes (Journeys with progress < 100)
    active_journeys_q = await db.execute(
        select(func.count(JourneyModel.id))
        .where(JourneyModel.client_id == client_id)
        .where(JourneyModel.status == True)
        .where(JourneyModel.progress < 100)
    )
    active_processes = active_journeys_q.scalar() or 0

    # Employees in Onboarding (Users with role EMPLOYEE)
    employees_q = await db.execute(
        select(func.count(UserModel.id))
        .where(UserModel.client_id == client_id)
        .where(UserModel.role == 'EMPLOYEE')
    )
    employees_onboarding = employees_q.scalar() or 0

    # Overdue Tasks
    now = datetime.utcnow()
    overdue_tasks_q = await db.execute(
        select(JourneyTaskModel)
        .where(JourneyTaskModel.client_id == client_id)
        .where(JourneyTaskModel.completed == False)
        .where(JourneyTaskModel.deadline.isnot(None))
        .where(JourneyTaskModel.deadline < now)
    )
    overdue_tasks_list = overdue_tasks_q.scalars().all()
    overdue_tasks_count = len(overdue_tasks_list)

    # Average NPS from active users only
    nps_q = await db.execute(
        select(func.avg(NPSModel.score))
        .join(UserModel, NPSModel.employee_id == UserModel.id)
        .where(NPSModel.client_id == client_id)
        .where(UserModel.status == True)
    )
    avg_nps = nps_q.scalar()

    current_period_start = now - timedelta(days=30)
    previous_period_start = now - timedelta(days=60)

    current_nps_q = await db.execute(
        select(func.avg(NPSModel.score))
        .join(UserModel, NPSModel.employee_id == UserModel.id)
        .where(NPSModel.client_id == client_id)
        .where(UserModel.status == True)
        .where(NPSModel.created_at >= current_period_start)
    )
    current_nps = current_nps_q.scalar()

    previous_nps_q = await db.execute(
        select(func.avg(NPSModel.score))
        .join(UserModel, NPSModel.employee_id == UserModel.id)
        .where(NPSModel.client_id == client_id)
        .where(UserModel.status == True)
        .where(NPSModel.created_at >= previous_period_start)
        .where(NPSModel.created_at < current_period_start)
    )
    previous_nps = previous_nps_q.scalar()

    nps_value = "-" if avg_nps is None else str(round(float(avg_nps), 1))
    nps_delta = "-"
    nps_delta_type = "neutral"
    if current_nps is not None and previous_nps is not None:
        nps_delta_value = round(float(current_nps) - float(previous_nps), 1)
        nps_delta = f"{nps_delta_value:+.1f}"
        if nps_delta_value > 0:
            nps_delta_type = "up"
        elif nps_delta_value < 0:
            nps_delta_type = "down"

    # 2. Employee Status (Show only the latest journey per employee to avoid duplicates)
    latest_journeys_subq = (
        select(
            JourneyModel.employee_id,
            func.max(JourneyModel.id).label("latest_id")
        )
        .where(JourneyModel.client_id == client_id)
        .where(JourneyModel.status == True)
        .group_by(JourneyModel.employee_id)
        .subquery()
    )

    status_q = await db.execute(
        select(JourneyModel, UserModel.name, UserModel.role, TemplateModel.name.label("template_name"))
        .options(selectinload(JourneyModel.tasks))
        .join(UserModel, JourneyModel.employee_id == UserModel.id)
        .join(latest_journeys_subq, JourneyModel.id == latest_journeys_subq.c.latest_id)
        .outerjoin(TemplateModel, JourneyModel.template_id == TemplateModel.id)
        .where(JourneyModel.client_id == client_id)
        .order_by(JourneyModel.created_at.desc())
        .limit(10)
    )
    
    employee_status = []
    for journey, name, role, template_name in status_q.all():
        employee_status.append({
            "name": name,
            "role": role,
            "template_name": template_name or "",
            "progress": journey.progress,
            "journey_id": journey.id,
            "tasks": [
                {
                    "title": t.title,
                    "completed": t.completed,
                    "deadline": str(t.deadline.strftime('%Y-%m-%d')) if t.deadline else None,
                    "is_overdue": not t.completed and t.deadline and t.deadline < now,
                    "stage": t.stage
                } for t in journey.tasks
            ]
        })

    # 3. Recent Alerts
    alerts_q = await db.execute(
        select(AlertModel)
        .outerjoin(JourneyTaskModel, AlertModel.journey_task_id == JourneyTaskModel.id)
        .where(AlertModel.client_id == client_id)
        .where(AlertModel.is_read == False)
        .where(or_(AlertModel.journey_task_id.is_(None), JourneyTaskModel.completed == False))
        .order_by(AlertModel.created_at.desc())
        .limit(5)
    )
    recent_alerts_data = alerts_q.scalars().all()
    
    recent_alerts = []
    for a in recent_alerts_data:
        recent_alerts.append({
            "type": a.severity,
            "title": a.message,
            "is_overdue": False,
            "time": "Reciente"
        })
        
    for t in overdue_tasks_list[:5]:
        recent_alerts.append({
            "type": "danger",
            "title": t.title,
            "is_overdue": True,
            "time": "Vencida"
        })

    return {
        "kpis": [
            {"label": "dashboard_kpi_active", "value": str(active_processes), "delta": "+1", "deltaType": "up"},
            {"label": "dashboard_kpi_employees", "value": str(employees_onboarding), "delta": "+2", "deltaType": "up"},
            {"label": "dashboard_kpi_overdue", "value": str(overdue_tasks_count), "delta": "-1", "deltaType": "down"},
            {"label": "dashboard_kpi_nps", "value": nps_value, "delta": nps_delta, "deltaType": nps_delta_type},
        ],
        "employee_status": employee_status,
        "recent_alerts": recent_alerts[:10]
    }


@router.get("/supervisor")
async def get_supervisor_dashboard_stats(
    client_id: int = Query(...),
    supervisor_id: int = Query(...),
    db: AsyncSession = Depends(get_db),
) -> Any:
    # 1. KPIs
    # Active Supervised Processes (Journeys with progress < 100 and supervisor_id == supervisor_id)
    active_journeys_q = await db.execute(
        select(func.count(JourneyModel.id))
        .where(JourneyModel.client_id == client_id)
        .where(JourneyModel.supervisor_id == supervisor_id)
        .where(JourneyModel.status == True)
        .where(JourneyModel.progress < 100)
    )
    active_processes = active_journeys_q.scalar() or 0

    # Employees in Onboarding (Unique employees currently in onboarding under this supervisor)
    employees_q = await db.execute(
        select(func.count(func.distinct(JourneyModel.employee_id)))
        .where(JourneyModel.client_id == client_id)
        .where(JourneyModel.supervisor_id == supervisor_id)
        .where(JourneyModel.status == True)
    )
    employees_onboarding = employees_q.scalar() or 0

    # Overdue Tasks for my supervised employees
    now = datetime.utcnow()
    overdue_tasks_q = await db.execute(
        select(JourneyTaskModel)
        .join(JourneyModel, JourneyTaskModel.journey_id == JourneyModel.id)
        .where(JourneyModel.client_id == client_id)
        .where(JourneyModel.supervisor_id == supervisor_id)
        .where(JourneyModel.status == True)
        .where(JourneyTaskModel.completed == False)
        .where(JourneyTaskModel.deadline.isnot(None))
        .where(JourneyTaskModel.deadline < now)
    )
    overdue_tasks_list = overdue_tasks_q.scalars().all()
    overdue_tasks_count = len(overdue_tasks_list)

    # Average Progress of my supervised employees
    progress_q = await db.execute(
        select(func.avg(JourneyModel.progress))
        .where(JourneyModel.client_id == client_id)
        .where(JourneyModel.supervisor_id == supervisor_id)
        .where(JourneyModel.status == True)
    )
    avg_progress = progress_q.scalar() or 0

    # 2. Employee Status (Show only supervised employees with active/latest journey)
    latest_journeys_subq = (
        select(
            JourneyModel.employee_id,
            func.max(JourneyModel.id).label("latest_id")
        )
        .where(JourneyModel.client_id == client_id)
        .where(JourneyModel.supervisor_id == supervisor_id)
        .where(JourneyModel.status == True)
        .group_by(JourneyModel.employee_id)
        .subquery()
    )

    status_q = await db.execute(
        select(JourneyModel, UserModel.name, UserModel.role, TemplateModel.name.label("template_name"))
        .options(selectinload(JourneyModel.tasks))
        .join(UserModel, JourneyModel.employee_id == UserModel.id)
        .join(latest_journeys_subq, JourneyModel.id == latest_journeys_subq.c.latest_id)
        .outerjoin(TemplateModel, JourneyModel.template_id == TemplateModel.id)
        .where(JourneyModel.client_id == client_id)
        .order_by(JourneyModel.created_at.desc())
        .limit(10)
    )
    
    employee_status = []
    for journey, name, role, template_name in status_q.all():
        employee_status.append({
            "name": name,
            "role": role,
            "template_name": template_name or "",
            "progress": journey.progress,
            "journey_id": journey.id,
            "tasks": [
                {
                    "title": t.title,
                    "completed": t.completed,
                    "deadline": str(t.deadline.strftime('%Y-%m-%d')) if t.deadline else None,
                    "is_overdue": not t.completed and t.deadline and t.deadline < now,
                    "stage": t.stage
                } for t in journey.tasks
            ]
        })

    # 3. Recent Alerts (only for supervised journeys)
    recent_alerts = []
    for t in overdue_tasks_list[:10]:
        recent_alerts.append({
            "type": "danger",
            "title": t.title,
            "is_overdue": True,
            "time": "Vencida"
        })

    return {
        "kpis": [
            {"label": "dashboard_kpi_active", "value": str(active_processes), "delta": "+1" if active_processes > 0 else "0", "deltaType": "up"},
            {"label": "dashboard_kpi_employees", "value": str(employees_onboarding), "delta": "+1" if employees_onboarding > 0 else "0", "deltaType": "up"},
            {"label": "dashboard_kpi_overdue", "value": str(overdue_tasks_count), "delta": "-1" if overdue_tasks_count > 0 else "0", "deltaType": "down"},
            {"label": "dashboard_kpi_progress_avg", "value": f"{round(float(avg_progress), 1)}%", "delta": "+2%" if avg_progress > 0 else "0%", "deltaType": "up"},
        ],
        "employee_status": employee_status,
        "recent_alerts": recent_alerts[:10]
    }


@router.get("/employee/{employee_id}")
async def get_employee_dashboard_stats(
    employee_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Dashboard personalizado para empleados.
    Muestra solo su progreso, tareas y alertas personales.
    """
    
    # 1. Traer usuario y su journey activo
    user_q = await db.execute(
        select(UserModel).where(UserModel.id == employee_id)
    )
    user = user_q.scalar_one_or_none()
    
    if not user:
        return {
            "kpis": [],
            "employee_status": [],
            "recent_alerts": []
        }

    # 2. Obtener el journey más reciente del empleado
    journey_q = await db.execute(
        select(JourneyModel)
        .options(selectinload(JourneyModel.tasks))
        .where(JourneyModel.employee_id == employee_id)
        .where(JourneyModel.status == True)
        .order_by(JourneyModel.created_at.desc())
        .limit(1)
    )
    journey = journey_q.scalar_one_or_none()
    
    now = datetime.utcnow()
    
    # 3. KPIs personales
    total_tasks = 0
    completed_tasks = 0
    overdue_tasks_count = 0
    
    if journey:
        total_tasks = len(journey.tasks)
        completed_tasks = len([t for t in journey.tasks if t.completed])
        overdue_tasks_count = len([t for t in journey.tasks if not t.completed and t.deadline and t.deadline < now])
    
    # 4. Construir datos del proceso del empleado
    employee_status = []
    if journey:
        template_q = await db.execute(
            select(TemplateModel).where(TemplateModel.id == journey.template_id)
        )
        template = template_q.scalar_one_or_none()
        
        employee_status.append({
            "id": journey.id,
            "name": user.name,
            "role": journey.role,
            "template_name": template.name if template else "Proceso de Onboarding",
            "progress": journey.progress,
            "journey_id": journey.id,
            "tasks": [
                {
                    "id": t.id,
                    "title": t.title,
                    "completed": t.completed,
                    "deadline": str(t.deadline.strftime('%Y-%m-%d')) if t.deadline else None,
                    "is_overdue": not t.completed and t.deadline and t.deadline < now,
                    "stage": t.stage
                } for t in journey.tasks
            ]
        })
    
    # 5. Alertas personales
    recent_alerts = []
    
    # Alertas del sistema
    alerts_q = await db.execute(
        select(AlertModel)
        .where(AlertModel.client_id == user.client_id)
        .order_by(AlertModel.created_at.desc())
        .limit(3)
    )
    recent_alerts_data = alerts_q.scalars().all()
    
    for a in recent_alerts_data:
        recent_alerts.append({
            "type": a.severity,
            "title": a.message,
            "is_overdue": False,
            "time": "Reciente"
        })
    
    # Tareas vencidas personales
    if journey:
        for t in journey.tasks:
            if not t.completed and t.deadline and t.deadline < now:
                recent_alerts.append({
                    "type": "danger",
                    "title": t.title,
                    "is_overdue": True,
                    "time": "Vencida"
                })
    
    return {
        "kpis": [
            {"label": "dashboard_kpi_progress", "value": f"{journey.progress if journey else 0}%", "delta": "+5%", "deltaType": "up"},
            {"label": "dashboard_kpi_completed", "value": str(completed_tasks), "delta": f"+{completed_tasks}", "deltaType": "up"},
            {"label": "dashboard_kpi_pending", "value": str(total_tasks - completed_tasks), "delta": f"-{total_tasks - completed_tasks}", "deltaType": "neutral"},
            {"label": "dashboard_kpi_overdue", "value": str(overdue_tasks_count), "delta": "-1" if overdue_tasks_count > 0 else "0", "deltaType": "down"},
        ],
        "employee_status": employee_status,
        "recent_alerts": recent_alerts[:10]
    }
