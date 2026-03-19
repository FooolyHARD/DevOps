def register_user(client, username="user1", email="user1@example.com", password="password123"):
    response = client.post(
        "/api/v1/auth/register",
        json={"username": username, "email": email, "password": password},
    )
    assert response.status_code == 201
    return response.json()


def login_user(client, username="user1", password="password123"):
    response = client.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200
    return response.json()["access_token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_healthcheck(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_auth_register_login_me(client):
    register_user(client)
    token = login_user(client)

    response = client.get("/api/v1/auth/me", headers=auth_headers(token))
    assert response.status_code == 200
    assert response.json()["username"] == "user1"


def test_auth_duplicate_register(client):
    register_user(client)
    response = client.post(
        "/api/v1/auth/register",
        json={"username": "user1", "email": "user1@example.com", "password": "password123"},
    )
    assert response.status_code == 400


def test_auth_invalid_login(client):
    register_user(client)
    response = client.post("/api/v1/auth/login", json={"username": "user1", "password": "bad"})
    assert response.status_code == 400


def test_auth_me_requires_token(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_auth_me_invalid_token(client):
    response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer badtoken"})
    assert response.status_code == 401


def test_reference_endpoints(client):
    endpoints = [
        "/api/v1/reference/organisms",
        "/api/v1/reference/damage-categories",
        "/api/v1/reference/body-locations",
        "/api/v1/reference/risk-levels",
    ]
    for path in endpoints:
        response = client.get(path)
        assert response.status_code == 200
        payload = response.json()
        assert payload
        assert "value" in payload[0]
        assert "label" in payload[0]


def test_toxins_requires_auth(client):
    response = client.get("/api/v1/toxins")
    assert response.status_code == 401


def test_toxins_list(client):
    register_user(client)
    token = login_user(client)

    response = client.get("/api/v1/toxins", headers=auth_headers(token))
    assert response.status_code == 200
    assert len(response.json()) >= 1


def test_scenario_lifecycle(client):
    register_user(client)
    token = login_user(client)
    toxins = client.get("/api/v1/toxins", headers=auth_headers(token)).json()
    toxin_id = toxins[0]["id"]

    payload = {
        "title": "Тестовый сценарий",
        "toxin_type_id": toxin_id,
        "organism_type": toxins[0]["organism_type"],
        "damage_category": "local",
        "contact_area_cm2": 5,
        "contact_duration_min": 3,
        "victim_age": 25,
        "has_allergy": False,
        "body_location": "arm",
        "notes": "ok",
    }

    create_response = client.post("/api/v1/scenarios", headers=auth_headers(token), json=payload)
    assert create_response.status_code == 201
    scenario = create_response.json()

    list_response = client.get("/api/v1/scenarios", headers=auth_headers(token))
    assert list_response.status_code == 200
    assert any(item["id"] == scenario["id"] for item in list_response.json())

    update_payload = {**payload, "title": "Обновленный сценарий"}
    update_response = client.put(
        f"/api/v1/scenarios/{scenario['id']}",
        headers=auth_headers(token),
        json=update_payload,
    )
    assert update_response.status_code == 200
    assert update_response.json()["title"] == "Обновленный сценарий"

    calculate_response = client.post("/api/v1/scenarios/calculate", headers=auth_headers(token), json=payload)
    assert calculate_response.status_code == 200
    assert "risk_score" in calculate_response.json()

    recalc_response = client.post(
        f"/api/v1/scenarios/{scenario['id']}/recalculate",
        headers=auth_headers(token),
    )
    assert recalc_response.status_code == 200

    delete_response = client.delete(f"/api/v1/scenarios/{scenario['id']}", headers=auth_headers(token))
    assert delete_response.status_code == 204


def test_scenario_toxin_mismatch(client):
    register_user(client)
    token = login_user(client)
    toxins = client.get("/api/v1/toxins", headers=auth_headers(token)).json()
    toxin = toxins[0]
    wrong_organism = "venomous_fish" if toxin["organism_type"] == "jellyfish" else "jellyfish"

    payload = {
        "title": "Ошибка токсина",
        "toxin_type_id": toxin["id"],
        "organism_type": wrong_organism,
        "damage_category": "local",
        "contact_area_cm2": 5,
        "contact_duration_min": 3,
        "victim_age": 25,
        "has_allergy": False,
        "body_location": "arm",
        "notes": "",
    }

    response = client.post("/api/v1/scenarios", headers=auth_headers(token), json=payload)
    assert response.status_code == 400


def test_admin_toxins_crud(client):
    login_response = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    create_payload = {
        "name": "Тестовый токсин админа",
        "description": "описание",
        "organism_type": "jellyfish",
        "neurotoxicity": 4,
        "cytotoxicity": 4,
        "pain_intensity": 4,
        "systemic_factor": 4,
    }
    create_response = client.post("/api/v1/admin/toxins", headers=auth_headers(token), json=create_payload)
    assert create_response.status_code == 201
    toxin_id = create_response.json()["id"]

    update_payload = {**create_payload, "name": "Обновленный токсин"}
    update_response = client.put(
        f"/api/v1/admin/toxins/{toxin_id}",
        headers=auth_headers(token),
        json=update_payload,
    )
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Обновленный токсин"

    delete_response = client.delete(f"/api/v1/admin/toxins/{toxin_id}", headers=auth_headers(token))
    assert delete_response.status_code == 204

    missing_response = client.delete("/api/v1/admin/toxins/999999", headers=auth_headers(token))
    assert missing_response.status_code == 404


def test_admin_forbidden_for_regular_user(client):
    register_user(client)
    token = login_user(client)

    response = client.get("/api/v1/admin/toxins", headers=auth_headers(token))
    assert response.status_code == 403
