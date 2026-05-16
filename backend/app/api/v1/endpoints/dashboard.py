from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
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
        select(func.count(JourneyTaskModel.id))
        .where(JourneyTaskModel.client_id == client_id)
        .where(JourneyTaskModel.completed == False)
        .where(JourneyTaskModel.deadline < now)
    )
    overdue_tasks = overdue_tasks_q.scalar() or 0

    # Average NPS
    nps_q = await db.execute(
        select(func.avg(NPSModel.score))
        .where(NPSModel.client_id == client_id)
    )
    avg_nps = nps_q.scalar() or 4.2

    # 2. Employee Status (Recent Journeys with employee names)
    status_q = await db.execute(
        select(JourneyModel, UserModel.name, UserModel.role)
        .join(UserModel, JourneyModel.employee_id == UserModel.id)
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
            "journey_id": journey.id
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
            "time": "Reciente" # Placeholder for time diff
        })

    return {
        "kpis": [
            {"label": "dashboard_kpi_active", "value": str(active_processes), "delta": "+0", "deltaType": "neutral"},
            {"label": "dashboard_kpi_employees", "value": str(employees_onboarding), "delta": "+0", "deltaType": "neutral"},
            {"label": "dashboard_kpi_overdue", "value": str(overdue_tasks), "delta": "+0", "deltaType": "neutral"},
            {"label": "dashboard_kpi_nps", "value": str(round(float(avg_nps), 1)), "delta": "+0", "deltaType": "neutral"},
        ],
        "employee_status": employee_status,
        "recent_alerts": recent_alerts
    }
