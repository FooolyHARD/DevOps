from datetime import datetime

from pydantic import BaseModel, Field


class ScenarioBase(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    toxin_type_id: int
    organism_type: str
    exposure_level: int = Field(ge=1, le=5)
    damage_category: str
    contact_area_cm2: float = Field(gt=0, le=2000)
    contact_duration_min: int = Field(ge=1, le=1440)
    victim_age: int = Field(ge=1, le=120)
    has_allergy: bool = False
    body_location: str
    notes: str = ""


class ScenarioCreate(ScenarioBase):
    pass


class ScenarioUpdate(ScenarioBase):
    pass


class RiskAssessmentRequest(ScenarioBase):
    pass


class RiskAssessmentResponse(BaseModel):
    risk_score: float
    risk_level: str
    summary: str
    recommendations: str
    factor_breakdown: dict[str, float]


class ScenarioRead(ScenarioBase):
    id: int
    risk_score: float
    risk_level: str
    risk_summary: str
    recommendations: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
