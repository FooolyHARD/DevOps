from app.core.security import create_access_token, decode_access_token, get_password_hash, verify_password


def test_password_hash_and_verify():
    password = "strong-password-123"
    hashed = get_password_hash(password)

    assert verify_password(password, hashed) is True
    assert verify_password("wrong-password", hashed) is False


def test_access_token_roundtrip():
    token = create_access_token("user@example.com")
    payload = decode_access_token(token)

    assert payload["sub"] == "user@example.com"
