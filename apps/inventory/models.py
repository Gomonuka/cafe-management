from django.db import models
from django.core.exceptions import ValidationError


class InventoryItem(models.Model):
    # Noliktavas vienība ir piesaistīta uzņēmumam
    company = models.ForeignKey("companies.Company", on_delete=models.CASCADE, related_name="inventory_items")

    name = models.CharField(max_length=255)
    unit = models.CharField(max_length=50)  # piem., g, ml, gab.
    quantity = models.DecimalField(max_digits=12, decimal_places=3)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("company", "name")
        ordering = ["name"]

    def clean(self):
        # Daudzumam jābūt pozitīvam
        if self.quantity is not None and self.quantity <= 0:
            raise ValidationError("Daudzumam jābūt pozitīvam.")

    def __str__(self):
        return f"{self.company_id}: {self.name} ({self.unit})"
