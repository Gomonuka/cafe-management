from rest_framework.permissions import BasePermission
from apps.accounts.models import User


class IsCompanyStaff(BasePermission):
    # Uzņēmuma administrators vai darbinieks
    def has_permission(self, request, view):
        return bool(
            request.user.is_authenticated
            and request.user.role in {User.Role.COMPANY_ADMIN, User.Role.EMPLOYEE}
        )


class IsCompanyAdmin(BasePermission):
    # Tikai uzņēmuma administrators
    def has_permission(self, request, view):
        return bool(request.user.is_authenticated and request.user.role == User.Role.COMPANY_ADMIN)
