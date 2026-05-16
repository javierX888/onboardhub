from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from datetime import datetime
from typing import Any

from app.core.database import get_db
from app.models.journey import Journey as JourneyModel, JourneyTask as JourneyTaskModel
from app.models.user import User as UserModel
from app.models.nps import NPSResponse as NPSModel
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

    # Average NPS
    nps_q = await db.execute(
        select(func.avg(NPSModel.score))
        .where(NPSModel.client_id == client_id)
    )
    avg_nps = nps_q.scalar() or 4.2

    # 2. Employee Status (Show only the latest journey per employee to avoid duplicates)
    latest_journeys_subq = (
        select(
            JourneyModel.employee_id,
            func.max(JourneyModel.id).label("latest_id")
        )
        .where(JourneyModel.client_id == client_id)
        .group_by(JourneyModel.employee_id)
        .subquery()
    )

    status_q = await db.execute(
        select(JourneyModel, UserModel.name, UserModel.role)
        .options(selectinload(JourneyModel.tasks))
        .join(UserModel, JourneyModel.employee_id == UserModel.id)
        .join(latest_journeys_subq, JourneyModel.id == latest_journeys_subq.c.latest_id)
        .where(JourneyModel.client_id == client_id)
        .order_by(JourneyModel.created_at.desc())
        .limit(10)
    )
    
    employee_status = []
    for journey, name, role in status_q.all():
        employee_status.append({
            "name": name,
            "role": role,
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
        .where(AlertModel.client_id == client_id)
        .order_by(AlertModel.created_at.desc())
        .limit(5)
    )
    recent_alerts_data = alerts_q.scalars().all()
    
    recent_alerts = []
    for a in recent_alerts_data:
        recent_alerts.append({
            "type": a.severity,
            "title": a.message,
            "time": "Reciente"
        })
        
    for t in overdue_tasks_list[:5]:
        recent_alerts.append({
            "type": "danger",
            "title": f"Tarea Vencida: {t.title}",
            "time": "Vencida"
        })

    return {
        "kpis": [
            {"label": "dashboard_kpi_active", "value": str(active_processes), "delta": "+1", "deltaType": "up"},
            {"label": "dashboard_kpi_employees", "value": str(employees_onboarding), "delta": "+2", "deltaType": "up"},
            {"label": "dashboard_kpi_overdue", "value": str(overdue_tasks_count), "delta": "-1", "deltaType": "down"},
            {"label": "dashboard_kpi_nps", "value": str(round(float(avg_nps), 1)), "delta": "+0.5", "deltaType": "up"},
        ],
        "employee_status": employee_status,
        "recent_alerts": recent_alerts[:10]
    }
