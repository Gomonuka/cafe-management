from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from .permissions import IsSystemAdmin
from .admin_serializers import AdminUserListSerializer


class AdminUserListView(generics.ListAPIView):
    # USER_008: visi lietotāji (neiekļauj soft-deleted)
    permission_classes = [IsAuthenticated, IsSystemAdmin]
    serializer_class = AdminUserListSerializer

    def get_queryset(self):
        return User.objects.all_with_deleted().filter(deleted_at__isnull=True, is_active=True)


class AdminUserSoftDeleteView(APIView):
    # USER_009: soft-delete lietotāju
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    def post(self, request, user_id: int):
        user = User.objects.all_with_deleted().filter(id=user_id).first()
        if not user or user.deleted_at is not None:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        user.soft_delete()
        return Response({"code": "P_004", "detail": "Lietotājs ir deaktivizēts."}, status=status.HTTP_200_OK)


class AdminUserBlockView(APIView):
    # USER_014: bloķēt/atbloķēt lietotāju (toggle)
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    def post(self, request, user_id: int):
        user = User.objects.all_with_deleted().filter(id=user_id, deleted_at__isnull=True).first()
        if not user:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        user.is_blocked = not user.is_blocked
        user.save(update_fields=["is_blocked"])
        msg = "Lietotājs ir bloķēts." if user.is_blocked else "Lietotājs ir atbloķēts."
        return Response({"code": "P_018", "detail": msg, "is_blocked": user.is_blocked}, status=status.HTTP_200_OK)
