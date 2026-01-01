def send_email_from_template(*, template_code: str, to_email: str, context: dict, company_id=None):
    """
    Placeholder notification sender. Real email delivery removed.
    """
    print(f"[NOTIFICATIONS DISABLED] template={template_code} to={to_email} context={context} company={company_id}")
    return None
