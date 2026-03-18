from dataclasses import dataclass
from math import log1p

from app.models.scenario import BodyLocation, DamageCategory, OrganismType, RiskLevel


@dataclass
class RiskResult:
    risk_score: float
    risk_level: RiskLevel
    summary: str
    recommendations: str
    factor_breakdown: dict[str, float]


ORGANISM_MULTIPLIER = {
    OrganismType.JELLYFISH: 1.08,
    OrganismType.VENOMOUS_FISH: 1.18,
}

DAMAGE_MULTIPLIER = {
    DamageCategory.LOCAL: 1.0,
    DamageCategory.DEEP_TISSUE: 1.22,
    DamageCategory.SYSTEMIC: 1.45,
    DamageCategory.ANAPHYLACTIC: 1.9,
}

BODY_MULTIPLIER = {
    BodyLocation.HEAD: 1.35,
    BodyLocation.NECK: 1.32,
    BodyLocation.CHEST: 1.18,
    BodyLocation.ARM: 1.0,
    BodyLocation.HAND: 1.08,
    BodyLocation.ABDOMEN: 1.1,
    BodyLocation.LEG: 1.02,
    BodyLocation.FOOT: 1.07,
    BodyLocation.BACK: 0.95,
}

TOXIN_WEIGHTS = {
    "neurotoxicity": 1.2,
    "cytotoxicity": 1.0,
    "pain_intensity": 0.8,
    "systemic_factor": 1.0,
}

EXPOSURE_WEIGHT = 2.0
AREA_WEIGHT = 2.5
DURATION_WEIGHT = 2.0
ORGANISM_FACTOR = 0.7
DAMAGE_FACTOR = 0.7
LOCATION_FACTOR = 0.5


def _risk_level(score: float) -> RiskLevel:
    if score < 35:
        return RiskLevel.LOW
    if score < 60:
        return RiskLevel.MODERATE
    if score < 85:
        return RiskLevel.HIGH
    return RiskLevel.CRITICAL


def calculate_risk(payload, toxin_type) -> RiskResult:
    toxin_component = (
        toxin_type.neurotoxicity * TOXIN_WEIGHTS["neurotoxicity"]
        + toxin_type.cytotoxicity * TOXIN_WEIGHTS["cytotoxicity"]
        + toxin_type.pain_intensity * TOXIN_WEIGHTS["pain_intensity"]
        + toxin_type.systemic_factor * TOXIN_WEIGHTS["systemic_factor"]
    )
    exposure_component = payload.exposure_level**1.4 * EXPOSURE_WEIGHT
    area_component = log1p(payload.contact_area_cm2) * AREA_WEIGHT
    duration_component = log1p(payload.contact_duration_min) * DURATION_WEIGHT
    age_component = 10 if payload.victim_age <= 12 else 7 if payload.victim_age >= 65 else 0
    allergy_component = 12 if payload.has_allergy else 0
    organism_component = toxin_component * (ORGANISM_MULTIPLIER[payload.organism_type] - 1) * ORGANISM_FACTOR
    damage_component = toxin_component * (DAMAGE_MULTIPLIER[payload.damage_category] - 1) * DAMAGE_FACTOR
    location_component = toxin_component * (BODY_MULTIPLIER[payload.body_location] - 1) * LOCATION_FACTOR

    raw_score = (
        toxin_component
        + exposure_component
        + area_component
        + duration_component
        + age_component
        + allergy_component
        + organism_component
        + damage_component
        + location_component
    )
    score = round(min(raw_score, 100), 2)
    level = _risk_level(score)

    summary = (
        f"Интегральный риск {score} баллов. "
        f"Ключевые факторы: токсин '{toxin_type.name}', зона '{payload.body_location}', "
        f"категория поражения '{payload.damage_category}'."
    )
    recommendations = {
        RiskLevel.LOW: "Наблюдение, обработка пораженного участка, базовая симптоматическая помощь.",
        RiskLevel.MODERATE: "Нужна очная консультация, контроль боли и наблюдение за системными симптомами.",
        RiskLevel.HIGH: "Требуется срочная медицинская помощь и расширенный мониторинг состояния.",
        RiskLevel.CRITICAL: "Немедленная экстренная помощь, высокий риск системных осложнений.",
    }[level]

    return RiskResult(
        risk_score=score,
        risk_level=level,
        summary=summary,
        recommendations=recommendations,
        factor_breakdown={
            "toxin_component": round(toxin_component, 2),
            "exposure_component": round(exposure_component, 2),
            "area_component": round(area_component, 2),
            "duration_component": round(duration_component, 2),
            "age_component": round(age_component, 2),
            "allergy_component": round(allergy_component, 2),
            "organism_component": round(organism_component, 2),
            "damage_component": round(damage_component, 2),
            "location_component": round(location_component, 2),
        },
    )
