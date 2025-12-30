from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, NotFound

from apps.accounts.models import User
from .models import InventoryItem
from .permissions import IsCompanyStaff, IsCompanyAdmin
from .serializers import (
    InventoryListSerializer,
    InventoryCreateSerializer,
    InventoryUpdateAdminSerializer,
    InventoryUpdateEmployeeSerializer,
)


class InventoryListView(APIView):
    """
    INV_001: apskatīt noliktavas vienību sarakstu (UA/DA)
    """
    permission_classes = [IsAuthenticated, IsCompanyStaff]

    def get(self, request):
        user: User = request.user
        if not user.company_id:
            raise PermissionDenied("Lietotājam nav uzņēmuma.")

        qs = InventoryItem.objects.filter(company_id=user.company_id).order_by("name")
        if qs.count() == 0:
            return Response({"code": "P_006", "detail": "Noliktavā nav nevienas vienības."},
                            status=status.HTTP_200_OK)

        return Response(InventoryListSerializer(qs, many=True).data, status=status.HTTP_200_OK)


class InventoryCreateView(APIView):
    """
    INV_002: pievienot jaunu noliktavas vienību (UA)
    """
    permission_classes = [IsAuthenticated, IsCompanyAdmin]

    def post(self, request):
        user: User = request.user
        if not user.company_id:
            raise PermissionDenied("Administratoram nav piesaistīts uzņēmums.")

        s = InventoryCreateSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        InventoryItem.objects.create(company_id=user.company_id, **s.validated_data)
        return Response({"code": "P_001", "detail": "Noliktavas vienība ir izveidota."},
                        status=status.HTTP_201_CREATED)


class InventoryUpdateView(APIView):
    """
    INV_003: rediģēt noliktavas vienību (UA/DA)
    - UA: name + quantity + unit
    - DA: tikai quantity
    """
    permission_classes = [IsAuthenticated, IsCompanyStaff]

    def put(self, request, item_id: int):
        user: User = request.user
        if not user.company_id:
            raise PermissionDenied("Lietotājam nav uzņēmuma.")

        item = InventoryItem.objects.filter(id=item_id, company_id=user.company_id).first()
        if not item:
            raise NotFound("Noliktavas vienība nav atrasta.")

        # Nosaka atļautos laukus pēc lomas
        if user.role == User.Role.COMPANY_ADMIN:
            s = InventoryUpdateAdminSerializer(instance=item, data=request.data)
        else:
            # Darbiniekam atļauts mainīt tikai daudzumu
            s = InventoryUpdateEmployeeSerializer(instance=item, data=request.data)

        s.is_valid(raise_exception=True)
        s.save()

        return Response({"code": "P_002", "detail": "Noliktavas vienība ir atjaunināta."},
                        status=status.HTTP_200_OK)


class InventoryDeleteView(APIView):
    """
    INV_004: dzēst noliktavas vienību (UA)
    """
    permission_classes = [IsAuthenticated, IsCompanyAdmin]

    def post(self, request, item_id: int):
        user: User = request.user
        if not user.company_id:
            raise PermissionDenied("Administratoram nav piesaistīts uzņēmums.")

        item = InventoryItem.objects.filter(id=item_id, company_id=user.company_id).first()
        if not item:
            raise NotFound("Noliktavas vienība nav atrasta.")

        item.delete()
        return Response({"code": "P_004", "detail": "Noliktavas vienība ir dzēsta."},
                        status=status.HTTP_200_OK)
