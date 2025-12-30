from rest_framework.permissions import BasePermission
from apps.accounts.models import User


class IsCompanyAdmin(BasePermission):
    # Tikai uzņēmuma administrators (UA)
    def has_permission(self, request, view):
        return bool(request.user.is_authenticated and request.user.role == User.Role.COMPANY_ADMIN)
