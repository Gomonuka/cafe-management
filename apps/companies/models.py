# apps/companies/models.py
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def company_logo_path(instance, filename: str) -> str:
    return f"companies/{instance.id}/{filename}"

def validate_image_file(file_obj):
    # Validē attēla failu (jpg/png) un izmēru (<=50MB)
    if file_obj.size > MAX_FILE_SIZE:
        raise ValidationError("Fails ir pārāk liels. Maksimālais izmērs ir 50MB.")
    ct = getattr(file_obj, "content_type", None)
    if ct and ct not in {"image/jpeg", "image/png"}:
        raise ValidationError("Atļauti tikai JPG un PNG attēli.")

class Company(models.Model):
    # Uzņēmuma pamatdati
    name = models.CharField(max_length=255)
    email = models.EmailField(max_length=255)
    phone = models.CharField(max_length=50)
    country = models.CharField(max_length=255)
    city = models.CharField(max_length=255)
    address_line1 = models.CharField(max_length=255)
    description = models.TextField(max_length=1000)

    # Logotips ir obligāts (COMP_004)
    logo = models.ImageField(upload_to=company_logo_path, validators=[validate_image_file], null=True, blank=True)

    # Statusi:
    # is_active = aktīvs/neaktīvs (COMP_011)
    # is_blocked = bloķēts (COMP_010)
    # deleted_at = soft-delete (COMP_006/COMP_007)
    is_active = models.BooleanField(default=True)
    is_blocked = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(default=timezone.now, editable=False)

    def soft_delete(self):
        # Soft-delete: atzīmē kā dzēstu un iestata neaktīvu
        self.deleted_at = timezone.now()
        self.is_active = False
        self.save(update_fields=["deleted_at", "is_active"])

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

    def is_open_now(self) -> bool:
        # Darba laiki vairs netiek izmantoti; atvērtība = aktīvs un nebloķēts
        return self.is_active and not self.is_blocked

    def __str__(self):
        return self.name
