from django.db import models
from django.conf import settings


class InventoryItem(models.Model):
    """
    Entitātes Noliktavas vienība (InventoryItem) atribūti:
    1) Nosaukums - name
    2) Uzņēmums - company (FK to Company)
    3) Mērvienība - unit
    4) Minimālais daudzums - min_quantity
    5) Daudzums - quantity
    """

    name = models.CharField(max_length=255)  # Nosaukums
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="inventory_items",
    )  # Uzņēmums
    unit = models.CharField(max_length=50)  # Mērvienība
    min_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # Minimālais daudzums
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # Daudzums

    def __str__(self):
        return f"{self.name} ({self.company})"


class InventoryMovement(models.Model):
    """
    Entitātes Noliktavas kustība (InventoryMovement) atribūti:
    1) Daudzuma izmaiņas - quantity_change
    2) Iemesls - reason
    3) Noliktavas vienība - inventory_item (FK to InventoryItem)
    4) Izveidoja lietotājs - created_by (FK to User)
    5) Izveidošanas laiks - created_at
    """

    inventory_item = models.ForeignKey(
        InventoryItem,
        on_delete=models.CASCADE,
        related_name="movements",
    )  # Noliktavas vienība
    quantity_change = models.DecimalField(max_digits=10, decimal_places=2)  # Daudzuma izmaiņas
    reason = models.CharField(max_length=255, blank=True)  # Iemesls
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="inventory_movements",
    )  # Izveidoja lietotājs
    created_at = models.DateTimeField(auto_now_add=True)  # Izveidošanas laiks

    def __str__(self):
        return f"{self.inventory_item.name}: {self.quantity_change}"

class RecipeComponent(models.Model):
    """
    Entitātes Receptes sastāvdaļa (RecipeComponent) atrubūti:
    1) Daudzums - quantity
    2) Produkts - product (FK to Product)
    3) Noliktavas vienība - inventory_item (FK to InventoryItem)
    """

    product = models.ForeignKey(
        "menu.Product",
        on_delete=models.CASCADE,
        related_name="recipe_components",
    )  # Produkts
    inventory_item = models.ForeignKey(
        InventoryItem,
        on_delete=models.CASCADE,
        related_name="recipe_components",
    )  # Noliktavas vienība
    quantity = models.DecimalField(max_digits=10, decimal_places=2)  # Daudzums

    class Meta:
        unique_together = ("product", "inventory_item")

    def __str__(self):
        return f"{self.product} - {self.inventory_item} ({self.quantity})"
