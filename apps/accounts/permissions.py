from typing import Iterable

from rest_framework.permissions import BasePermission, SAFE_METHODS

# Palīgfunkcija: pārbauda, vai lietotājs ir autentificēts un viņa loma ir vienāda ar kādu no sistēmas lomām.
def user_has_role(user, roles: Iterable[str]) -> bool:
    return bool(user.is_authenticated and getattr(user, "role", None) in roles)

# Bāzes permissions
class IsAnonymousUser(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return not user or user.is_anonymous

class IsAuthenticatedAndNotBlocked(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if hasattr(user, "is_blocked") and user.is_blocked:
            return False
        return True

# Lomu atļaujas (klients/darbinieks/uzņēmuma administrators/sistēmas administrators)
class IsClient(BasePermission):
    def has_permission(self, request, view):
        return user_has_role(request.user, ["client"])

class IsEmployee(BasePermission):
    def has_permission(self, request, view):
        return user_has_role(request.user, ["employee"])


class IsCompanyAdmin(BasePermission):
    def has_permission(self, request, view):
        return user_has_role(request.user, ["company_admin"])


class IsSystemAdmin(BasePermission):
    def has_permission(self, request, view):
        return user_has_role(request.user, ["system_admin"])


class IsCompanyUser(BasePermission):
    def has_permission(self, request, view):
        return user_has_role(request.user, ["employee", "company_admin"])


class IsCompanyAdminOrSystemAdmin(BasePermission):
    def has_permission(self, request, view):
        return user_has_role(request.user, ["company_admin", "system_admin"])


class IsCompanyStaffOrSystemAdmin(BasePermission):
    def has_permission(self, request, view):
        return user_has_role(request.user, ["employee", "company_admin", "system_admin"])


class ReadOnlyCompanyAdminOrSystemAdmin(BasePermission):
    """
    Safe methods: company admins and system admins.
    Write: only system admins.
    """

    def has_permission(self, request, view):
        user = request.user
        if request.method in SAFE_METHODS:
            return user_has_role(user, ["company_admin", "system_admin"])
        return user_has_role(user, ["system_admin"])

# Objekta līmeņa atļaujas priekš modeļiem ar .company
class IsObjectOfUserCompanyOrSystemAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user

        # Sistēmas administratoram ir pilna piekļuve
        if user_has_role(user, ["system_admin"]):
            return True

        # ja objekts nav piesaistīts uzņēmumam, tad nevar darīt darbību
        if not hasattr(obj, "company_id"):
            return False

        # Uzņēmuma administrators/darbinieks tikai sava uzņēmuma objekti
        if user_has_role(user, ["company_admin", "employee"]):
            return getattr(user, "company_id", None) == getattr(obj, "company_id", None)

        return False

# Šabloni "read-only visiem, rakstīt tikai sistēmas administratoriem"
class ReadOnlyOrSystemAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user

        if request.method in SAFE_METHODS:
            return bool(
                user.is_authenticated and not getattr(user, "is_blocked", False)
            )

        return user_has_role(user, ["system_admin"])


class ReadOnlyOrCompanyOrSystemAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user

        if request.method in SAFE_METHODS:
            return bool(
                user.is_authenticated and not getattr(user, "is_blocked", False)
            )

        return user_has_role(user, ["company_admin", "system_admin"])
