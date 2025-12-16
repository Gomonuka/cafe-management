import os
from django.conf import settings


def send_password_reset_email(to_email: str, reset_link: str) -> None:
    """
    Отправка письма о сбросе пароля.
    Можно подключить Brevo здесь. Сейчас сделано так, чтобы:
      - в dev печатать ссылку в консоль
      - в prod дернуть Brevo API
    """

    brevo_enabled = getattr(settings, "BREVO_ENABLED", False)

    if not brevo_enabled:
        print("\n=== PASSWORD RESET LINK ===")
        print(f"To: {to_email}")
        print(reset_link)
        print("===========================\n")
        return

    # TODO: сюда вставь свою интеграцию с Brevo
    # Например: brevo_send_email(to_email, subject, html_content)
    # Я не знаю твой текущий код, поэтому оставляю явный хук.
    raise NotImplementedError("Brevo integration is enabled, but send logic is not implemented here.")
