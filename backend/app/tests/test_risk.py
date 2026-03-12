from types import SimpleNamespace

from app.models.scenario import BodyLocation, DamageCategory, OrganismType
from app.services.risk import calculate_risk


def test_high_risk_with_allergy_and_head_contact():
    payload = SimpleNamespace(
        organism_type=OrganismType.VENOMOUS_FISH,
        exposure_level=5,
        damage_category=DamageCategory.ANAPHYLACTIC,
        contact_area_cm2=150,
        contact_duration_min=45,
        victim_age=70,
        has_allergy=True,
        body_location=BodyLocation.HEAD,
    )
    toxin = SimpleNamespace(
        name="Тестовый токсин",
        neurotoxicity=9,
        cytotoxicity=8,
        pain_intensity=10,
        systemic_factor=9,
    )

    result = calculate_risk(payload, toxin)

    assert result.risk_score >= 85
    assert result.risk_level.value == "critical"
