import pytest
from sqlalchemy.engine import make_url

from app.config import get_database_url

HOST = "aws-0-ap-south-1.pooler.supabase.com"


@pytest.mark.parametrize(
    "raw, password",
    [
        (f"postgresql://postgres.ref:plainpass@{HOST}:5432/postgres", "plainpass"),
        (f"postgresql://postgres.ref:abc@123@{HOST}:5432/postgres", "abc@123"),  # '@' pasted as-is
        (f"postgresql://postgres.ref:a@b@c:d@{HOST}:5432/postgres", "a@b@c:d"),
        (f"postgresql://postgres.ref:abc%40123@{HOST}:5432/postgres", "abc@123"),  # already encoded
        (f"postgres://postgres.ref:pw@{HOST}:5432/postgres", "pw"),
    ],
)
def test_database_url_parsing(monkeypatch, raw, password):
    monkeypatch.setenv("DATABASE_URL", raw)
    url = make_url(get_database_url())
    assert url.drivername == "postgresql+psycopg"
    assert url.host == HOST
    assert url.port == 5432
    assert url.username == "postgres.ref"
    assert url.password == password
    assert url.query["sslmode"] == "require"


def test_https_url_rejected(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "https://ref.supabase.co")
    with pytest.raises(SystemExit, match="Session pooler"):
        get_database_url()


def test_sqlite_fallback(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "")
    assert get_database_url().startswith("sqlite:///")
