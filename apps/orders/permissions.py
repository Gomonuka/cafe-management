# apps/orders/permissions.py
from rest_framework.permissions import BasePermission
from apps.accounts.models import User

class IsClient(BasePermission):
    # Tikai klients (KL)
    def has_permission(self, request, view):
        return bool(request.user.is_authenticated and request.user.role == User.Role.CLIENT)

class IsCompanyStaff(BasePermission):
    # Uzņēmuma administrators vai darbinieks (UA vai DA)
    def has_permission(self, request, view):
        return bool(
            request.user.is_authenticated
            and request.user.role in {User.Role.COMPANY_ADMIN, User.Role.EMPLOYEE}
        )
