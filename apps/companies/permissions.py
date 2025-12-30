from rest_framework.permissions import BasePermission
from apps.accounts.models import User

class IsSystemAdmin(BasePermission):
    # Tikai SA
    def has_permission(self, request, view):
        return bool(request.user.is_authenticated and request.user.role == User.Role.SYSTEM_ADMIN)

class IsCompanyAdmin(BasePermission):
    # Tikai UA
    def has_permission(self, request, view):
        return bool(request.user.is_authenticated and request.user.role == User.Role.COMPANY_ADMIN)
