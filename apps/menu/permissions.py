# apps/menu/permissions.py
from rest_framework.permissions import BasePermission
from apps.accounts.models import User

def _company_is_active(user: User) -> bool:
    company = getattr(user, "company", None)
    if not company:
        return False
    return company.deleted_at is None and company.is_active and not company.is_blocked

class IsCompanyAdmin(BasePermission):
    # Tikai uzņēmuma administrators ar aktīvu, neblokētu uzņēmumu
    message = "Uzņēmums nav aktīvs vai ir bloķēts."

    def has_permission(self, request, view):
        return bool(
            request.user.is_authenticated
            and request.user.role == User.Role.COMPANY_ADMIN
            and _company_is_active(request.user)
        )
