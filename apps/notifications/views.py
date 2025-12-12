from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from apps.accounts.permissions import (
    IsAuthenticatedAndNotBlocked,
    IsSystemAdmin,
    ReadOnlyCompanyAdminOrSystemAdmin,
    user_has_role,
)
from .models import EmailTemplate, EmailLog
from .serializers import EmailTemplateSerializer, EmailLogSerializer


class EmailTemplateViewSet(viewsets.ModelViewSet):
    """
    System notifications: only system admins can manage templates.
    """

    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer
    permission_classes = [IsAuthenticatedAndNotBlocked, IsSystemAdmin]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(created_by=self.request.user)


class EmailLogViewSet(viewsets.ModelViewSet):
    """
    Email logs:
      - system admins: full access
      - company admins: read-only, scoped to their company recipients
    """

    queryset = EmailLog.objects.all()
    serializer_class = EmailLogSerializer
    permission_classes = [IsAuthenticatedAndNotBlocked, ReadOnlyCompanyAdminOrSystemAdmin]

    def get_queryset(self):
        user = self.request.user
        qs = EmailLog.objects.select_related("receiver_user", "receiver_user__company")

        if user_has_role(user, ["system_admin"]):
            return qs

        if user_has_role(user, ["company_admin"]):
            return qs.filter(receiver_user__company=user.company)

        return qs.none()

    def perform_create(self, serializer):
        if not user_has_role(self.request.user, ["system_admin"]):
            raise PermissionDenied("Only system admins can create email logs.")
        serializer.save()

    def perform_update(self, serializer):
        if not user_has_role(self.request.user, ["system_admin"]):
            raise PermissionDenied("Only system admins can update email logs.")
        serializer.save()

    def perform_destroy(self, instance):
        if not user_has_role(self.request.user, ["system_admin"]):
            raise PermissionDenied("Only system admins can delete email logs.")
        return super().perform_destroy(instance)
