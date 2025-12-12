from django.contrib.auth import get_user_model
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from .serializers import UserSerializer
from .permissions import (
    IsAnonymousUser,
    IsAuthenticatedAndNotBlocked,
    IsCompanyAdmin,
    IsSystemAdmin,
    IsCompanyAdminOrSystemAdmin,
    user_has_role,
)
from apps.notifications.services import send_templated_email

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """
    User management:
        System admin:
          - can see all users
          - can block/delete any profile

        Company admin:
          - sees only their employees (role='employee' in their company)
          - can create/edit/delete only their employees
    """

    serializer_class = UserSerializer
    queryset = User.objects.all()

    def get_permissions(self):
        user = self.request.user

        if self.action == "create":
            # Self-registration for clients or company admins
            if not user or not user.is_authenticated:
                return [IsAnonymousUser()]
            return [IsAuthenticatedAndNotBlocked(), IsCompanyAdminOrSystemAdmin()]

        if user_has_role(user, ["system_admin"]):
            return [IsAuthenticatedAndNotBlocked(), IsSystemAdmin()]

        if user_has_role(user, ["company_admin"]):
            return [IsAuthenticatedAndNotBlocked(), IsCompanyAdmin()]

        return [IsAuthenticatedAndNotBlocked(), IsSystemAdmin()]

    def get_queryset(self):
        user = self.request.user
        qs = User.objects.all()

        search = self.request.query_params.get("search")

        if user_has_role(user, ["system_admin"]):
            if search:
                qs = qs.filter(username__icontains=search)
            return qs

        if user_has_role(user, ["company_admin"]):
            qs = qs.filter(company=user.company, role="employee")
            if search:
                qs = qs.filter(username__icontains=search)
            return qs

        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user

        # Anonymous users: only client or company admin registration
        if not user or not user.is_authenticated:
            role = serializer.validated_data.get("role") or "client"
            if role not in ("client", "company_admin"):
                raise PermissionDenied(
                    "Only client or company admin registration is allowed."
                )
            instance = serializer.save(role=role)
            if instance.email:
                send_templated_email(
                    code="user_registered",
                    to_email=instance.email,
                    context={"username": instance.username, "role": instance.role},
                    receiver_user=instance,
                )
            return

        if user_has_role(user, ["company_admin"]):
            serializer.save(company=user.company, role="employee")
            return

        if user_has_role(user, ["system_admin"]):
            instance = serializer.save()
            if instance.email:
                send_templated_email(
                    code="user_created",
                    to_email=instance.email,
                    context={"username": instance.username, "role": instance.role},
                    receiver_user=instance,
                )
            return

        raise PermissionDenied("You are not allowed to create users.")

    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()

        if user_has_role(user, ["system_admin"]):
            serializer.save()
            return

        if user_has_role(user, ["company_admin"]):
            if instance.role != "employee" or instance.company_id != user.company_id:
                raise PermissionDenied("You can manage only your company employees.")
            serializer.save(company=user.company, role="employee")
            return

        raise PermissionDenied("You are not allowed to update this user.")

    def perform_destroy(self, instance):
        user = self.request.user

        if user_has_role(user, ["system_admin"]):
            return super().perform_destroy(instance)

        if user_has_role(user, ["company_admin"]):
            if instance.role != "employee" or instance.company_id != user.company_id:
                raise PermissionDenied("You can delete only your company employees.")
            return super().perform_destroy(instance)

        raise PermissionDenied("You are not allowed to delete this user.")
