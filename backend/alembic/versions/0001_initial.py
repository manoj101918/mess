"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-10-03
"""
import sqlalchemy as sa
from alembic import op

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None

TABLES = ["plans", "members", "subscriptions", "reminders_log", "settings"]


def upgrade() -> None:
    op.create_table(
        "plans",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("duration_value", sa.Integer(), nullable=False),
        sa.Column("duration_unit", sa.String(10), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.CheckConstraint("duration_value >= 1", name="ck_plans_duration_positive"),
        sa.CheckConstraint("duration_unit IN ('days', 'months')", name="ck_plans_duration_unit"),
        sa.CheckConstraint("price >= 0", name="ck_plans_price_nonneg"),
    )
    op.create_table(
        "members",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("phone", sa.String(13), nullable=False),
        sa.Column("room_or_address", sa.String(200), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_members_phone", "members", ["phone"])
    op.create_table(
        "subscriptions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("member_id", sa.Integer(), sa.ForeignKey("members.id", ondelete="CASCADE"), nullable=False),
        sa.Column("plan_id", sa.Integer(), sa.ForeignKey("plans.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("amount_paid", sa.Numeric(10, 2), nullable=False),
        sa.Column("payment_mode", sa.String(10), nullable=False),
        sa.Column("paid_on", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("end_date >= start_date", name="ck_subscriptions_dates"),
        sa.CheckConstraint("amount_paid >= 0", name="ck_subscriptions_amount_nonneg"),
        sa.CheckConstraint("payment_mode IN ('cash', 'upi')", name="ck_subscriptions_payment_mode"),
    )
    op.create_index("ix_subscriptions_member_id", "subscriptions", ["member_id"])
    op.create_index("ix_subscriptions_end_date", "subscriptions", ["end_date"])
    op.create_index("ix_subscriptions_paid_on", "subscriptions", ["paid_on"])
    op.create_table(
        "reminders_log",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("member_id", sa.Integer(), sa.ForeignKey("members.id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "subscription_id", sa.Integer(), sa.ForeignKey("subscriptions.id", ondelete="SET NULL"), nullable=True
        ),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("type", sa.String(10), nullable=False),
        sa.CheckConstraint("type IN ('expiring', 'expired')", name="ck_reminders_type"),
    )
    op.create_index("ix_reminders_log_member_id", "reminders_log", ["member_id"])
    op.create_table(
        "settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("mess_name", sa.String(100), nullable=False),
        sa.Column("expiring_window_days", sa.Integer(), nullable=False),
        sa.Column("expiring_template", sa.Text(), nullable=False),
        sa.Column("expired_template", sa.Text(), nullable=False),
    )

    # Supabase exposes the public schema over its REST API with a public anon key.
    # Enabling RLS with no policies blocks that path; the app connects as the table
    # owner, which bypasses RLS.
    if op.get_context().dialect.name == "postgresql":
        for table in TABLES + ["alembic_version"]:
            op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    for table in reversed(TABLES):
        op.drop_table(table)
