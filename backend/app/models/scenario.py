from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class OrganismType(StrEnum):
    JELLYFISH = "jellyfish"
    VENOMOUS_FISH = "venomous_fish"


class DamageCategory(StrEnum):
    LOCAL = "local"
    DEEP_TISSUE = "deep_tissue"
    SYSTEMIC = "systemic"
    ANAPHYLACTIC = "anaphylactic"


class BodyLocation(StrEnum):
    HEAD = "head"
    NECK = "neck"
    CHEST = "chest"
    ARM = "arm"
    HAND = "hand"
    ABDOMEN = "abdomen"
    LEG = "leg"
    FOOT = "foot"
    BACK = "back"


class RiskLevel(StrEnum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class ToxinType(Base):
    __tablename__ = "toxin_types"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    organism_type: Mapped[OrganismType] = mapped_column(SqlEnum(OrganismType))
    neurotoxicity: Mapped[int] = mapped_column(Integer, default=1)
    cytotoxicity: Mapped[int] = mapped_column(Integer, default=1)
    pain_intensity: Mapped[int] = mapped_column(Integer, default=1)
    systemic_factor: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    scenarios: Mapped[list[Scenario]] = relationship(back_populates="toxin_type")


class Scenario(Base):
    __tablename__ = "scenarios"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    toxin_type_id: Mapped[int] = mapped_column(ForeignKey("toxin_types.id"))
    title: Mapped[str] = mapped_column(String(150))
    organism_type: Mapped[OrganismType] = mapped_column(SqlEnum(OrganismType))
    exposure_level: Mapped[int] = mapped_column(Integer, default=1)
    damage_category: Mapped[DamageCategory] = mapped_column(SqlEnum(DamageCategory))
    contact_area_cm2: Mapped[float] = mapped_column(Float)
    contact_duration_min: Mapped[int] = mapped_column(Integer)
    victim_age: Mapped[int] = mapped_column(Integer)
    has_allergy: Mapped[bool] = mapped_column(Boolean, default=False)
    body_location: Mapped[BodyLocation] = mapped_column(SqlEnum(BodyLocation))
    notes: Mapped[str] = mapped_column(Text, default="")
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    risk_level: Mapped[RiskLevel] = mapped_column(SqlEnum(RiskLevel), default=RiskLevel.LOW)
    risk_summary: Mapped[str] = mapped_column(Text, default="")
    recommendations: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User")
    toxin_type: Mapped[ToxinType] = relationship(back_populates="scenarios")

    @property
    def toxin_type_name(self) -> str | None:
        if self.toxin_type is None:
            return None
        return self.toxin_type.name
