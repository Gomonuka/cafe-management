from django.db import models
from django.utils import timezone

class EmailTemplate(models.Model):
    # Sistēmas e-pasta šablons
    code = models.CharField(max_length=100, unique=True)  # piem., ORDER_STATUS_CHANGED
    subject = models.CharField(max_length=255)
    content = models.TextField(max_length=5000, blank=True, default="") # HTML vai teksts ar {{mainīgajiem}}
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(default=timezone.now, editable=False)

    class Meta:
        ordering = ["code"]

    def __str__(self):
        return self.code


class EmailLog(models.Model):
    class Status(models.TextChoices):
        CREATED = "created", "created"
        SENT = "sent", "sent"
        FAILED = "failed", "failed"

    # Žurnāla ieraksts par nosūtīšanu
    company = models.ForeignKey("companies.Company", null=True, blank=True, on_delete=models.SET_NULL, related_name="email_logs")
    recipient = models.EmailField(max_length=255)
    subject = models.CharField(max_length=255)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.CREATED)

    error_message = models.CharField(max_length=1000, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
