"""Shared database helpers used by several routers."""

from datetime import date, datetime, time, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from . import models
from .logic import IST, compute_end_date, now_utc, compute_status, renewal_start, today_ist
from .schemas import MemberSummary, ReminderOut, SubscriptionIn, SubscriptionOut


def get_settings(db: Session) -> models.Settings:
    row = db.scalar(select(models.Settings).order_by(models.Settings.id).limit(1))
    if row is None:
        row = models.Settings(
            mess_name="My Mess",
            expiring_window_days=3,
            expiring_template=models.DEFAULT_EXPIRING_TEMPLATE,
            expired_template=models.DEFAULT_EXPIRED_TEMPLATE,
        )
        db.add(row)
        db.commit()
    return row


def as_utc(dt: datetime | None) -> datetime | None:
    """SQLite hands back naive datetimes; everything we store is UTC."""
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def start_of_today_utc() -> datetime:
    return datetime.combine(today_ist(), time.min, tzinfo=IST).astimezone(timezone.utc)


def current_subscription(member: models.Member) -> models.Subscription | None:
    if not member.subscriptions:
        return None
    return max(member.subscriptions, key=lambda s: (s.end_date, s.id))


def members_query():
    return select(models.Member).options(
        selectinload(models.Member.subscriptions).selectinload(models.Subscription.plan)
    )


def reminded_today_ids(db: Session) -> set[int]:
    rows = db.scalars(
        select(models.ReminderLog.member_id).where(models.ReminderLog.sent_at >= start_of_today_utc())
    )
    return set(rows)


def summarize(member: models.Member, today: date, window: int, reminded: set[int]) -> MemberSummary:
    sub = current_subscription(member)
    if sub is None:
        # Shouldn't happen (members are created with a subscription), but stay safe.
        info_status, days_left = "expired", 0
    else:
        info = compute_status(sub.end_date, today, window)
        info_status, days_left = info.status, info.days_left
    return MemberSummary(
        id=member.id,
        name=member.name,
        phone=member.phone,
        room_or_address=member.room_or_address,
        plan_id=sub.plan_id if sub else None,
        plan_name=sub.plan.name if sub else None,
        start_date=sub.start_date if sub else None,
        end_date=sub.end_date if sub else None,
        status=info_status,
        days_left=days_left,
        days_overdue=max(0, -days_left),
        reminded_today=member.id in reminded,
        current_subscription_id=sub.id if sub else None,
    )


def subscription_out(sub: models.Subscription) -> SubscriptionOut:
    return SubscriptionOut(
        id=sub.id,
        plan_id=sub.plan_id,
        plan_name=sub.plan.name,
        start_date=sub.start_date,
        end_date=sub.end_date,
        amount_paid=float(sub.amount_paid),
        payment_mode=sub.payment_mode,
        paid_on=sub.paid_on,
        created_at=as_utc(sub.created_at),
    )


def reminder_out(r: models.ReminderLog) -> ReminderOut:
    return ReminderOut(id=r.id, subscription_id=r.subscription_id, sent_at=as_utc(r.sent_at), type=r.type)


def get_plan_or_404(db: Session, plan_id: int) -> models.Plan:
    plan = db.get(models.Plan, plan_id)
    if plan is None:
        raise HTTPException(404, "Plan not found")
    return plan


def get_member_or_404(db: Session, member_id: int) -> models.Member:
    member = db.scalar(members_query().where(models.Member.id == member_id))
    if member is None:
        raise HTTPException(404, "Member not found")
    return member


def build_subscription(
    db: Session, data: SubscriptionIn, default_start: date
) -> models.Subscription:
    """Fill in defaults (start, end, amount, paid_on) and validate the result."""
    plan = get_plan_or_404(db, data.plan_id)
    if not plan.is_active:
        raise HTTPException(422, f"The plan '{plan.name}' is turned off. Pick another plan or turn it on in Settings.")
    start = data.start_date or default_start
    end = data.end_date or compute_end_date(start, plan.duration_value, plan.duration_unit)
    if end < start:
        raise HTTPException(422, "End date cannot be before start date")
    return models.Subscription(
        plan=plan,
        start_date=start,
        end_date=end,
        amount_paid=data.amount_paid if data.amount_paid is not None else plan.price,
        payment_mode=data.payment_mode,
        paid_on=data.paid_on or today_ist(),
        created_at=now_utc(),
    )


def next_start_for(member: models.Member) -> date:
    sub = current_subscription(member)
    return renewal_start(sub.end_date if sub else None, today_ist())
