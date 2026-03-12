from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_admin_user
from app.db.session import get_db
from app.models.scenario import ToxinType
from app.schemas.toxin import ToxinTypeCreate, ToxinTypeRead, ToxinTypeUpdate

router = APIRouter(prefix="/admin/toxins", tags=["admin"])


@router.get("", response_model=list[ToxinTypeRead])
def list_toxins(_: object = Depends(get_admin_user), db: Session = Depends(get_db)):
    return db.scalars(select(ToxinType).order_by(ToxinType.name)).all()


@router.post("", response_model=ToxinTypeRead, status_code=status.HTTP_201_CREATED)
def create_toxin(payload: ToxinTypeCreate, _: object = Depends(get_admin_user), db: Session = Depends(get_db)):
    existing = db.scalar(select(ToxinType).where(ToxinType.name == payload.name))
    if existing:
        raise HTTPException(status_code=400, detail="Такой тип токсина уже существует")
    toxin = ToxinType(**payload.model_dump())
    db.add(toxin)
    db.commit()
    db.refresh(toxin)
    return toxin


@router.put("/{toxin_id}", response_model=ToxinTypeRead)
def update_toxin(
    toxin_id: int,
    payload: ToxinTypeUpdate,
    _: object = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    toxin = db.get(ToxinType, toxin_id)
    if not toxin:
        raise HTTPException(status_code=404, detail="Тип токсина не найден")
    for field, value in payload.model_dump().items():
        setattr(toxin, field, value)
    db.commit()
    db.refresh(toxin)
    return toxin


@router.delete("/{toxin_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_toxin(toxin_id: int, _: object = Depends(get_admin_user), db: Session = Depends(get_db)):
    toxin = db.get(ToxinType, toxin_id)
    if not toxin:
        raise HTTPException(status_code=404, detail="Тип токсина не найден")
    db.delete(toxin)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
