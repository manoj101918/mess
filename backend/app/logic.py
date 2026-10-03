"""Pure business rules: dates, status, reminders. No database access here."""

from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from urllib.parse import quote
from zoneinfo import ZoneInfo

from dateutil.relativedelta import relativedelta

from .config import TIMEZONE

IST = ZoneInfo(TIMEZONE)


def now_ist() -> datetime:
    return datetime.now(IST)


def now_utc() -> datetime:
    """Timestamps are stored in UTC (SQLite drops the offset, so keep it uniform)."""
    return now_ist().astimezone(timezone.utc)


def today_ist() -> date:
    return now_ist().date()


def compute_end_date(start: date, duration_value: int, duration_unit: str) -> date:
    """Inclusive last day of a plan. 05 Oct + 1 month → 04 Nov; 05 Oct + 15 days → 19 Oct."""
    if duration_value < 1:
        raise ValueError("Duration must be at least 1")
    if duration_unit == "months":
        return start + relativedelta(months=duration_value) - timedelta(days=1)
    if duration_unit == "days":
        return start + timedelta(days=duration_value - 1)
    raise ValueError(f"Unknown duration unit: {duration_unit}")


@dataclass(frozen=True)
class StatusInfo:
    status: str  # "active" | "expiring" | "expired"
    days_left: int  # negative when expired (days overdue = -days_left)

    @property
    def days_overdue(self) -> int:
        return max(0, -self.days_left)


def compute_status(end_date: date, today: date, expiring_window_days: int) -> StatusInfo:
    days_left = (end_date - today).days
    if days_left < 0:
        return StatusInfo("expired", days_left)
    if days_left <= expiring_window_days:
        return StatusInfo("expiring", days_left)
    return StatusInfo("active", days_left)


def renewal_start(current_end: date | None, today: date) -> date:
    """New plan starts the day after the current one ends, or today if it already lapsed."""
    if current_end is None:
        return today
    return max(current_end + timedelta(days=1), today)


def format_date(d: date) -> str:
    return d.strftime("%d %b %Y")


def format_amount(amount: Decimal | float | int) -> str:
    value = Decimal(str(amount))
    if value == value.to_integral_value():
        return f"{int(value):,}"
    return f"{value:,.2f}"


def fill_template(template: str, *, name: str, end_date: date, plan: str, amount, mess_name: str) -> str:
    values = {
        "name": name,
        "end_date": format_date(end_date),
        "plan": plan,
        "amount": format_amount(amount),
        "mess_name": mess_name,
    }
    out = template
    for key, val in values.items():  # plain replace so stray braces never crash
        out = out.replace("{" + key + "}", val)
    return out


def whatsapp_link(phone: str, message: str) -> str:
    digits = "".join(ch for ch in phone if ch.isdigit())
    if len(digits) == 10:
        digits = "91" + digits
    return f"https://wa.me/{digits}?text={quote(message, safe='')}"


def normalize_phone(raw: str) -> str:
    """Accepts '98765 43210', '+91-9876543210', '09876543210'… returns '+919876543210'."""
    digits = "".join(ch for ch in raw if ch.isdigit())
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    if len(digits) != 10 or digits[0] not in "6789":
        raise ValueError("Phone number must be a 10-digit Indian mobile number")
    return "+91" + digits
