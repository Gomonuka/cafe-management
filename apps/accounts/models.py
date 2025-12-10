from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings


class User(AbstractUser):
    """
    Entitātes Lietotājs (User) atribūti:
    1) Lietotājvārds - username (included in AbstractUser)
    2) Parole - password (included in AbstractUser)
    3) E-pasts - email (included in AbstractUser)
    4) Konta_foto - avatar
    5) Tēma - theme
    6) Vai_ir_bloķēts - is_blocked
    7) Loma - role
    8) Valoda - language
    9) Uzņēmuma_identifikators - company (FK to Company)
    """

    class Theme(models.TextChoices):
        LIGHT = "light", "Light"
        DARK = "dark", "Dark"

    class Role(models.TextChoices):
        CLIENT = "client", "Client"
        EMPLOYEE = "employee", "Employee"
        COMPANY_ADMIN = "company_admin", "Company admin"
        SYSTEM_ADMIN = "system_admin", "System admin"

    class Language(models.TextChoices):
        LV = "lv", "Latviešu"
        EN = "en", "English"

    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)  # Konta foto
    theme = models.CharField(max_length=20, choices=Theme.choices, default=Theme.LIGHT)  # Tēma
    is_blocked = models.BooleanField(default=False)  # Vai ir bloķēts
    role = models.CharField(max_length=20, choices=Role.choices)  # Loma
    language = models.CharField(max_length=2, choices=Language.choices, default=Language.LV)  # Valoda

    # Uzņēmuma identifikators – FK to Company
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
    )

    def __str__(self):
        return self.username
