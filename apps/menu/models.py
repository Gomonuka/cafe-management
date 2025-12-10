from django.db import models
from django.conf import settings


class MenuCategory(models.Model):
    """
    Entitātes Ēdienkartes kategorija (MenuCategory) atribūti:
    1) Nosaukums - name
    2) Apraksts - description
    3) Uzņēmums - company (FK to Company)
    """

    name = models.CharField(max_length=255)  # Nosaukums
    description = models.TextField(blank=True)  # Apraksts
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="menu_categories",
    )  # Uzņēmums

    def __str__(self):
        return self.name


class Product(models.Model):
    """
    Entitātes Produkts (Product) atribūti:
    1) Nosaukums - name
    2) Apraksts - description
    3) Foto - image
    4) Cena - price
    5) Pieejamība - is_available
    6) Kategorija - category (FK to MenuCategory)
    7) Uzņēmums - company (FK to Company)
    """

    name = models.CharField(max_length=255)  # Nosaukums
    description = models.TextField(blank=True)  # Apraksts
    image = models.ImageField(upload_to="product_images/", null=True, blank=True)  # Foto
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Cena
    is_available = models.BooleanField(default=True)  # Pieejamība
    category = models.ForeignKey(
        MenuCategory,
        on_delete=models.CASCADE,
        related_name="products",
    )  # Kategorija
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="products",
    )  # Uzņēmums

    def __str__(self):
        return self.name
