# apps/orders/models.py
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError

class Cart(models.Model):
    # Grozs ir piesaistīts klientam un uzņēmumam
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="carts")
    company = models.ForeignKey("companies.Company", on_delete=models.CASCADE, related_name="carts")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "company")

    def __str__(self):
        return f"Cart {self.id} user={self.user_id} company={self.company_id}"

class CartItem(models.Model):
    # Groza pozīcija: produkts + daudzums
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey("menu.Product", on_delete=models.PROTECT, related_name="cart_items")
    quantity = models.PositiveIntegerField()

    class Meta:
        unique_together = ("cart", "product")

    def clean(self):
        # Daudzumam jābūt pozitīvam
        if self.quantity <= 0:
            raise ValidationError("Daudzumam jābūt pozitīvam.")

    def __str__(self):
        return f"CartItem {self.id} product={self.product_id} qty={self.quantity}"


class Order(models.Model):
    class Status(models.TextChoices):
        NEW = "NEW", "Jauns"
        IN_PROGRESS = "INP", "Tiek gatavots"
        READY = "RDY", "Gatavs"
        DONE = "DON", "Pabeigts"
        CANCELED = "CAN", "Atcelts"

    class OrderType(models.TextChoices):
        ON_SITE = "ON", "Uz vietas"
        TAKEAWAY = "TA", "Līdzņemšanai"

    # Pasūtījums pieder klientam un uzņēmumam
    user = models.ForeignKey("accounts.User", null=True, blank=True, on_delete=models.PROTECT, related_name="orders")
    company = models.ForeignKey("companies.Company", on_delete=models.PROTECT, related_name="orders")

    status = models.CharField(max_length=3, choices=Status.choices, default=Status.NEW)
    order_type = models.CharField(max_length=2, choices=OrderType.choices)

    notes = models.CharField(max_length=1000, blank=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    created_at = models.DateTimeField(default=timezone.now, editable=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    def set_status(self, new_status: str):
        # Statusa maiņas noteikumi (ORDER_005)
        if self.status in {self.Status.DONE, self.Status.CANCELED}:
            raise ValidationError("Pabeigts vai atcelts pasūtījums nav rediģējams.")

        allowed = {
            self.Status.NEW: {self.Status.IN_PROGRESS},
            self.Status.IN_PROGRESS: {self.Status.READY},
            self.Status.READY: {self.Status.DONE},
        }
        if new_status not in dict(self.Status.choices):
            raise ValidationError("Nederīgs statuss.")

        if new_status not in allowed.get(self.status, set()):
            raise ValidationError("Statusa maiņa nav atļauta.")

        self.status = new_status
        if new_status == self.Status.DONE:
            self.completed_at = timezone.now()

    def __str__(self):
        return f"Order {self.id} status={self.status}"

class OrderItem(models.Model):
    # Pasūtījuma pozīcija: produkts + daudzums + cena fiksēta uz pasūtījuma brīdi
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey("menu.Product", on_delete=models.PROTECT, related_name="order_items")
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)

    def clean(self):
        if self.quantity <= 0:
            raise ValidationError("Daudzumam jābūt pozitīvam.")
        if self.unit_price <= 0:
            raise ValidationError("Cenai jābūt pozitīvai.")
