from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.scenario import Scenario, ToxinType
from app.models.user import User
from app.schemas.scenario import (
    RiskAssessmentRequest,
    RiskAssessmentResponse,
    ScenarioCreate,
    ScenarioRead,
    ScenarioUpdate,
)
from app.services.risk import calculate_risk

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


def _get_toxin_or_404(db: Session, toxin_type_id: int) -> ToxinType:
    toxin = db.get(ToxinType, toxin_type_id)
    if not toxin:
        raise HTTPException(status_code=404, detail="Тип токсина не найден")
    return toxin


def _validate_toxin_match(payload, toxin: ToxinType) -> None:
    if toxin.organism_type != payload.organism_type:
        raise HTTPException(
            status_code=400,
            detail="Тип токсина не соответствует выбранному морскому организму",
        )


def _ensure_ownership(scenario: Scenario | None, current_user: User) -> Scenario:
    if not scenario or scenario.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Сценарий не найден")
    return scenario


@router.post("/calculate", response_model=RiskAssessmentResponse)
def calculate(payload: RiskAssessmentRequest, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    toxin = _get_toxin_or_404(db, payload.toxin_type_id)
    _validate_toxin_match(payload, toxin)
    result = calculate_risk(payload, toxin)
    return RiskAssessmentResponse(
        risk_score=result.risk_score,
        risk_level=result.risk_level.value,
        summary=result.summary,
        recommendations=result.recommendations,
        factor_breakdown=result.factor_breakdown,
    )


@router.get("", response_model=list[ScenarioRead])
def list_scenarios(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = (
        select(Scenario)
        .where(Scenario.user_id == current_user.id)
        .options(selectinload(Scenario.toxin_type))
        .order_by(Scenario.updated_at.desc())
    )
    return db.scalars(query).all()


@router.get("/{scenario_id}", response_model=ScenarioRead)
def get_scenario(scenario_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scenario = _ensure_ownership(db.get(Scenario, scenario_id), current_user)
    return scenario


@router.post("", response_model=ScenarioRead, status_code=status.HTTP_201_CREATED)
def create_scenario(payload: ScenarioCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    toxin = _get_toxin_or_404(db, payload.toxin_type_id)
    _validate_toxin_match(payload, toxin)
    result = calculate_risk(payload, toxin)
    scenario = Scenario(
        **payload.model_dump(),
        user_id=current_user.id,
        risk_score=result.risk_score,
        risk_level=result.risk_level,
        risk_summary=result.summary,
        recommendations=result.recommendations,
    )
    db.add(scenario)
    db.commit()
    db.refresh(scenario)
    return scenario


@router.put("/{scenario_id}", response_model=ScenarioRead)
def update_scenario(
    scenario_id: int,
    payload: ScenarioUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    scenario = _ensure_ownership(db.get(Scenario, scenario_id), current_user)
    toxin = _get_toxin_or_404(db, payload.toxin_type_id)
    _validate_toxin_match(payload, toxin)
    result = calculate_risk(payload, toxin)
    for field, value in payload.model_dump().items():
        setattr(scenario, field, value)
    scenario.risk_score = result.risk_score
    scenario.risk_level = result.risk_level
    scenario.risk_summary = result.summary
    scenario.recommendations = result.recommendations
    db.commit()
    db.refresh(scenario)
    return scenario


@router.post("/{scenario_id}/recalculate", response_model=ScenarioRead)
def recalculate_scenario(
    scenario_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    scenario = _ensure_ownership(db.get(Scenario, scenario_id), current_user)
    toxin = _get_toxin_or_404(db, scenario.toxin_type_id)
    result = calculate_risk(scenario, toxin)
    scenario.risk_score = result.risk_score
    scenario.risk_level = result.risk_level
    scenario.risk_summary = result.summary
    scenario.recommendations = result.recommendations
    db.commit()
    db.refresh(scenario)
    return scenario


@router.delete("/{scenario_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_scenario(
    scenario_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    scenario = _ensure_ownership(db.get(Scenario, scenario_id), current_user)
    db.delete(scenario)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
