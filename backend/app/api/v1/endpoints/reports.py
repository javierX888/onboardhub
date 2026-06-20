from datetime import date, datetime, time
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.journey import Journey as JourneyModel, JourneyTask as JourneyTaskModel
from app.models.template import Template as TemplateModel
from app.models.user import User as UserModel

router = APIRouter()


def _date_to_datetime(value: Optional[date], end_of_day: bool = False) -> Optional[datetime]:
    if not value:
        return None
    return datetime.combine(value, time.max if end_of_day else time.min)


def _format_date(value: Optional[datetime]) -> Optional[str]:
    if not value:
        return None
    return value.date().isoformat()


@router.get("/onboarding")
async def get_onboarding_report(
    empresa_id: Optional[int] = Query(None, alias="empresaId"),
    client_id: Optional[int] = Query(None),
    desde: Optional[date] = Query(None),
    hasta: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
) -> Any:
    if client_id is None and empresa_id is None:
        raise HTTPException(status_code=400, detail="A company identifier is required")

    if client_id is not None and empresa_id is not None and client_id != empresa_id:
        raise HTTPException(status_code=403, detail="Cannot access reports from another company")

    company_id = client_id if client_id is not None else empresa_id
    start_datetime = _date_to_datetime(desde)
    end_datetime = _date_to_datetime(hasta, end_of_day=True)

    query = (
        select(JourneyModel, UserModel.name.label("employee_name"), TemplateModel.name.label("template_name"))
        .options(selectinload(JourneyModel.tasks))
        .join(UserModel, JourneyModel.employee_id == UserModel.id)
        .outerjoin(TemplateModel, JourneyModel.template_id == TemplateModel.id)
        .where(JourneyModel.client_id == company_id)
        .where(UserModel.status == True)
        .where(JourneyModel.status == True)
        .order_by(JourneyModel.start_date.desc().nullslast(), JourneyModel.created_at.desc())
    )

    if start_datetime:
        query = query.where(
            or_(
                JourneyModel.start_date >= start_datetime,
                (JourneyModel.start_date.is_(None) & (JourneyModel.created_at >= start_datetime)),
            )
        )

    if end_datetime:
        query = query.where(
            or_(
                JourneyModel.start_date <= end_datetime,
                (JourneyModel.start_date.is_(None) & (JourneyModel.created_at <= end_datetime)),
            )
        )

    result = await db.execute(query)
    rows = result.unique().all()

    now = datetime.utcnow()
    completed_count = 0
    in_progress_count = 0
    delayed_count = 0
    completion_days = []
    detail = []

    for journey, employee_name, template_name in rows:
        tasks = list(journey.tasks or [])
        total_tasks = len(tasks)
        completed_tasks = sum(1 for task in tasks if task.completed)
        delayed_tasks = sum(
            1
            for task in tasks
            if not task.completed and task.deadline is not None and task.deadline < now
        )
        is_completed = (journey.progress or 0) >= 100
        is_delayed = delayed_tasks > 0

        if is_completed:
            completed_count += 1
        else:
            in_progress_count += 1

        if is_delayed:
            delayed_count += 1

        row_completion_days = None
        if is_completed:
            started_at = journey.start_date or journey.created_at
            finished_at = journey.end_date or journey.updated_at
            if started_at and finished_at and finished_at >= started_at:
                row_completion_days = (finished_at - started_at).days
                completion_days.append(row_completion_days)

        status = "Completado" if is_completed else "Atrasado" if is_delayed else "En curso"

        detail.append({
            "journey_id": journey.id,
            "employee_name": employee_name,
            "template_name": template_name or "Proceso personalizado",
            "role": journey.role,
            "start_date": _format_date(journey.start_date or journey.created_at),
            "end_date": _format_date(journey.end_date),
            "status": status,
            "progress": journey.progress or 0,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "delayed_tasks": delayed_tasks,
            "completion_days": row_completion_days,
        })

    average_completion_days = None
    if completion_days:
        average_completion_days = round(sum(completion_days) / len(completion_days), 1)

    return {
        "filters": {
            "empresaId": company_id,
            "desde": desde.isoformat() if desde else None,
            "hasta": hasta.isoformat() if hasta else None,
        },
        "summary": {
            "total_onboardings": len(rows),
            "completed": completed_count,
            "in_progress": in_progress_count,
            "delayed": delayed_count,
            "average_completion_days": average_completion_days,
        },
        "detail": detail,
    }