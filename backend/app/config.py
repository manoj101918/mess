import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")

TIMEZONE = "Asia/Kolkata"
STATIC_DIR = BACKEND_DIR / "static"


def get_database_url() -> str:
    """Return a SQLAlchemy URL. Postgres when DATABASE_URL is set, else local SQLite."""
    url = os.getenv("DATABASE_URL", "").strip()
    if not url:
        return f"sqlite:///{(BACKEND_DIR / 'mess.db').as_posix()}"
    # Hosted providers hand out postgres:// or postgresql:// — use the psycopg 3 driver.
    if url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url[len("postgres://"):]
    elif url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    if url.startswith("postgresql") and "sslmode=" not in url:
        url += ("&" if "?" in url else "?") + "sslmode=require"
    return url


DATABASE_URL = get_database_url()
