# apps/accounts/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from .managers import UserManager

MAX_FILE_SIZE = 50 * 1024 * 1024 # 50 MB

def user_photo_path(instance, filename: str) -> str:
    return f"users/{instance.id}/{filename}"

def validate_image_file(file_obj):
    if file_obj.size > MAX_FILE_SIZE:
        raise ValidationError("Faila izmērs nedrīkst pārsniegt 50 MB.")
    ct = getattr(file_obj, "content_type", None)
    if ct and ct not in {"image/jpeg", "image/png"}:
        raise ValidationError("Atļautie faila formati: JPG, PNG.")

class User(AbstractUser):
    objects = UserManager()

    class Role(models.TextChoices):
        CLIENT = "client", "Client"
        EMPLOYEE = "employee", "Employee"
        COMPANY_ADMIN = "company_admin", "Company admin"
        SYSTEM_ADMIN = "system_admin", "System admin"

    avatar = models.ImageField(
        upload_to=user_photo_path,
        null=True,
        blank=True,
        validators=[validate_image_file],
    )
    is_blocked = models.BooleanField(default=False)
    role = models.CharField(max_length=20, choices=Role.choices)
    email = models.EmailField(unique=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
    )

    secret_question = models.ForeignKey(
        "accounts.SecretQuestion",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="users",
    )
    secret_answer = models.CharField(max_length=255, blank=True, default="")
    profile_completed = models.BooleanField(default=False)

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.is_active = False
        self.save(update_fields=["deleted_at", "is_active"])

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

class SecretQuestion(models.Model):
    text = models.CharField(max_length=255, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now, editable=False)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.text
