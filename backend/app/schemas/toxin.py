from datetime import datetime

from pydantic import BaseModel, Field


class ToxinTypeBase(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    description: str = ""
    organism_type: str
    neurotoxicity: int = Field(ge=1, le=10)
    cytotoxicity: int = Field(ge=1, le=10)
    pain_intensity: int = Field(ge=1, le=10)
    systemic_factor: int = Field(ge=1, le=10)


class ToxinTypeCreate(ToxinTypeBase):
    pass


class ToxinTypeUpdate(ToxinTypeBase):
    pass


class ToxinTypeRead(ToxinTypeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
