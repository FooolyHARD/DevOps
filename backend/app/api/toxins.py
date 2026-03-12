from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.scenario import ToxinType
from app.schemas.toxin import ToxinTypeRead

router = APIRouter(prefix="/toxins", tags=["toxins"])


@router.get("", response_model=list[ToxinTypeRead])
def list_toxins(_: object = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(select(ToxinType).order_by(ToxinType.name)).all()
