import json
import os
import http.client
from typing import Dict, Optional

from django.conf import settings
from django.utils import timezone
from django.core.mail import send_mail

from .models import EmailTemplate, EmailLog


def _render(text: str, context: Optional[Dict]) -> str:
    if not context:
        return text
    try:
        return text.format(**context)
    except Exception:
        return text


def _log_email(template, subject, recipient, status, receiver_user=None):
    EmailLog.objects.create(
        template=template,
        subject=subject,
        recipient=recipient,
        sent_at=timezone.now() if status == "sent" else None,
        status=status,
        receiver_user=receiver_user,
    )


def _send_via_brevo(subject: str, body: str, to_email: str) -> bool:
    api_key = os.getenv("BREVO_API_KEY")
    if not api_key:
        return False

    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", None) or to_email

    payload = {
        "sender": {"email": from_email},
        "to": [{"email": to_email}],
        "subject": subject,
        "textContent": body,
    }

    try:
        conn = http.client.HTTPSConnection("api.brevo.com")
        headers = {
            "api-key": api_key,
            "accept": "application/json",
            "content-type": "application/json",
        }
        conn.request("POST", "/v3/smtp/email", body=json.dumps(payload), headers=headers)
        resp = conn.getresponse()
        return 200 <= resp.status < 300
    except Exception:
        return False


def send_templated_email(
    code: str,
    to_email: str,
    context: Optional[Dict] = None,
    receiver_user=None,
) -> None:
    """
    Render template by code, try Brevo API, fallback to Django send_mail; always log.
    """
    if not to_email:
        return

    template = EmailTemplate.objects.filter(code=code, is_active=True).first()
    subject = template.subject if template else code
    body = template.body if template else ""

    subject = _render(subject, context)
    body = _render(body, context)

    sent = _send_via_brevo(subject, body, to_email)

    if not sent:
        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                recipient_list=[to_email],
                fail_silently=True,
            )
            sent = True
        except Exception:
            sent = False

    _log_email(template, subject, to_email, "sent" if sent else "failed", receiver_user)
