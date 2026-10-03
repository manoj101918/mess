from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from .. import models
from ..db import get_db
from ..logic import fill_template, now_utc, today_ist, whatsapp_link
from ..schemas import (
    MemberCreate,
    MemberDetail,
    MemberSummary,
    MemberUpdate,
    ReminderResult,
    SubscriptionIn,
)
from ..services import (
    as_utc,
    build_subscription,
    current_subscription,
    get_member_or_404,
    get_settings,
    members_query,
    next_start_for,
    reminded_today_ids,
    reminder_out,
    subscription_out,
    summarize,
)

router = APIRouter(prefix="/members", tags=["members"])

MEMBER_FIELDS = ("name", "phone", "room_or_address", "notes")


def _detail(db: Session, member: models.Member) -> MemberDetail:
    settings = get_settings(db)
    summary = summarize(member, today_ist(), settings.expiring_window_days, reminded_today_ids(db))
    subs = sorted(member.subscriptions, key=lambda s: (s.end_date, s.id), reverse=True)
    reminders = sorted(member.reminders, key=lambda r: r.id, reverse=True)
    return MemberDetail(
        **summary.model_dump(),
        notes=member.notes,
        created_at=as_utc(member.created_at),
        next_start_date=next_start_for(member),
        subscriptions=[subscription_out(s) for s in subs],
        reminders=[reminder_out(r) for r in reminders],
    )


@router.get("", response_model=list[MemberSummary])
def list_members(
    search: str = "",
    status: Literal["", "all", "active", "expiring", "expired"] = "",
    db: Session = Depends(get_db),
):
    q = members_query().order_by(models.Member.name)
    term = search.strip()
    if term:
        conditions = [models.Member.name.ilike(f"%{term}%")]
        digits = "".join(ch for ch in term if ch.isdigit())
        if digits:
            conditions.append(models.Member.phone.contains(digits))
        q = q.where(or_(*conditions))
    settings = get_settings(db)
    today = today_ist()
    reminded = reminded_today_ids(db)
    rows = [summarize(m, today, settings.expiring_window_days, reminded) for m in db.scalars(q)]
    if status and status != "all":
        rows = [r for r in rows if r.status == status]
    return rows


@router.post("", response_model=MemberDetail, status_code=201)
def create_member(data: MemberCreate, db: Session = Depends(get_db)):
    member = models.Member(
        **data.model_dump(include=set(MEMBER_FIELDS)),
        created_at=now_utc(),
    )
    sub_data = SubscriptionIn(**data.model_dump(include=set(SubscriptionIn.model_fields)))
    member.subscriptions.append(build_subscription(db, sub_data, default_start=today_ist()))
    db.add(member)
    db.commit()
    return _detail(db, get_member_or_404(db, member.id))


@router.get("/{member_id}", response_model=MemberDetail)
def get_member(member_id: int, db: Session = Depends(get_db)):
    return _detail(db, get_member_or_404(db, member_id))


@router.put("/{member_id}", response_model=MemberDetail)
def update_member(member_id: int, data: MemberUpdate, db: Session = Depends(get_db)):
    member = get_member_or_404(db, member_id)
    for key, value in data.model_dump().items():
        setattr(member, key, value)
    db.commit()
    return _detail(db, member)


@router.delete("/{member_id}", status_code=204)
def delete_member(member_id: int, db: Session = Depends(get_db)):
    member = get_member_or_404(db, member_id)
    db.delete(member)
    db.commit()
    return Response(status_code=204)


@router.post("/{member_id}/renew", response_model=MemberDetail, status_code=201)
def renew_member(member_id: int, data: SubscriptionIn, db: Session = Depends(get_db)):
    member = get_member_or_404(db, member_id)
    member.subscriptions.append(build_subscription(db, data, default_start=next_start_for(member)))
    db.commit()
    db.expire_all()
    return _detail(db, get_member_or_404(db, member_id))


@router.post("/{member_id}/reminders", response_model=ReminderResult, status_code=201)
def send_reminder(member_id: int, db: Session = Depends(get_db)):
    member = get_member_or_404(db, member_id)
    sub = current_subscription(member)
    if sub is None:
        raise HTTPException(422, "This member has no plan yet")
    settings = get_settings(db)
    expired = sub.end_date < today_ist()
    template = settings.expired_template if expired else settings.expiring_template
    # Quote the plan's current price; fall back to what they paid last time.
    amount = sub.plan.price if sub.plan.is_active else sub.amount_paid
    message = fill_template(
        template,
        name=member.name,
        end_date=sub.end_date,
        plan=sub.plan.name,
        amount=amount,
        mess_name=settings.mess_name,
    )
    log = models.ReminderLog(
        member_id=member.id,
        subscription_id=sub.id,
        sent_at=now_utc(),
        type="expired" if expired else "expiring",
    )
    db.add(log)
    db.commit()
    return ReminderResult(reminder=reminder_out(log), message=message, wa_link=whatsapp_link(member.phone, message))
