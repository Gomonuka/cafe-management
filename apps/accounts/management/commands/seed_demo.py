from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal

from apps.companies.models import Company, CompanyWorkingHours
from apps.menu.models import MenuCategory, Product
from apps.inventory.models import InventoryItem, RecipeComponent
from apps.orders.models import Order, OrderItem
from apps.notifications.models import EmailTemplate

User = get_user_model()


class Command(BaseCommand):
    help = "Seed database with demo data (companies, users, products, inventory, orders)"

    def handle(self, *args, **options):
        self.stdout.write("Seeding demo data...")
        self._seed_templates()
        company1 = self._company("Blue Cafe", "LV", "Riga", "Brivibas 1")
        company2 = self._company("Green Bistro", "LV", "Jelgava", "Liela iela 5")

        admin = self._user("sysadmin", "sys@example.com", "system_admin")
        ca = self._user("admin1", "admin1@example.com", "company_admin", company1)
        emp = self._user("emp1", "emp1@example.com", "employee", company1)
        client = self._user("client1", "client1@example.com", "client")

        category = MenuCategory.objects.get_or_create(name="Mains", company=company1)[0]
        burger = Product.objects.get_or_create(
            name="Burger",
            company=company1,
            category=category,
            defaults={"price": Decimal("9.50"), "description": "Beef burger"},
        )[0]

        meat = InventoryItem.objects.get_or_create(
            name="Beef patty",
            company=company1,
            defaults={"unit": "kg", "quantity": Decimal("5"), "min_quantity": Decimal("1")},
        )[0]
        bun = InventoryItem.objects.get_or_create(
            name="Bun",
            company=company1,
            defaults={"unit": "pcs", "quantity": Decimal("30"), "min_quantity": Decimal("10")},
        )[0]
        RecipeComponent.objects.get_or_create(product=burger, inventory_item=meat, defaults={"quantity": Decimal("0.2")})
        RecipeComponent.objects.get_or_create(product=burger, inventory_item=bun, defaults={"quantity": Decimal("1")})

        order = Order.objects.create(
            number="ORD-DEMO-1",
            notes="",
            order_type=Order.OrderType.DINE_IN,
            status=Order.OrderStatus.NEW,
            company=company1,
            client=client,
            total_amount=Decimal("9.50"),
        )
        OrderItem.objects.create(
            order=order,
            product=burger,
            quantity=1,
            unit_price=burger.price,
            line_total=burger.price,
        )

        self.stdout.write(self.style.SUCCESS("Demo data seeded."))

    def _user(self, username, email, role, company=None):
        user, _ = User.objects.get_or_create(username=username, defaults={"email": email, "role": role, "company": company})
        user.role = role
        if company:
            user.company = company
        user.set_password("password")
        user.save()
        return user

    def _company(self, name, country, city, address):
        company, _ = Company.objects.get_or_create(
            name=name,
            defaults={
                "description": f"{name} description",
                "country": country,
                "city": city,
                "address_line1": address,
                "phone": "",
                "email": "",
                "is_active": True,
            },
        )
        # simple working hours all week
        for day in range(1, 8):
            CompanyWorkingHours.objects.get_or_create(
                company=company,
                weekday=day,
                defaults={"opens_at": timezone.datetime(2025, 1, 1, 9, 0).time(), "closes_at": timezone.datetime(2025, 1, 1, 18, 0).time(), "is_closed": False},
            )
        return company

    def _seed_templates(self):
        templates = [
            ("password_reset_request", "Password reset", "Use this link: {reset_link}"),
            ("password_reset_success", "Password changed", "Password was changed for {username}"),
            ("order_new_for_company", "New order {order_number}", "New order at {company}"),
            ("order_status_changed", "Order {order_number} status", "Changed from {previous_status} to {new_status}"),
        ]
        for code, subject, body in templates:
            EmailTemplate.objects.get_or_create(code=code, defaults={"subject": subject, "body": body, "is_active": True})
