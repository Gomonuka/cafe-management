import uuid

import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from apps.companies.models import Company
from apps.inventory.models import InventoryItem
from apps.menu.models import MenuCategory, Product, RecipeItem
from apps.orders.models import Cart, Order


@pytest.fixture
def client_api():
    return APIClient()


@pytest.fixture
def user_factory(db):
    User = get_user_model()

    def _make(role="client", company=None, **kwargs):
        num = uuid.uuid4().hex[:6]
        u = User(
            username=kwargs.get("username", f"{role}_{num}"),
            email=kwargs.get("email", f"{role}_{num}@example.com"),
            role=role,
            company=company,
            is_active=kwargs.get("is_active", True),
            is_blocked=kwargs.get("is_blocked", False),
            profile_completed=kwargs.get("profile_completed", True),
        )
        u.set_password(kwargs.get("password", "Pass1234!"))
        u.save()
        return u

    return _make


@pytest.fixture
def company(db):
    return Company.objects.create(
        name="ACME",
        email="acme@example.com",
        phone="+123",
        country="LV",
        city="Riga",
        address_line1="Street 1",
        description="Test",
        is_active=True,
    )


@pytest.fixture
def other_company(db):
    return Company.objects.create(
        name="Other",
        email="other@example.com",
        phone="+321",
        country="LV",
        city="Riga",
        address_line1="Street 2",
        description="Other",
        is_active=True,
    )


@pytest.fixture
def category(company):
    return MenuCategory.objects.create(company=company, name="Main")


@pytest.fixture
def product(company, category):
    return Product.objects.create(company=company, category=category, name="Coffee", price=5)


@pytest.fixture
def inventory_item(company):
    return InventoryItem.objects.create(company=company, name="Beans", unit="g", quantity=1000)


@pytest.fixture
def recipe_item(product, inventory_item):
    return RecipeItem.objects.create(product=product, inventory_item=inventory_item, amount=10)


@pytest.fixture
def cart(user_factory, company):
    user = user_factory(role="client", company=company)
    return Cart.objects.create(user=user, company=company)


@pytest.fixture
def order(user_factory, company):
    user = user_factory(role="client", company=company)
    return Order.objects.create(user=user, company=company, order_type="ON", status="NEW")
