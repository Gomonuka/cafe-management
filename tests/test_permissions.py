import pytest
from apps.orders.models import Order


@pytest.mark.django_db
def test_client_sees_only_their_orders(client_api, user_factory, company):
    me = user_factory(role="client", company=company)
    other = user_factory(role="client", company=company)
    mine = Order.objects.create(user=me, company=company, order_type="ON", status=Order.Status.NEW)
    Order.objects.create(user=other, company=company, order_type="ON", status=Order.Status.NEW)

    client_api.force_authenticate(user=me)
    resp = client_api.get("/orders/orders/my/")
    assert resp.status_code == 200
    active = resp.data.get("active", [])
    returned_ids = {o["id"] for o in active}
    assert mine.id in returned_ids
    assert len(returned_ids) == 1


@pytest.mark.django_db
def test_company_admin_sees_company_orders(client_api, user_factory, company, other_company):
    admin = user_factory(role="company_admin", company=company)
    my_order = Order.objects.create(user=admin, company=company, order_type="ON", status=Order.Status.NEW)
    Order.objects.create(user=user_factory(role="client", company=other_company), company=other_company, order_type="ON", status=Order.Status.NEW)

    client_api.force_authenticate(user=admin)
    resp = client_api.get("/orders/company/orders/")
    assert resp.status_code == 200
    active = resp.data.get("active", [])
    ids = {o["id"] for o in active}
    assert my_order.id in ids
    assert len(ids) == 1


@pytest.mark.django_db
def test_forbidden_cross_company_update(client_api, user_factory, company, other_company):
    admin_other = user_factory(role="company_admin", company=other_company)
    order = Order.objects.create(user=user_factory(role="client", company=company), company=company, order_type="ON", status=Order.Status.NEW)

    client_api.force_authenticate(user=admin_other)
    resp = client_api.post(f"/orders/company/orders/{order.id}/status/", {"new_status": "INP"})
    assert resp.status_code in (401, 403, 404)


@pytest.mark.django_db
def test_system_admin_sees_all_companies(client_api, company, other_company, user_factory):
    other_company.is_blocked = True
    other_company.save(update_fields=["is_blocked"])
    sa = user_factory(role="system_admin", company=None)
    client_api.force_authenticate(user=sa)
    resp = client_api.get("/companies/")
    assert resp.status_code == 200
    assert len(resp.data) >= 2
