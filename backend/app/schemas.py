from datetime import date, datetime
from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from .logic import normalize_phone

Status = Literal["active", "expiring", "expired"]
PaymentMode = Literal["cash", "upi"]
Money = Annotated[Decimal, Field(ge=0, le=10_000_000, max_digits=10, decimal_places=2)]


def _clean_text(v: str | None) -> str | None:
    if v is None:
        return None
    v = v.strip()
    return v or None


# ---------- plans ----------


class PlanIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    duration_value: int = Field(ge=1, le=3650)
    duration_unit: Literal["days", "months"]
    price: Money
    is_active: bool = True

    @field_validator("name")
    @classmethod
    def _name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Plan name is required")
        return v


class PlanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    duration_value: int
    duration_unit: str
    price: float
    is_active: bool


class EndDatePreview(BaseModel):
    start_date: date
    end_date: date


# ---------- subscriptions ----------


class SubscriptionIn(BaseModel):
    """Payment for a plan period. Blank fields are filled in by the server."""

    plan_id: int
    start_date: date | None = None
    end_date: date | None = None
    amount_paid: Money | None = None
    payment_mode: PaymentMode = "cash"
    paid_on: date | None = None

    @model_validator(mode="after")
    def _dates(self):
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("End date cannot be before start date")
        return self


class SubscriptionOut(BaseModel):
    id: int
    plan_id: int
    plan_name: str
    start_date: date
    end_date: date
    amount_paid: float
    payment_mode: str
    paid_on: date
    created_at: datetime | None


# ---------- members ----------


class MemberBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    phone: str
    room_or_address: str | None = Field(default=None, max_length=200)
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator("name")
    @classmethod
    def _name(cls, v: str) -> str:
        v = " ".join(v.split())
        if not v:
            raise ValueError("Name is required")
        return v

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str) -> str:
        return normalize_phone(v)

    @field_validator("room_or_address", "notes")
    @classmethod
    def _optional(cls, v: str | None) -> str | None:
        return _clean_text(v)


class MemberUpdate(MemberBase):
    pass


class MemberCreate(MemberBase, SubscriptionIn):
    """Member details plus their first subscription in one request."""


class MemberSummary(BaseModel):
    id: int
    name: str
    phone: str
    room_or_address: str | None
    plan_id: int | None
    plan_name: str | None
    start_date: date | None
    end_date: date | None
    status: Status
    days_left: int
    days_overdue: int
    reminded_today: bool
    current_subscription_id: int | None


class ReminderOut(BaseModel):
    id: int
    subscription_id: int | None
    sent_at: datetime
    type: str


class MemberDetail(MemberSummary):
    notes: str | None
    created_at: datetime | None
    next_start_date: date
    subscriptions: list[SubscriptionOut]
    reminders: list[ReminderOut]


class ReminderResult(BaseModel):
    reminder: ReminderOut
    message: str
    wa_link: str


# ---------- dashboard ----------


class DashboardCounts(BaseModel):
    active: int
    expiring: int
    expired: int
    total: int
    month_collection: float


class Dashboard(BaseModel):
    today: date
    mess_name: str
    expiring_window_days: int
    counts: DashboardCounts
    expiring: list[MemberSummary]
    expired: list[MemberSummary]


# ---------- settings ----------


class SettingsIn(BaseModel):
    mess_name: str = Field(min_length=1, max_length=100)
    expiring_window_days: int = Field(ge=0, le=30)
    expiring_template: str = Field(min_length=1, max_length=1000)
    expired_template: str = Field(min_length=1, max_length=1000)

    @field_validator("mess_name", "expiring_template", "expired_template")
    @classmethod
    def _strip(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("This field cannot be empty")
        return v


class SettingsOut(SettingsIn):
    model_config = ConfigDict(from_attributes=True)
