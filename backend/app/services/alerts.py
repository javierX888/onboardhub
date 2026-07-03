from datetime import datetime

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import Alert as AlertModel
from app.models.journey import Journey as JourneyModel, JourneyTask as JourneyTaskModel
from app.models.user import User as UserModel


SLA_EXPIRED = "SLA_EXPIRED"


async def evaluate_overdue_alerts(db: AsyncSession, client_id: int) -> int:
    now = datetime.utcnow()
    result = await db.execute(
        select(JourneyTaskModel, JourneyModel, UserModel.name.label("employee_name"))
        .join(JourneyModel, JourneyTaskModel.journey_id == JourneyModel.id)
        .join(UserModel, JourneyModel.employee_id == UserModel.id)
        .where(JourneyTaskModel.client_id == client_id)
        .where(JourneyModel.client_id == client_id)
        .where(UserModel.status == True)
        .where(JourneyModel.status == True)
        .where(JourneyTaskModel.completed == False)
        .where(JourneyTaskModel.deadline.isnot(None))
        .where(JourneyTaskModel.deadline < now)
    )

    created = 0
    for task, journey, employee_name in result.all():
        existing_result = await db.execute(
            select(AlertModel.id).where(
                and_(
                    AlertModel.client_id == client_id,
                    AlertModel.type == SLA_EXPIRED,
                    AlertModel.journey_task_id == task.id,
                )
            )
        )
        if existing_result.scalar_one_or_none():
            continue

        days_overdue = max((now.date() - task.deadline.date()).days, 0)
        message = f"{employee_name}: {task.title} vencida hace {days_overdue} día(s)"
        alert = AlertModel(
            client_id=client_id,
            type=SLA_EXPIRED,
            message=message,
            severity="danger",
            journey_id=journey.id,
            journey_task_id=task.id,
            is_read=False,
        )
        db.add(alert)
        created += 1

    if created:
        await db.commit()

    return created


async def resolve_task_alerts(db: AsyncSession, client_id: int, task_id: int, user_id: int | None = None) -> int:
    result = await db.execute(
        select(AlertModel).where(
            and_(
                AlertModel.client_id == client_id,
                AlertModel.type == SLA_EXPIRED,
                AlertModel.journey_task_id == task_id,
                AlertModel.is_read == False,
            )
        )
    )
    alerts = result.scalars().all()
    attended_at = datetime.utcnow()
    for alert in alerts:
        alert.is_read = True
        alert.attended_at = attended_at
        alert.attended_by = user_id

    return len(alerts)


async def build_alert_response(alert: AlertModel, db: AsyncSession) -> dict:
    task = None
    employee_name = None

    if alert.journey_task_id:
        result = await db.execute(
            select(JourneyTaskModel, UserModel.name.label("employee_name"))
            .join(JourneyModel, JourneyTaskModel.journey_id == JourneyModel.id)
            .join(UserModel, JourneyModel.employee_id == UserModel.id)
            .where(JourneyTaskModel.id == alert.journey_task_id)
            .where(UserModel.status == True)
        )
        row = result.first()
        if row:
            task, employee_name = row

    days_overdue = 0
    if task and task.deadline:
        days_overdue = max((datetime.utcnow().date() - task.deadline.date()).days, 0)

    return {
        "id": alert.id,
        "client_id": alert.client_id,
        "type": alert.type,
        "message": alert.message,
        "severity": alert.severity,
        "journey_id": alert.journey_id,
        "journey_task_id": alert.journey_task_id,
        "is_read": alert.is_read,
        "employee_name": employee_name,
        "task_title": task.title if task else None,
        "deadline": task.deadline if task else None,
        "days_overdue": days_overdue,
        "attended_at": alert.attended_at,
        "attended_by": alert.attended_by,
        "created_at": alert.created_at,
        "updated_at": alert.updated_at,
    }