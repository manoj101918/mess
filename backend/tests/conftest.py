from datetime import date, datetime, time

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

from app import logic
from app.db import Base, get_db, make_engine
from app.main import app

TODAY = date(2026, 10, 10)


@pytest.fixture
def client(tmp_path, monkeypatch):
    engine = make_engine(f"sqlite:///{(tmp_path / 'test.db').as_posix()}")
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    def override_db():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()

    # Freeze the clock: every "now"/"today" in the app goes through logic.now_ist.
    monkeypatch.setattr(logic, "now_ist", lambda: datetime.combine(TODAY, time(12, 0), tzinfo=logic.IST))

    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    engine.dispose()


@pytest.fixture
def plan(client):
    r = client.post(
        "/api/plans", json={"name": "Monthly - Full", "duration_value": 1, "duration_unit": "months", "price": 3000}
    )
    assert r.status_code == 201, r.text
    return r.json()
