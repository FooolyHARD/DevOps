from fastapi import APIRouter

from app.models.scenario import BodyLocation, DamageCategory, OrganismType, RiskLevel
from app.schemas.reference import EnumOption

router = APIRouter(prefix="/reference", tags=["reference"])


RUS_LABELS = {
    OrganismType.JELLYFISH: "Медуза",
    OrganismType.VENOMOUS_FISH: "Ядовитая рыба",
    DamageCategory.LOCAL: "Локальное",
    DamageCategory.DEEP_TISSUE: "Глубокое тканевое",
    DamageCategory.SYSTEMIC: "Системное",
    DamageCategory.ANAPHYLACTIC: "Анафилактическое",
    BodyLocation.HEAD: "Голова",
    BodyLocation.NECK: "Шея",
    BodyLocation.CHEST: "Грудь",
    BodyLocation.ARM: "Рука",
    BodyLocation.HAND: "Кисть",
    BodyLocation.ABDOMEN: "Живот",
    BodyLocation.LEG: "Нога",
    BodyLocation.FOOT: "Стопа",
    BodyLocation.BACK: "Спина",
    RiskLevel.LOW: "Низкий",
    RiskLevel.MODERATE: "Средний",
    RiskLevel.HIGH: "Высокий",
    RiskLevel.CRITICAL: "Критический",
}


def serialize_enum(enum_cls) -> list[EnumOption]:
    return [EnumOption(value=item.value, label=RUS_LABELS[item]) for item in enum_cls]


@router.get("/organisms", response_model=list[EnumOption])
def get_organisms():
    return serialize_enum(OrganismType)


@router.get("/damage-categories", response_model=list[EnumOption])
def get_damage_categories():
    return serialize_enum(DamageCategory)


@router.get("/body-locations", response_model=list[EnumOption])
def get_body_locations():
    return serialize_enum(BodyLocation)


@router.get("/risk-levels", response_model=list[EnumOption])
def get_risk_levels():
    return serialize_enum(RiskLevel)
