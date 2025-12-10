from django.db import models
from django.conf import settings


class Order(models.Model):
    """
    Entitātes Pasūtījums (Order) atribūti:
    1) Numurs - number
    2) Piezīmes - notes
    3) Izveidošanas laiks - created_at
    4) Veids - order_type
    5) Statuss - status
    6) Uzņēmums - company (FK to Company)
    7) Kopējā summa - total_amount
    8) Klients - client (FK to User)
    9) Pēdējo izmaiņu laiks - last_modified_at
    """

    class OrderType(models.TextChoices):
        DINE_IN = "dine_in", "Uz vietas"
        TAKEAWAY = "takeaway", "Līdzņemšanai"

    class OrderStatus(models.TextChoices):
        NEW = "new", "Jauns"
        IN_PROGRESS = "in_progress", "Procesā"
        READY = "ready", "Gatavs"
        COMPLETED = "completed", "Pabeigts"
        CANCELED = "canceled", "Atcelts"

    number = models.CharField(max_length=50, unique=True)  # Numurs
    notes = models.TextField(blank=True)  # Piezīmes
    created_at = models.DateTimeField(auto_now_add=True)  # Izveidošanas laiks
    order_type = models.CharField(max_length=20, choices=OrderType.choices)  # Veids
    status = models.CharField(max_length=20, choices=OrderStatus.choices)  # Statuss

    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="orders",
    )  # Uzņēmums
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="orders",
    )  # Klients

    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # Kopējā summa
    last_modified_at = models.DateTimeField(auto_now=True)  # Pēdējo izmaiņu laiks

    def __str__(self):
        return self.number


class OrderItem(models.Model):
    """
    Entitātes Pasūtījuma pozīcija (OrderItem) atribūti:
    1) Daudzums - quantity
    2) Vienības cena - unit_price
    3) Produkts - product (FK to Product)
    4) Pasūtījums - order (FK to Order)
    5) Pozīcijas summa - line_total
    """

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )  # Pasūtījums
    product = models.ForeignKey(
        "menu.Product",
        on_delete=models.PROTECT,
        related_name="order_items",
    )  # Produkts

    quantity = models.PositiveIntegerField()  # Daudzums
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)  # Vienības cena
    line_total = models.DecimalField(max_digits=10, decimal_places=2)  # Pozīcijas summa

    def __str__(self):
        return f"{self.order.number} - {self.product.name}"


class OrderStatusHistory(models.Model):
    """
    Entitātes Pasūtījuma statusa vēsture (OrderStatusHistory) atrubūti:
    1) Iepriekšējais statuss - previous_status
    2) Jaunais statuss - new_status
    3) Mainīšanas laiks - changed_at
    4) Pasūtījums - oreder (FK to Order)
    6) Mainīja lietotājs - changed_by (FK to User)
    """

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="status_history",
    )  # Pasūtījums
    previous_status = models.CharField(max_length=20)  # Iepriekšējais statuss
    new_status = models.CharField(max_length=20)  # Jaunais statuss
    changed_at = models.DateTimeField(auto_now_add=True)  # Mainīšanas laiks
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="changed_order_statuses",
    )  # Mainīja lietotājs

    def __str__(self):
        return f"{self.order.number}: {self.previous_status} → {self.new_status}"
