from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from apps.accounts.models import User
from apps.companies.models import Company
from .models import EmailTemplate, EmailLog


class EmailLogPermissionsTests(TestCase):
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
            email="ca@example.com",
        )
        self.other_admin = User.objects.create_user(
            username="ca2",
            password="pass",
            role="company_admin",
            company=self.other_company,
            email="ca2@example.com",
        )
        template = EmailTemplate.objects.create(code="test", subject="s", body="b")
        EmailLog.objects.create(template=template, subject="s", recipient="ca@example.com", status="sent", receiver_user=self.company_admin)
        EmailLog.objects.create(template=template, subject="s", recipient="ca2@example.com", status="sent", receiver_user=self.other_admin)

    def _auth(self, user):
        self.client_api.force_authenticate(user=user)

    def test_system_admin_full_access(self):
        self._auth(self.system_admin)
        resp = self.client_api.get("/api/email-logs/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.json()), 2)

    def test_company_admin_sees_only_own_company_logs(self):
        self._auth(self.company_admin)
        resp = self.client_api.get("/api/email-logs/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        recipients = {log["recipient"] for log in resp.json()}
        self.assertIn("ca@example.com", recipients)
        self.assertNotIn("ca2@example.com", recipients)

    def test_company_admin_cannot_create_log(self):
        self._auth(self.company_admin)
        resp = self.client_api.post(
            "/api/email-logs/",
            {"subject": "x", "recipient": "a@b.com", "status": "sent"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
