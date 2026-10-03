from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
    true,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base

DEFAULT_EXPIRING_TEMPLATE = (
    "Hi {name}, your {plan} plan at {mess_name} ends on {end_date}. "
    "Please renew to continue. Amount: ₹{amount}. Thank you!"
)
DEFAULT_EXPIRED_TEMPLATE = (
    "Hi {name}, your {plan} plan at {mess_name} ended on {end_date}. "
    "Please renew at the earliest. Thank you!"
)


class Plan(Base):
    __tablename__ = "plans"
    __table_args__ = (
        CheckConstraint("duration_value >= 1", name="ck_plans_duration_positive"),
        CheckConstraint("duration_unit IN ('days', 'months')", name="ck_plans_duration_unit"),
        CheckConstraint("price >= 0", name="ck_plans_price_nonneg"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    duration_value: Mapped[int] = mapped_column(Integer)
    duration_unit: Mapped[str] = mapped_column(String(10))
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default=true())


class Member(Base):
    __tablename__ = "members"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    phone: Mapped[str] = mapped_column(String(13), index=True)
    room_or_address: Mapped[str | None] = mapped_column(String(200))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    subscriptions: Mapped[list["Subscription"]] = relationship(
        back_populates="member", cascade="all, delete-orphan", passive_deletes=True
    )
    reminders: Mapped[list["ReminderLog"]] = relationship(
        back_populates="member", cascade="all, delete-orphan", passive_deletes=True
    )


class Subscription(Base):
    __tablename__ = "subscriptions"
    __table_args__ = (
        CheckConstraint("end_date >= start_date", name="ck_subscriptions_dates"),
        CheckConstraint("amount_paid >= 0", name="ck_subscriptions_amount_nonneg"),
        CheckConstraint("payment_mode IN ('cash', 'upi')", name="ck_subscriptions_payment_mode"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    member_id: Mapped[int] = mapped_column(ForeignKey("members.id", ondelete="CASCADE"), index=True)
    plan_id: Mapped[int] = mapped_column(ForeignKey("plans.id", ondelete="RESTRICT"))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date, index=True)
    amount_paid: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    payment_mode: Mapped[str] = mapped_column(String(10))
    paid_on: Mapped[date] = mapped_column(Date, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    member: Mapped[Member] = relationship(back_populates="subscriptions")
    plan: Mapped[Plan] = relationship()


class ReminderLog(Base):
    __tablename__ = "reminders_log"
    __table_args__ = (CheckConstraint("type IN ('expiring', 'expired')", name="ck_reminders_type"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    member_id: Mapped[int] = mapped_column(ForeignKey("members.id", ondelete="CASCADE"), index=True)
    subscription_id: Mapped[int | None] = mapped_column(
        ForeignKey("subscriptions.id", ondelete="SET NULL")
    )
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    type: Mapped[str] = mapped_column(String(10))

    member: Mapped[Member] = relationship(back_populates="reminders")


class Settings(Base):
    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    mess_name: Mapped[str] = mapped_column(String(100), default="My Mess")
    expiring_window_days: Mapped[int] = mapped_column(Integer, default=3)
    expiring_template: Mapped[str] = mapped_column(Text, default=DEFAULT_EXPIRING_TEMPLATE)
    expired_template: Mapped[str] = mapped_column(Text, default=DEFAULT_EXPIRED_TEMPLATE)
