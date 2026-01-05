# apps/menu/models.py
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def product_photo_path(instance, filename: str) -> str:
    # Saglabājam pēc company_id; nelietojam instance.id, lai ceļš neveidotos ar None pirms pirmā saglabāšanas cikla
    return f"products/{instance.company_id}/{filename}"


def validate_image_file(file_obj):
    # Validē attēla failu (jpg/png) un izmēru (<=50MB)
    if file_obj.size > MAX_FILE_SIZE:
        raise ValidationError("Fails ir pārāk liels. Maksimālais izmērs ir 50MB.")
    ct = getattr(file_obj, "content_type", None)
    if ct and ct not in {"image/jpeg", "image/png"}:
        raise ValidationError("Atļauti tikai JPG un PNG attēli.")


class MenuCategory(models.Model):
    # Ēdienkartes kategorija ir piesaistīta uzņēmumam
    company = models.ForeignKey("companies.Company", on_delete=models.CASCADE, related_name="menu_categories")
    name = models.CharField(max_length=255)
    description = models.CharField(max_length=1000, blank=True)
    is_active = models.BooleanField(default=True)  # Klientam rādam tikai aktīvās kategorijas

    created_at = models.DateTimeField(default=timezone.now, editable=False)

    class Meta:
        unique_together = ("company", "name")
        ordering = ["name"]

    def __str__(self):
        return f"{self.company_id}: {self.name}"

class Product(models.Model):
    # Produkts pieder uzņēmumam un kategorijai
    company = models.ForeignKey("companies.Company", on_delete=models.CASCADE, related_name="products")
    category = models.ForeignKey(MenuCategory, on_delete=models.PROTECT, related_name="products")

    name = models.CharField(max_length=255)
    photo = models.ImageField(
        upload_to=product_photo_path,
        validators=[validate_image_file],
        null=True,
        blank=True
    )
    is_available = models.BooleanField(default=True)  # pieejams / nav pieejams
    price = models.DecimalField(max_digits=10, decimal_places=2)  # cena par vienību

    created_at = models.DateTimeField(default=timezone.now, editable=False)

    class Meta:
        unique_together = ("company", "name")
        ordering = ["name"]

    def clean(self):
        # Cena nedrīkst būt negatīva
        if self.price is not None and self.price <= 0:
            raise ValidationError("Cena par vienību ir jābūt pozitīvai vērtībai.")

    def __str__(self):
        return f"{self.company_id}: {self.name}"

class RecipeItem(models.Model):
    # Produkta recepte: sastāvdaļa no noliktavas + daudzums uz 1 vienību
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="recipe_items")
    inventory_item = models.ForeignKey("inventory.InventoryItem", on_delete=models.PROTECT, related_name="used_in_recipes")
    amount = models.DecimalField(max_digits=12, decimal_places=3)  # daudzums uz 1 produktu

    class Meta:
        unique_together = ("product", "inventory_item")

    def clean(self):
        # Daudzumam jābūt pozitīvam
        if self.amount is not None and self.amount <= 0:
            raise ValidationError("Sastāvdaļas daudzumam jābūt pozitīvam.")
