import pytest
from django.core.exceptions import ValidationError
from apps.menu.models import MenuCategory, Product, RecipeItem


@pytest.mark.django_db
def test_category_unique_per_company(company):
    MenuCategory.objects.create(company=company, name="Hot")
    with pytest.raises(Exception):
        MenuCategory.objects.create(company=company, name="Hot")


@pytest.mark.django_db
def test_product_price_positive(company, category):
    p = Product(company=company, category=category, name="Tea", price=-5)
    with pytest.raises(ValidationError):
        p.full_clean()


@pytest.mark.django_db
def test_product_unique_per_company(company, category):
    Product.objects.create(company=company, category=category, name="Tea", price=5)
    with pytest.raises(Exception):
        Product.objects.create(company=company, category=category, name="Tea", price=6)


@pytest.mark.django_db
def test_recipe_item_amount_positive(product, inventory_item):
    ri = RecipeItem(product=product, inventory_item=inventory_item, amount=-1)
    with pytest.raises(ValidationError):
        ri.full_clean()


@pytest.mark.django_db
def test_menu_public_blocked_company_denied(client_api, company):
    company.is_blocked = True
    company.save(update_fields=["is_blocked"])
    resp = client_api.get(f"/menu/{company.id}/")
    assert resp.status_code in (401, 403)
