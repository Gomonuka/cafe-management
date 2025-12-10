from django.db import models
from django.conf import settings


class EmailTemplate(models.Model):
    """
    Entitātes E-pasta šablons (EmailTemplate) atribūti:
    1) Kods - code
    2) Tēma - subject
    3) Saturs - body
    4) Vai ir aktīvs - is_active
    5) Izveidoja lietotājs - created_by (FK to User)
    """

    code = models.CharField(max_length=100, unique=True)  # Kods
    subject = models.CharField(max_length=255)  # Tēma
    body = models.TextField()  # Saturs
    is_active = models.BooleanField(default=True)  # Vai ir aktīvs
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_email_templates",
    )  # Izveidoja lietotājs

    def __str__(self):
        return self.code


class EmailLog(models.Model):
    """
    Entitātes E-pastu žurnāls (EmailLog) atribūti:
    1) Tēma - subject
    2) Adresāts - recipient
    3) Izveidošanās laiks - created_at
    4) Nosūtīšanas laiks - sent_at
    5) Statuss - status
    6) Saņem lietotājs - receiver_user (FK to User)
    """

    template = models.ForeignKey(
        EmailTemplate,
        on_delete=models.SET_NULL,
        null=True,
        related_name="logs",
    )  # Tiek izmantots
    subject = models.CharField(max_length=255)  # Tēma
    recipient = models.EmailField()  # Adresāts
    created_at = models.DateTimeField(auto_now_add=True)  # Izveidošanās laiks
    sent_at = models.DateTimeField(null=True, blank=True)  # Nosūtīšanas laiks
    status = models.CharField(max_length=50)  # Statuss
    receiver_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="received_emails",
    )  # Saņem → Lietotājs

    def __str__(self):
        return f"{self.recipient} - {self.subject}"
