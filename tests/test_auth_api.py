import pytest
from rest_framework_simplejwt.tokens import RefreshToken


@pytest.mark.django_db
def test_login_sets_cookies(client_api, user_factory):
    u = user_factory(password="Pass1234!")
    resp = client_api.post("/accounts/auth/login/", {"email": u.email, "password": "Pass1234!"})
    assert resp.status_code == 200
    assert "access_token" in resp.cookies
    assert "refresh_token" in resp.cookies


@pytest.mark.django_db
def test_login_wrong_password(client_api, user_factory):
    u = user_factory(password="Pass1234!")
    resp = client_api.post("/accounts/auth/login/", {"email": u.email, "password": "bad"})
    assert resp.status_code == 400


@pytest.mark.django_db
def test_refresh_rejects_blocked_user(client_api, user_factory):
    u = user_factory(is_blocked=True)
    token = RefreshToken.for_user(u)
    client_api.cookies["refresh_token"] = str(token)
    resp = client_api.post("/accounts/auth/refresh/")
    assert resp.status_code == 401


@pytest.mark.django_db
def test_logout_blacklists_refresh(client_api, user_factory):
    u = user_factory()
    refresh = RefreshToken.for_user(u)
    client_api.force_authenticate(user=u)
    resp = client_api.post("/accounts/auth/logout/", {"refresh": str(refresh)})
    assert resp.status_code == 200


@pytest.mark.django_db
def test_refresh_invalid_token(client_api):
    client_api.cookies["refresh_token"] = "not-a-token"
    resp = client_api.post("/accounts/auth/refresh/")
    assert resp.status_code == 401
