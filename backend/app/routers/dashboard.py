from dateutil.relativedelta import relativedelta
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import models
from ..db import get_db
from ..logic import today_ist
from ..schemas import Dashboard, DashboardCounts
from ..services import get_settings, members_query, reminded_today_ids, summarize

router = APIRouter(tags=["dashboard"])

EXPIRED_LOOKBACK_DAYS = 30


@router.get("/dashboard", response_model=Dashboard)
def dashboard(db: Session = Depends(get_db)):
    settings = get_settings(db)
    today = today_ist()
    reminded = reminded_today_ids(db)
    rows = [summarize(m, today, settings.expiring_window_days, reminded) for m in db.scalars(members_query())]

    month_start = today.replace(day=1)
    next_month = month_start + relativedelta(months=1)
    collection = db.scalar(
        select(func.coalesce(func.sum(models.Subscription.amount_paid), 0)).where(
            models.Subscription.paid_on >= month_start, models.Subscription.paid_on < next_month
        )
    )

    expiring = sorted((r for r in rows if r.status == "expiring"), key=lambda r: (r.end_date, r.name))
    expired_all = [r for r in rows if r.status == "expired"]
    expired_recent = sorted(
        (r for r in expired_all if r.days_overdue <= EXPIRED_LOOKBACK_DAYS), key=lambda r: (r.days_overdue, r.name)
    )
    return Dashboard(
        today=today,
        mess_name=settings.mess_name,
        expiring_window_days=settings.expiring_window_days,
        counts=DashboardCounts(
            active=sum(r.status == "active" for r in rows),
            expiring=len(expiring),
            expired=len(expired_all),
            total=len(rows),
            month_collection=float(collection or 0),
        ),
        expiring=expiring,
        expired=expired_recent,
    )
