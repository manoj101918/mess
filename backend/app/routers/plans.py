from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models
from ..db import get_db
from ..logic import compute_end_date, today_ist
from ..schemas import EndDatePreview, PlanIn, PlanOut
from ..services import get_plan_or_404

router = APIRouter(prefix="/plans", tags=["plans"])


@router.get("", response_model=list[PlanOut])
def list_plans(active_only: bool = False, db: Session = Depends(get_db)):
    q = select(models.Plan).order_by(models.Plan.is_active.desc(), models.Plan.name)
    if active_only:
        q = q.where(models.Plan.is_active.is_(True))
    return db.scalars(q).all()


@router.get("/preview-end-date", response_model=EndDatePreview)
def preview_end_date(plan_id: int, start_date: date | None = None, db: Session = Depends(get_db)):
    plan = get_plan_or_404(db, plan_id)
    start = start_date or today_ist()
    return EndDatePreview(start_date=start, end_date=compute_end_date(start, plan.duration_value, plan.duration_unit))


@router.post("", response_model=PlanOut, status_code=201)
def create_plan(data: PlanIn, db: Session = Depends(get_db)):
    plan = models.Plan(**data.model_dump())
    db.add(plan)
    db.commit()
    return plan


@router.put("/{plan_id}", response_model=PlanOut)
def update_plan(plan_id: int, data: PlanIn, db: Session = Depends(get_db)):
    plan = get_plan_or_404(db, plan_id)
    for key, value in data.model_dump().items():
        setattr(plan, key, value)
    db.commit()
    return plan
