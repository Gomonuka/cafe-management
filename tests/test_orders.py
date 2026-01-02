import pytest
from django.core.exceptions import ValidationError
from apps.orders.models import Order, OrderItem


@pytest.mark.django_db
def test_order_status_transition(order):
    order.set_status(Order.Status.IN_PROGRESS)
    assert order.status == Order.Status.IN_PROGRESS
    with pytest.raises(ValidationError):
        order.set_status(Order.Status.NEW)


@pytest.mark.django_db
def test_order_complete_sets_completed_at(order):
    order.set_status(Order.Status.IN_PROGRESS)
    order.set_status(Order.Status.READY)
    order.set_status(Order.Status.DONE)
    assert order.completed_at is not None


@pytest.mark.django_db
def test_order_type_choices(order):
    order.order_type = "XX"
    with pytest.raises(ValidationError):
        order.full_clean()


@pytest.mark.django_db
def test_orderitem_quantity_positive(order, product):
    oi = OrderItem(order=order, product=product, quantity=0, unit_price=1)
    with pytest.raises(ValidationError):
        oi.clean()


@pytest.mark.django_db
def test_orderitem_unit_price_positive(order, product):
    oi = OrderItem(order=order, product=product, quantity=1, unit_price=0)
    with pytest.raises(ValidationError):
        oi.clean()


@pytest.mark.django_db
def test_checkout_empty_cart_returns_error(client_api, user_factory, company):
    user = user_factory(role="client", company=company)
    client_api.force_authenticate(user=user)
    resp = client_api.post("/orders/orders/checkout/", {"company_id": company.id, "order_type": "ON"})
    assert resp.status_code == 400
