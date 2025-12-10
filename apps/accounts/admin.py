from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        (
            "Papildu informācija",
            {
                "fields": (
                    "avatar",
                    "theme",
                    "is_blocked",
                    "role",
                    "language",
                    "company",
                )
            },
        ),
    )

    list_display = (
        "username",
        "email",
        "role",
        "company",
        "is_blocked",
        "is_staff",
        "is_superuser",
    )
    list_filter = ("role", "company", "is_blocked", "language")
    search_fields = ("username", "email")
