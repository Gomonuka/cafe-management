# apps/orders/tests.py
from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from apps.accounts.models import User
from apps.companies.models import Company
from apps.menu.models import MenuCategory, Product
from apps.inventory.models import InventoryItem, RecipeComponent
from .models import Order, OrderItem

class OrderFlowTests(TestCase):
    def setUp(self):
        self.client_api = APIClient()

        self.company = Company.objects.create(
            name="Test Co",
            description="",
            country="LV",
            city="Riga",
            address_line1="Street 1",
            is_active=True,
        )

        self.company_admin = User.objects.create_user(
            username="admin",
            password="pass",
            role="company_admin",
            company=self.company,
        )
        self.employee = User.objects.create_user(
            username="employee",
            password="pass",
            role="employee",
            company=self.company,
        )
        self.client_user = User.objects.create_user(
            username="client",
            password="pass",
            role="client",
            email="client@example.com",
        )

        category = MenuCategory.objects.create(
            name="Main",
            description="",
            company=self.company,
        )
        self.product = Product.objects.create(
            name="Burger",
            description="",
            price=Decimal("5.00"),
            category=category,
            company=self.company,
        )

        self.inventory_item = InventoryItem.objects.create(
            name="Meat",
            company=self.company,
            unit="kg",
            min_quantity=Decimal("0"),
            quantity=Decimal("1.0"),
        )
        RecipeComponent.objects.create(
            product=self.product,
            inventory_item=self.inventory_item,
            quantity=Decimal("0.6"),
        )

        self.order = Order.objects.create(
            number="ORD-1",
            notes="",
            order_type=Order.OrderType.DINE_IN,
            status=Order.OrderStatus.NEW,
            company=self.company,
            client=self.client_user,
            total_amount=Decimal("0"),
        )
        OrderItem.objects.create(
            order=self.order,
            product=self.product,
            quantity=1,
            unit_price=self.product.price,
            line_total=self.product.price,
        )

    def _auth(self, user):
        self.client_api.force_authenticate(user=user)

    def test_forbid_illegal_status_transition(self):
        self._auth(self.company_admin)
        resp = self.client_api.patch(
            f"/api/orders/{self.order.id}/",
            {"status": Order.OrderStatus.COMPLETED},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_prevent_negative_stock_on_creation(self):
        self._auth(self.client_user)
        # samazināt pieejamo krājumu, lai padarītu pasūtījumu neiespējamu (vajadzīgi 0,6, ir 0,4)
        self.inventory_item.quantity = Decimal("0.4")
        self.inventory_item.save(update_fields=["quantity"])
        payload = {
            "notes": "",
            "order_type": Order.OrderType.DINE_IN,
            "status": Order.OrderStatus.NEW,
            "company": self.company.id,
            "items": [
                {"product": self.product.id, "quantity": 1},
            ],
        }
        resp = self.client_api.post("/api/orders/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_prevent_item_edit_after_completion(self):
        self._auth(self.company_admin)
        self.order.status = Order.OrderStatus.READY
        self.order.save(update_fields=["status"])
        # palielināt krājumus, lai atļautu pabeigšanu
        self.inventory_item.quantity = Decimal("5.0")
        self.inventory_item.save(update_fields=["quantity"])
        resp = self.client_api.patch(
            f"/api/orders/{self.order.id}/",
            {"status": Order.OrderStatus.COMPLETED},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        item = self.order.items.first()
        resp_item = self.client_api.patch(
            f"/api/order-items/{item.id}/",
            {"quantity": 2},
            format="json",
        )
        self.assertEqual(resp_item.status_code, status.HTTP_403_FORBIDDEN)

    def test_order_creation_requires_items(self):
        self._auth(self.client_user)
        payload = {
            "notes": "",
            "order_type": Order.OrderType.DINE_IN,
            "status": Order.OrderStatus.NEW,
            "company": self.company.id,
            "items": [],
        }
        resp = self.client_api.post("/api/orders/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_item_without_recipe_forbidden(self):
        self._auth(self.company_admin)
        product_no_recipe = Product.objects.create(
            name="Soup",
            description="",
            price=Decimal("3.00"),
            category=self.product.category,
            company=self.company,
        )
        resp = self.client_api.post(
            "/api/order-items/",
            {
                "order": self.order.id,
                "product": product_no_recipe.id,
                "quantity": 1,
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_status_change_without_recipe_forbidden(self):
        self._auth(self.company_admin)
        # noņemt parametru kopas komponentus
        self.product.recipe_components.all().delete()
        resp = self.client_api.patch(
            f"/api/orders/{self.order.id}/",
            {"status": Order.OrderStatus.IN_PROGRESS},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_order_creation_consumes_stock(self):
        self._auth(self.client_user)
        payload = {
            "notes": "",
            "order_type": Order.OrderType.DINE_IN,
            "status": Order.OrderStatus.NEW,
            "company": self.company.id,
            "items": [
                {"product": self.product.id, "quantity": 1},
            ],
        }
        resp = self.client_api.post("/api/orders/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.inventory_item.refresh_from_db()
        self.assertEqual(self.inventory_item.quantity, Decimal("0.4"))

    def test_cancel_from_new_restocks(self):
        self._auth(self.client_user)
        payload = {
            "notes": "",
            "order_type": Order.OrderType.DINE_IN,
            "status": Order.OrderStatus.NEW,
            "company": self.company.id,
            "items": [
                {"product": self.product.id, "quantity": 1},
            ],
        }
        resp = self.client_api.post("/api/orders/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        order_id = resp.json()["id"]
        self.inventory_item.refresh_from_db()
        self.assertEqual(self.inventory_item.quantity, Decimal("0.4"))

        # atcelt kad NEW
        self._auth(self.company_admin)
        resp_cancel = self.client_api.patch(
            f"/api/orders/{order_id}/",
            {"status": Order.OrderStatus.CANCELED},
            format="json",
        )
        self.assertEqual(resp_cancel.status_code, status.HTTP_200_OK)
        self.inventory_item.refresh_from_db()
        self.assertEqual(self.inventory_item.quantity, Decimal("1.0"))
