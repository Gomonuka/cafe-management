import pytest


@pytest.mark.django_db
def test_company_soft_delete(company):
    company.soft_delete()
    assert company.is_deleted is True
    assert company.is_active is False


@pytest.mark.django_db
def test_company_block_flag(company):
    company.is_blocked = True
    company.save()
    assert company.is_blocked is True


@pytest.mark.django_db
def test_company_is_open_now(company):
    assert company.is_open_now() is True
    company.is_blocked = True
    company.save()
    assert company.is_open_now() is False


@pytest.mark.django_db
def test_public_list_excludes_blocked(client_api, company):
    company.is_blocked = True
    company.save(update_fields=["is_blocked"])
    resp = client_api.get("/companies/")
    assert resp.status_code == 200
    assert resp.data == [] or resp.data.get("code") == "P_006"
