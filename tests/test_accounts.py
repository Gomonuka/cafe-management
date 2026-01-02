import pytest
from django.db import IntegrityError
from django.utils import timezone
from django.contrib.auth import get_user_model


@pytest.mark.django_db
def test_user_soft_delete_hides_from_manager(user_factory):
    u = user_factory()
    u.soft_delete()
    User = get_user_model()
    assert User.objects.filter(id=u.id).count() == 0
    assert User.objects.all_with_deleted().filter(id=u.id).count() == 1
    assert u.is_deleted is True


@pytest.mark.django_db
def test_unique_email(user_factory):
    first = user_factory(email="dup@example.com")
    with pytest.raises(IntegrityError):
        user_factory(email=first.email)


@pytest.mark.django_db
def test_profile_completed_flag(user_factory):
    u = user_factory(profile_completed=False)
    assert not u.profile_completed


@pytest.mark.django_db
def test_blocked_user_flag(user_factory):
    u = user_factory(is_blocked=True)
    assert u.is_blocked is True


@pytest.mark.django_db
def test_manager_alive_filters_deleted(user_factory):
    alive = user_factory()
    deleted = user_factory()
    deleted.deleted_at = timezone.now()
    deleted.is_active = False
    deleted.save(update_fields=["deleted_at", "is_active"])
    qs = get_user_model().objects
    assert qs.filter(id=alive.id).exists()
    assert not qs.filter(id=deleted.id).exists()


@pytest.mark.django_db
def test_secret_questions_list(client_api):
    from apps.accounts.models import SecretQuestion
    SecretQuestion.objects.create(text="Q1")
    resp = client_api.get("/accounts/auth/secret-questions/")
    assert resp.status_code == 200
    assert len(resp.data) >= 1


@pytest.mark.django_db
def test_login_deleted_user_fails(user_factory, client_api):
    u = user_factory(password="Pass1234!")
    u.soft_delete()
    resp = client_api.post("/accounts/auth/login/", {"email": u.email, "password": "Pass1234!"})
    assert resp.status_code == 400
