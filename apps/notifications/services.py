import re
import requests
from django.conf import settings
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import EmailTemplate, EmailLog


_VAR_RE = re.compile(r"{{\s*([a-zA-Z0-9_\.]+)\s*}}")


def render_template(text: str, context: dict) -> str:
    """
    Aizvieto {{mainīgos}} ar vērtībām no context.
    Atbalsta arī punktu ceļus piem., {{order.id}} ja context satur dictus.
    """
    def resolve(path: str):
        parts = path.split(".")
        cur = context
        for p in parts:
            if isinstance(cur, dict) and p in cur:
                cur = cur[p]
            else:
                return ""  # ja nav atrasts, aizvieto ar tukšu
        return str(cur)

    return _VAR_RE.sub(lambda m: resolve(m.group(1)), text)


def brevo_send_email(to_email: str, subject: str, html_or_text: str):
    """
    Nosūta e-pastu caur Brevo API.
    Ja neizdodas - izmet kļūdu.
    """
    if not settings.BREVO_API_KEY:
        raise ValidationError("BREVO_API_KEY nav konfigurēts.")

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "api-key": settings.BREVO_API_KEY,
        "Content-Type": "application/json",
        "accept": "application/json",
    }

    payload = {
        "sender": {"email": settings.BREVO_SENDER_EMAIL, "name": settings.BREVO_SENDER_NAME},
        "to": [{"email": to_email}],
        "subject": subject,
        # Brevo ļauj gan htmlContent, gan textContent. Te sūtām kā HTML (var būt arī plain text).
        "htmlContent": html_or_text,
    }

    r = requests.post(url, json=payload, headers=headers, timeout=15)
    if r.status_code >= 400:
        raise ValidationError(f"Brevo kļūda: {r.status_code} {r.text}")


def send_email_from_template(
    *,
    template_code: str,
    to_email: str,
    context: dict,
    company_id=None,
) -> EmailLog | None:
    """
    Izvēlas šablonu pēc koda, pārbauda active, renderē un sūta.
    Izveido žurnālu: created -> sent/failed.
    """
    tpl = EmailTemplate.objects.filter(code=template_code).first()
    if not tpl or not tpl.is_active:
        # Ja šablons nav aktīvs - neko nesūtam (prasība: pārbaudīt active)
        return None

    subject = render_template(tpl.subject, context)[:255]
    content = render_template(tpl.content, context)[:5000]

    log = EmailLog.objects.create(
        company_id=company_id,
        recipient=to_email,
        subject=subject,
        status=EmailLog.Status.CREATED,
    )

    try:
        brevo_send_email(to_email, subject, content)
        log.status = EmailLog.Status.SENT
        log.sent_at = timezone.now()
        log.save(update_fields=["status", "sent_at"])
    except Exception as e:
        log.status = EmailLog.Status.FAILED
        log.error_message = str(e)[:1000]
        log.save(update_fields=["status", "error_message"])
        # Šeit metām kļūdu tikai reset gadījumā (NOTIF_008), pārējos var ignorēt
        # Tāpēc šeit nemetam ārā - caller izlems.
    return log
