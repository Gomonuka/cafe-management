from django.contrib import admin
from .models import EmailTemplate, EmailLog


@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ("code", "subject", "is_active")
    list_filter = ("is_active",)
    search_fields = ("code", "subject")


@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display = (
        "recipient",
        "subject",
        "status",
        "created_at",
        "sent_at",
        "template",
        "receiver_user",
    )
    list_filter = ("status", "template", "created_at", "sent_at")
    search_fields = ("recipient", "subject")
