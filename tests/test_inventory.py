import pytest
from django.core.exceptions import ValidationError
from apps.inventory.models import InventoryItem


@pytest.mark.django_db
def test_inventory_quantity_positive(company):
    item = InventoryItem(company=company, name="Milk", unit="l", quantity=-1)
    with pytest.raises(ValidationError):
        item.full_clean()


@pytest.mark.django_db
def test_inventory_unique_name_per_company(company):
    InventoryItem.objects.create(company=company, name="Milk", unit="l", quantity=1)
    with pytest.raises(Exception):
        InventoryItem.objects.create(company=company, name="Milk", unit="l", quantity=2)


@pytest.mark.django_db
def test_inventory_str(company):
    item = InventoryItem.objects.create(company=company, name="Sugar", unit="kg", quantity=1)
    assert "Sugar" in str(item)
