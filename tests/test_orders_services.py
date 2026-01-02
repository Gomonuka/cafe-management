import pytest
from decimal import Decimal
from rest_framework.exceptions import ValidationError
from apps.orders.services import consume_inventory_for_order
from apps.orders.models import OrderItem


@pytest.mark.django_db
def test_consume_inventory_missing_recipe_raises(order, product):
    OrderItem.objects.create(order=order, product=product, quantity=1, unit_price=1)
    with pytest.raises(ValidationError):
        consume_inventory_for_order(order)


@pytest.mark.django_db
def test_consume_inventory_not_enough(inventory_item, product, recipe_item, order):
    OrderItem.objects.create(order=order, product=product, quantity=200, unit_price=1)
    with pytest.raises(ValidationError):
        consume_inventory_for_order(order)


@pytest.mark.django_db
def test_consume_inventory_ok(inventory_item, product, recipe_item, order):
    OrderItem.objects.create(order=order, product=product, quantity=10, unit_price=1)
    consume_inventory_for_order(order)
    inventory_item.refresh_from_db()
    assert inventory_item.quantity == Decimal("900")
