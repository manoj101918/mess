def add_member(client, plan_id, **overrides):
    body = {"name": "Ravi Kumar", "phone": "98765 43210", "plan_id": plan_id, "payment_mode": "upi"}
    body.update(overrides)
    return client.post("/api/members", json=body)


def test_preview_end_date(client, plan):
    r = client.get("/api/plans/preview-end-date", params={"plan_id": plan["id"], "start_date": "2026-10-05"})
    assert r.json() == {"start_date": "2026-10-05", "end_date": "2026-11-04"}
    r = client.get("/api/plans/preview-end-date", params={"plan_id": 999})
    assert r.status_code == 404


def test_create_member_defaults(client, plan):
    r = add_member(client, plan["id"])
    assert r.status_code == 201, r.text
    m = r.json()
    assert m["phone"] == "+919876543210"
    assert m["start_date"] == "2026-10-10"  # frozen today
    assert m["end_date"] == "2026-11-09"
    assert m["status"] == "active"
    assert m["subscriptions"][0]["amount_paid"] == 3000
    assert m["subscriptions"][0]["paid_on"] == "2026-10-10"


def test_create_member_validation(client, plan):
    r = add_member(client, plan["id"], phone="12345")
    assert r.status_code == 422
    assert "10-digit" in r.json()["detail"]
    r = add_member(client, plan["id"], amount_paid=-5)
    assert r.status_code == 422
    assert "Amount cannot be negative" in r.json()["detail"]
    r = add_member(client, plan["id"], start_date="2026-10-10", end_date="2026-10-01")
    assert r.status_code == 422
    assert "End date cannot be before start date" in r.json()["detail"]
    r = add_member(client, plan["id"], name="  ")
    assert r.status_code == 422


def test_manual_end_date_override(client, plan):
    r = add_member(client, plan["id"], start_date="2026-10-01", end_date="2026-10-12")
    assert r.json()["end_date"] == "2026-10-12"
    assert r.json()["status"] == "expiring"


def test_list_search_and_filter(client, plan):
    add_member(client, plan["id"], name="Asha", phone="9000000001")
    add_member(client, plan["id"], name="Bala", phone="9000000002", start_date="2026-09-01")  # ended 30 Sep
    add_member(client, plan["id"], name="Chitra", phone="9000000003", start_date="2026-09-12")  # ends 11 Oct
    names = lambda r: [m["name"] for m in r.json()]  # noqa: E731
    assert names(client.get("/api/members")) == ["Asha", "Bala", "Chitra"]
    assert names(client.get("/api/members", params={"status": "expired"})) == ["Bala"]
    assert names(client.get("/api/members", params={"status": "expiring"})) == ["Chitra"]
    assert names(client.get("/api/members", params={"search": "chi"})) == ["Chitra"]
    assert names(client.get("/api/members", params={"search": "0002"})) == ["Bala"]
    expired = client.get("/api/members", params={"status": "expired"}).json()[0]
    assert expired["days_overdue"] == 10


def test_renew_defaults(client, plan):
    m = add_member(client, plan["id"], start_date="2026-10-01").json()  # ends 31 Oct
    assert m["next_start_date"] == "2026-11-01"
    r = client.post(f"/api/members/{m['id']}/renew", json={"plan_id": plan["id"], "payment_mode": "cash"})
    assert r.status_code == 201, r.text
    d = r.json()
    assert d["start_date"] == "2026-11-01"
    assert d["end_date"] == "2026-11-30"
    assert len(d["subscriptions"]) == 2

    # Expired member renews from today.
    old = add_member(client, plan["id"], phone="9000000009", start_date="2026-08-01").json()
    assert old["status"] == "expired"
    d = client.post(f"/api/members/{old['id']}/renew", json={"plan_id": plan["id"]}).json()
    assert d["start_date"] == "2026-10-10"
    assert d["status"] == "active"


def test_update_and_delete(client, plan):
    m = add_member(client, plan["id"]).json()
    r = client.put(
        f"/api/members/{m['id']}", json={"name": "Ravi K", "phone": "+91 9123456789", "room_or_address": " 12 "}
    )
    assert r.json()["name"] == "Ravi K"
    assert r.json()["phone"] == "+919123456789"
    assert r.json()["room_or_address"] == "12"
    assert client.delete(f"/api/members/{m['id']}").status_code == 204
    assert client.get(f"/api/members/{m['id']}").status_code == 404


def test_inactive_plan_rejected(client, plan):
    client.put(f"/api/plans/{plan['id']}", json={**plan, "is_active": False})
    r = add_member(client, plan["id"])
    assert r.status_code == 422
    assert "turned off" in r.json()["detail"]


def test_reminder(client, plan):
    m = add_member(client, plan["id"], start_date="2026-09-12").json()  # ends 11 Oct
    assert m["reminded_today"] is False
    r = client.post(f"/api/members/{m['id']}/reminders")
    assert r.status_code == 201
    body = r.json()
    assert body["reminder"]["type"] == "expiring"
    assert "ends on 11 Oct 2026" in body["message"]
    assert "₹3,000" in body["message"]
    assert body["wa_link"].startswith("https://wa.me/919876543210?text=Hi%20Ravi")
    assert client.get(f"/api/members/{m['id']}").json()["reminded_today"] is True
    assert len(client.get(f"/api/members/{m['id']}").json()["reminders"]) == 1


def test_dashboard(client, plan):
    add_member(client, plan["id"], name="Active", phone="9000000001")  # paid today
    add_member(client, plan["id"], name="Soon", phone="9000000002", start_date="2026-09-12", paid_on="2026-09-12")
    add_member(client, plan["id"], name="Gone", phone="9000000003", start_date="2026-08-20", paid_on="2026-08-20")
    add_member(client, plan["id"], name="Long gone", phone="9000000004", start_date="2026-06-01", paid_on="2026-06-01")
    d = client.get("/api/dashboard").json()
    assert d["counts"] == {"active": 1, "expiring": 1, "expired": 2, "total": 4, "month_collection": 3000.0}
    assert [m["name"] for m in d["expiring"]] == ["Soon"]
    assert [m["name"] for m in d["expired"]] == ["Gone"]  # older than 30 days is left off the list
    assert d["expired"][0]["days_overdue"] == 21


def test_settings_roundtrip(client, plan):
    s = client.get("/api/settings").json()
    assert s["expiring_window_days"] == 3
    assert "{name}" in s["expiring_template"]
    s.update(mess_name="Annapurna Mess", expiring_window_days=5)
    assert client.put("/api/settings", json=s).json()["mess_name"] == "Annapurna Mess"
    bad = client.put("/api/settings", json={**s, "expiring_window_days": -1})
    assert bad.status_code == 422
    m = add_member(client, plan["id"], start_date="2026-09-12").json()
    msg = client.post(f"/api/members/{m['id']}/reminders").json()["message"]
    assert "Annapurna Mess" in msg


def test_backup(client, plan):
    from io import BytesIO

    from openpyxl import load_workbook

    m = add_member(client, plan["id"]).json()
    client.post(f"/api/members/{m['id']}/reminders")
    r = client.get("/api/backup")
    assert r.status_code == 200
    assert 'mess-backup-2026-10-10.xlsx' in r.headers["content-disposition"]
    wb = load_workbook(BytesIO(r.content))
    assert wb.sheetnames == ["Members", "Payments", "Plans", "Reminders", "Settings"]
    assert wb["Members"]["B2"].value == "Ravi Kumar"
    assert wb["Payments"].max_row == 2
    assert wb["Reminders"].max_row == 2


def test_keepalive(client):
    assert client.get("/api/keepalive").json() == {"ok": True}
    assert client.head("/api/keepalive").status_code == 200
