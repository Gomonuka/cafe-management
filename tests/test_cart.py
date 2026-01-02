import pytest
from django.core.exceptions import ValidationError
from apps.orders.models import Cart, CartItem


@pytest.mark.django_db
def test_cartitem_quantity_positive(cart, product):
    ci = CartItem(cart=cart, product=product, quantity=0)
    with pytest.raises(ValidationError):
        ci.clean()


@pytest.mark.django_db
def test_cart_unique_company_user(cart):
    with pytest.raises(Exception):
        Cart.objects.create(user=cart.user, company=cart.company)


@pytest.mark.django_db
def test_cartitem_unique(cart, product):
    CartItem.objects.create(cart=cart, product=product, quantity=1)
    with pytest.raises(Exception):
        CartItem.objects.create(cart=cart, product=product, quantity=2)
