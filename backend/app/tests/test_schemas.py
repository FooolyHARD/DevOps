import pytest
from pydantic import ValidationError

from app.schemas.auth import UserRead, UserRegister
from app.schemas.reference import EnumOption
from app.schemas.scenario import ScenarioCreate
from app.schemas.toxin import ToxinTypeCreate, ToxinTypeRead


def test_user_register_validation():
    with pytest.raises(ValidationError):
        UserRegister(username="ab", email="user@example.com", password="short")


def test_user_read_from_attributes():
    class Dummy:
        id = 1
        username = "user"
        email = "user@example.com"
        is_admin = False
        is_active = True

    result = UserRead.model_validate(Dummy())
    assert result.username == "user"


def test_enum_option_schema():
    option = EnumOption(value="low", label="Низкий")
    assert option.value == "low"


def test_scenario_create_defaults():
    payload = ScenarioCreate(
        title="Тестовый сценарий",
        toxin_type_id=1,
        organism_type="jellyfish",
        damage_category="local",
        contact_area_cm2=1,
        contact_duration_min=1,
        victim_age=18,
        has_allergy=False,
        body_location="arm",
    )
    assert payload.exposure_level == 1


def test_toxin_schema_from_attributes():
    class Dummy:
        id = 1
        name = "Тест"
        description = ""
        organism_type = "jellyfish"
        neurotoxicity = 1
        cytotoxicity = 1
        pain_intensity = 1
        systemic_factor = 1
        created_at = "2024-01-01T00:00:00"
        updated_at = "2024-01-01T00:00:00"

    result = ToxinTypeRead.model_validate(Dummy())
    assert result.name == "Тест"


def test_toxin_create_validation():
    with pytest.raises(ValidationError):
        ToxinTypeCreate(
            name="ab",
            organism_type="jellyfish",
            neurotoxicity=0,
            cytotoxicity=1,
            pain_intensity=1,
            systemic_factor=1,
        )
