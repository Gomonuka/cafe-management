# apps/companies/permissions.py
from rest_framework.permissions import BasePermission
from apps.accounts.models import User

class IsSystemAdmin(BasePermission):
    # Tikai sistēmas administrators
    def has_permission(self, request, view):
        return bool(request.user.is_authenticated and request.user.role == User.Role.SYSTEM_ADMIN)

class IsCompanyAdmin(BasePermission):
    # Tikai uzņēmuma administrators
    def has_permission(self, request, view):
        return bool(request.user.is_authenticated and request.user.role == User.Role.COMPANY_ADMIN)
