from datetime import datetime
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.alert import Alert as AlertModel
from app.models.journey import Journey as JourneyModel
from app.models.user import User as UserModel
from app.schemas.alert import Alert, AlertAttendResponse
from app.services.alerts import build_alert_response, evaluate_overdue_alerts

router = APIRouter()


@router.get("/", response_model=List[Alert])
async def read_alerts(
    client_id: int = Query(...),
    status: str = Query("active"),
    user_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
) -> Any:
    await evaluate_overdue_alerts(db, client_id)

    current_user = None
    if user_id is not None:
        current_user_result = await db.execute(
            select(UserModel)
            .where(UserModel.id == user_id)
            .where(UserModel.client_id == client_id)
            .where(UserModel.status == True)
        )
        current_user = current_user_result.scalar_one_or_none()
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")

    query = (
        select(AlertModel)
        .join(JourneyModel, AlertModel.journey_id == JourneyModel.id)
        .join(UserModel, JourneyModel.employee_id == UserModel.id)
        .where(AlertModel.client_id == client_id)
        .where(UserModel.status == True)
    )

    if current_user and current_user.role == "ENCARGADO_AREA":
        query = query.where(UserModel.area == current_user.area)

    if status == "active":
        query = query.where(AlertModel.is_read == False)
    elif status == "history":
        query = query.where(AlertModel.is_read == True)
    elif status != "all":
        raise HTTPException(status_code=400, detail="Invalid alert status")

    result = await db.execute(query.order_by(AlertModel.created_at.desc()))
    alerts = result.scalars().all()
    return [await build_alert_response(alert, db) for alert in alerts]


@router.put("/{alert_id}/attend", response_model=AlertAttendResponse)
async def attend_alert(
    alert_id: int,
    client_id: int = Query(...),
    user_id: int = Query(...),
    db: AsyncSession = Depends(get_db),
) -> Any:
    result = await db.execute(
        select(AlertModel)
        .where(AlertModel.id == alert_id)
        .where(AlertModel.client_id == client_id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_read = True
    alert.attended_at = datetime.utcnow()
    alert.attended_by = user_id

    await db.commit()
    await db.refresh(alert)

    return {
        "status": "success",
        "alert": await build_alert_response(alert, db),
    }