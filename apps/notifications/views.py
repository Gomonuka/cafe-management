from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied

from apps.accounts.models import User
from .models import EmailTemplate, EmailLog
from .serializers import EmailTemplateSerializer, EmailLogListSerializer
from .permissions import IsSystemAdmin, IsCompanyAdmin


class AdminTemplateCreateView(APIView):
    """
    NOTIF_001: pievienot e-pasta šablonu (SA)
    """
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    def post(self, request):
        s = EmailTemplateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response({"code": "P_001", "detail": "Šablons ir izveidots."}, status=status.HTTP_201_CREATED)


class AdminTemplateListView(APIView):
    """
    NOTIF_002: apskatīt šablonus (SA)
    """
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    def get(self, request):
        qs = EmailTemplate.objects.all().order_by("code")
        if qs.count() == 0:
            return Response({"code": "P_006", "detail": "Nav neviena šablona."}, status=status.HTTP_200_OK)
        return Response(EmailTemplateSerializer(qs, many=True).data, status=status.HTTP_200_OK)


class AdminTemplateUpdateView(APIView):
    """
    NOTIF_003: rediģēt šablonu (SA)
    """
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    def put(self, request, template_id: int):
        tpl = EmailTemplate.objects.filter(id=template_id).first()
        if not tpl:
            raise NotFound("Šablons nav atrasts.")

        s = EmailTemplateSerializer(instance=tpl, data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response({"code": "P_002", "detail": "Šablons ir atjaunināts."}, status=status.HTTP_200_OK)


class AdminTemplateDeleteView(APIView):
    """
    NOTIF_004: dzēst šablonu (SA)
    """
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    def post(self, request, template_id: int):
        tpl = EmailTemplate.objects.filter(id=template_id).first()
        if not tpl:
            raise NotFound("Šablons nav atrasts.")

        tpl.delete()
        return Response({"code": "P_004", "detail": "Šablons ir dzēsts."}, status=status.HTTP_200_OK)


class CompanyEmailLogListView(APIView):
    """
    NOTIF_005: apskatīt nosūtīto e-pastu žurnālu (UA)
    """
    permission_classes = [IsAuthenticated, IsCompanyAdmin]

    def get(self, request):
        user: User = request.user
        if not user.company_id:
            raise PermissionDenied("Administratoram nav piesaistīts uzņēmums.")

        qs = EmailLog.objects.filter(company_id=user.company_id)
        if qs.count() == 0:
            return Response({"code": "P_006", "detail": "Žurnāls ir tukšs."}, status=status.HTTP_200_OK)

        return Response(EmailLogListSerializer(qs, many=True).data, status=status.HTTP_200_OK)
