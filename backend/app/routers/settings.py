from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..schemas import SettingsIn, SettingsOut
from ..services import get_settings

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=SettingsOut)
def read_settings(db: Session = Depends(get_db)):
    return get_settings(db)


@router.put("", response_model=SettingsOut)
def update_settings(data: SettingsIn, db: Session = Depends(get_db)):
    row = get_settings(db)
    for key, value in data.model_dump().items():
        setattr(row, key, value)
    db.commit()
    return row
