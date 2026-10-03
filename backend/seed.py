"""Load sample data: the Monthly plan (₹3,000) and 5 members with mixed statuses (dates relative to today, IST).

    python seed.py          # insert into the configured database (skips if members exist)
    python seed.py --force  # insert even if data exists
    python seed.py --sql    # print equivalent SQL (for pasting into Supabase SQL editor)
"""

import sys
from datetime import timedelta
from decimal import Decimal

from sqlalchemy import func, select

from app import models
from app.db import SessionLocal
from app.logic import compute_end_date, now_utc, today_ist

PLANS = [
    ("Monthly", 1, "months", Decimal("3000")),
]

# name, phone, room, start offset (days from today), payment mode, note
MEMBERS = [
    ("Ravi Kumar", "9876543210", "Room 101", -2, "upi", None),  # active, paid this month
    ("Priya Sharma", "9123456780", "Room 204", -28, "cash", "Veg only"),  # expiring in ~2 days
    ("Arjun Reddy", "9988776655", None, -29, "upi", None),  # expiring ~today
    ("Sneha Patil", "9012345678", "Flat 3B, MG Road", -40, "cash", None),  # expired ~10 days ago
    ("Mohammed Irfan", "9090909090", "Room 110", -36, "upi", "Pays on the 1st"),  # expired ~6 days ago
]


def build():
    today = today_ist()
    plans = [models.Plan(name=n, duration_value=v, duration_unit=u, price=p, is_active=True) for n, v, u, p in PLANS]
    members = []
    plan = plans[0]
    for name, phone, room, offset, mode, note in MEMBERS:
        start = today + timedelta(days=offset)
        m = models.Member(name=name, phone="+91" + phone, room_or_address=room, notes=note, created_at=now_utc())
        m.subscriptions.append(
            models.Subscription(
                plan=plan,
                start_date=start,
                end_date=compute_end_date(start, plan.duration_value, plan.duration_unit),
                amount_paid=plan.price,
                payment_mode=mode,
                paid_on=start,
                created_at=now_utc(),
            )
        )
        members.append(m)
    return plans, members


def sql_literal(v) -> str:
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, Decimal)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def print_sql():
    plans, members = build()
    print("BEGIN;")
    print("INSERT INTO settings (mess_name, expiring_window_days, expiring_template, expired_template)")
    print(
        f"SELECT 'My Mess', 3, {sql_literal(models.DEFAULT_EXPIRING_TEMPLATE)}, "
        f"{sql_literal(models.DEFAULT_EXPIRED_TEMPLATE)} WHERE NOT EXISTS (SELECT 1 FROM settings);"
    )
    for p in plans:
        print(
            "INSERT INTO plans (name, duration_value, duration_unit, price, is_active) VALUES "
            f"({sql_literal(p.name)}, {p.duration_value}, {sql_literal(p.duration_unit)}, {p.price}, true);"
        )
    for m in members:
        s = m.subscriptions[0]
        print(
            "WITH m AS (INSERT INTO members (name, phone, room_or_address, notes) VALUES "
            f"({sql_literal(m.name)}, {sql_literal(m.phone)}, {sql_literal(m.room_or_address)}, "
            f"{sql_literal(m.notes)}) RETURNING id)\n"
            "INSERT INTO subscriptions (member_id, plan_id, start_date, end_date, amount_paid, payment_mode, paid_on) "
            f"SELECT m.id, (SELECT id FROM plans WHERE name = {sql_literal(s.plan.name)} ORDER BY id DESC LIMIT 1), "
            f"{sql_literal(s.start_date.isoformat())}, {sql_literal(s.end_date.isoformat())}, {s.amount_paid}, "
            f"{sql_literal(s.payment_mode)}, {sql_literal(s.paid_on.isoformat())} FROM m;"
        )
    print("COMMIT;")


def main():
    if "--sql" in sys.argv:
        print_sql()
        return
    with SessionLocal() as db:
        if db.scalar(select(func.count(models.Member.id))) and "--force" not in sys.argv:
            print("Members already exist — skipping. Use --force to add sample data anyway.")
            return
        plans, members = build()
        db.add_all(plans + members)
        db.commit()
        print(f"Added {len(plans)} plans and {len(members)} members.")


if __name__ == "__main__":
    main()
