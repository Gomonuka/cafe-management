from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from apps.accounts.models import User
from apps.companies.models import Company
from .models import InventoryItem


class InventoryPermissionsTests(TestCase):
    def setUp(self):
        self.client_api = APIClient()
        self.company = Company.objects.create(
            name="Co",
            description="",
            country="LV",
            city="Riga",
            address_line1="Street 1",
            is_active=True,
        )
        self.other_company = Company.objects.create(
            name="Co2",
            description="",
            country="LV",
            city="Riga",
            address_line1="Street 2",
            is_active=True,
        )
        self.system_admin = User.objects.create_user(
            username="sys",
            password="pass",
            role="system_admin",
        )
        self.company_admin = User.objects.create_user(
            username="ca",
            password="pass",
            role="company_admin",
            company=self.company,
        )
        self.employee = User.objects.create_user(
            username="emp",
            password="pass",
            role="employee",
            company=self.company,
        )
        self.other_admin = User.objects.create_user(
            username="ca2",
            password="pass",
            role="company_admin",
            company=self.other_company,
        )
        self.item = InventoryItem.objects.create(
            name="Sugar",
            company=self.company,
            unit="kg",
            min_quantity=Decimal("0"),
            quantity=Decimal("10"),
        )

    def _auth(self, user):
        self.client_api.force_authenticate(user=user)

    def test_company_admin_can_crud_own_inventory(self):
        self._auth(self.company_admin)
        resp = self.client_api.post(
            "/api/inventory-items/",
            {"name": "Salt", "company": self.company.id, "unit": "kg", "quantity": "1", "min_quantity": "0"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        resp_list = self.client_api.get("/api/inventory-items/")
        self.assertEqual(resp_list.status_code, status.HTTP_200_OK)
        self.assertTrue(all(item["company"] == self.company.id for item in resp_list.json()))

    def test_company_admin_cannot_access_other_company_inventory(self):
        self._auth(self.company_admin)
        resp = self.client_api.get("/api/inventory-items/")
        ids = {item["id"] for item in resp.json()}
        self.assertNotIn(self.item.id, ids)  # only own company items

    def test_system_admin_sees_all(self):
        self._auth(self.system_admin)
        resp = self.client_api.get("/api/inventory-items/")
        ids = {item["id"] for item in resp.json()}
        self.assertIn(self.item.id, ids)

    def test_negative_movement_blocked(self):
        self._auth(self.company_admin)
        resp = self.client_api.post(
            "/api/inventory-movements/",
            {"inventory_item": self.item.id, "quantity_change": "-20", "reason": "oops"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
