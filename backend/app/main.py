from fastapi import APIRouter, Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from .config import STATIC_DIR
from .db import get_db
from .routers import backup, dashboard, members, plans, settings

app = FastAPI(title="Mess Manager", docs_url="/api/docs", openapi_url="/api/openapi.json")

FIELD_LABELS = {
    "name": "Name",
    "phone": "Phone",
    "room_or_address": "Room / address",
    "plan_id": "Plan",
    "start_date": "Start date",
    "end_date": "End date",
    "amount_paid": "Amount",
    "price": "Price",
    "payment_mode": "Payment mode",
    "duration_value": "Duration",
    "duration_unit": "Duration unit",
    "mess_name": "Mess name",
    "expiring_window_days": "Reminder window",
    "expiring_template": "Expiring message",
    "expired_template": "Expired message",
}


@app.exception_handler(RequestValidationError)
async def friendly_validation_error(_: Request, exc: RequestValidationError):
    """Turn Pydantic's error list into one sentence the owner can understand."""
    messages = []
    for err in exc.errors():
        field = next((str(p) for p in reversed(err.get("loc", ())) if isinstance(p, str) and p != "body"), "")
        msg = err.get("msg", "Invalid value").removeprefix("Value error, ")
        if err.get("type") == "missing":
            msg = "is required"
        elif err.get("type") == "greater_than_equal":
            msg = "cannot be negative" if err.get("ctx", {}).get("ge") == 0 else msg
        label = FIELD_LABELS.get(field, "")
        if label and not msg[:1].isupper():
            messages.append(f"{label} {msg}")
        elif label and err.get("type") not in ("value_error",):
            messages.append(f"{label}: {msg}")
        else:
            messages.append(msg)
    return JSONResponse(status_code=422, content={"detail": ". ".join(dict.fromkeys(messages))})


api = APIRouter(prefix="/api")


@api.get("/health")
def health():
    return {"ok": True}


@api.api_route("/keepalive", methods=["GET", "HEAD"])
def keepalive(db: Session = Depends(get_db)):
    """Hit by an uptime pinger every few minutes: keeps the free web host awake and
    runs a real query so the free Supabase project never counts as inactive."""
    db.execute(text("SELECT count(*) FROM settings"))
    return {"ok": True}


api.include_router(dashboard.router)
api.include_router(plans.router)
api.include_router(members.router)
api.include_router(settings.router)
api.include_router(backup.router)
app.include_router(api)


# ---- Serve the built React app (copied into backend/static) ----
if STATIC_DIR.exists():

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str):
        if full_path.startswith("api/"):
            return JSONResponse({"detail": "Not found"}, status_code=404)
        candidate = (STATIC_DIR / full_path).resolve()
        if full_path and candidate.is_file() and STATIC_DIR.resolve() in candidate.parents:
            headers = {}
            if full_path in ("sw.js", "index.html") or full_path.startswith("workbox-"):
                headers["Cache-Control"] = "no-cache"
            return FileResponse(candidate, headers=headers)
        return FileResponse(STATIC_DIR / "index.html", headers={"Cache-Control": "no-cache"})
