from datetime import date

import pytest

from app.logic import (
    compute_end_date,
    compute_status,
    fill_template,
    normalize_phone,
    renewal_start,
    whatsapp_link,
)


@pytest.mark.parametrize(
    "start, value, unit, expected",
    [
        (date(2026, 10, 5), 1, "months", date(2026, 11, 4)),
        (date(2026, 10, 5), 15, "days", date(2026, 10, 19)),
        (date(2026, 10, 1), 1, "months", date(2026, 10, 31)),
        (date(2026, 12, 15), 1, "months", date(2027, 1, 14)),  # year rollover
        (date(2026, 1, 31), 1, "months", date(2026, 2, 27)),  # clamps to 28 Feb, minus a day
        (date(2028, 1, 31), 1, "months", date(2028, 2, 28)),  # leap year
        (date(2026, 10, 5), 3, "months", date(2027, 1, 4)),
        (date(2026, 10, 5), 1, "days", date(2026, 10, 5)),  # single day plan
        (date(2026, 2, 20), 15, "days", date(2026, 3, 6)),
    ],
)
def test_compute_end_date(start, value, unit, expected):
    assert compute_end_date(start, value, unit) == expected


def test_compute_end_date_rejects_bad_input():
    with pytest.raises(ValueError):
        compute_end_date(date(2026, 1, 1), 0, "days")
    with pytest.raises(ValueError):
        compute_end_date(date(2026, 1, 1), 1, "weeks")


TODAY = date(2026, 10, 10)


@pytest.mark.parametrize(
    "end, status, days_left",
    [
        (date(2026, 10, 30), "active", 20),
        (date(2026, 10, 14), "active", 4),  # just outside window
        (date(2026, 10, 13), "expiring", 3),  # edge of window
        (date(2026, 10, 10), "expiring", 0),  # last day is today — still valid
        (date(2026, 10, 9), "expired", -1),
        (date(2026, 9, 10), "expired", -30),
    ],
)
def test_compute_status(end, status, days_left):
    info = compute_status(end, TODAY, 3)
    assert info.status == status
    assert info.days_left == days_left
    assert info.days_overdue == max(0, -days_left)


def test_status_window_zero():
    assert compute_status(TODAY, TODAY, 0).status == "expiring"
    assert compute_status(date(2026, 10, 11), TODAY, 0).status == "active"


def test_renewal_start():
    assert renewal_start(date(2026, 10, 20), TODAY) == date(2026, 10, 21)  # still active
    assert renewal_start(date(2026, 10, 10), TODAY) == date(2026, 10, 11)  # ends today
    assert renewal_start(date(2026, 10, 9), TODAY) == TODAY  # ended yesterday
    assert renewal_start(date(2026, 8, 1), TODAY) == TODAY  # long expired
    assert renewal_start(None, TODAY) == TODAY


@pytest.mark.parametrize("raw", ["9876543210", "98765 43210", "+91 98765-43210", "919876543210", "09876543210"])
def test_normalize_phone(raw):
    assert normalize_phone(raw) == "+919876543210"


@pytest.mark.parametrize("raw", ["12345", "1234567890", "98765432101", "", "abcdefghij"])
def test_normalize_phone_invalid(raw):
    with pytest.raises(ValueError):
        normalize_phone(raw)


def test_fill_template_and_link():
    msg = fill_template(
        "Hi {name}, your {plan} plan at {mess_name} ends on {end_date}. Amount: ₹{amount}.",
        name="Ravi",
        end_date=date(2026, 10, 5),
        plan="Monthly - Full",
        amount=3000,
        mess_name="Annapurna Mess",
    )
    assert msg == "Hi Ravi, your Monthly - Full plan at Annapurna Mess ends on 05 Oct 2026. Amount: ₹3,000."
    link = whatsapp_link("+919876543210", "Hi Ravi & co")
    assert link == "https://wa.me/919876543210?text=Hi%20Ravi%20%26%20co"


def test_fill_template_ignores_unknown_braces():
    assert fill_template("{oops} {name}", name="A", end_date=TODAY, plan="P", amount=1, mess_name="M") == "{oops} A"
