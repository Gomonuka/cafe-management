from django.db.models import Q
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from apps.accounts.models import User
from .models import Company
from .permissions import IsCompanyAdmin, IsSystemAdmin
from .serializers import (
    CompanyAdminListSerializer,
    CompanyCreateUpdateSerializer,
    CompanyDetailSerializer,
    CompanyPublicSerializer,
)


def client_visible_queryset():
    """Publiski redzami uzņēmumi: aktīvi, nebloķēti, nav soft-delete."""
    return Company.objects.filter(
        deleted_at__isnull=True,
        is_active=True,
        is_blocked=False,
    )


class CompanyListView(APIView):
    """
    COMP_001/008/009: saraksts, kārtošana un meklēšana.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user

        # Sistēmas administrators redz visus (izņemot soft‑delete)
        if user.is_authenticated and user.role == User.Role.SYSTEM_ADMIN:
            qs = Company.objects.filter(deleted_at__isnull=True).order_by("id")
            data = CompanyAdminListSerializer(qs, many=True, context={"request": request}).data
            return Response(data, status=status.HTTP_200_OK)

        # Klients/viesis redz tikai publiski pieejamos
        qs = client_visible_queryset()

        city = request.query_params.get("city")
        if city:
            qs = qs.filter(city=city)

        search = request.query_params.get("search")
        if search:
            if len(search) > 255:
                return Response(
                    {"detail": "Meklēšanas frāze nedrīkst pārsniegt 255 simbolus."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            qs = qs.filter(name__icontains=search)

        sort = request.query_params.get("sort")
        qs = qs.order_by("-name" if sort == "desc" else "name")

        # Atstāj tikai atvērtos
        qs = [c for c in qs if c.is_open_now()]

        if (search or city) and len(qs) == 0:
            return Response({"detail": "Nav atrasts neviens uzņēmums."}, status=status.HTTP_200_OK)

        data = CompanyPublicSerializer(qs, many=True, context={"request": request}).data
        return Response(data, status=status.HTTP_200_OK)


class CompanyCitiesView(APIView):
    """
    COMP_002: pilsētu saraksts filtram.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        qs = client_visible_queryset().values_list("city", flat=True).distinct().order_by("city")
        return Response({"cities": list(qs)}, status=status.HTTP_200_OK)


class CompanyListFilteredView(APIView):
    """
    COMP_002: filtrēšana pēc pilsētas.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        city = request.query_params.get("city")
        qs = client_visible_queryset()

        if city:
            qs = qs.filter(city=city)

        qs = [c for c in qs if c.is_open_now()]

        if city and len(qs) == 0:
            return Response({"detail": "Nav atrasts neviens uzņēmums."}, status=status.HTTP_200_OK)

        data = CompanyPublicSerializer(qs, many=True, context={"request": request}).data
        return Response(data, status=status.HTTP_200_OK)


class CompanyDetailView(APIView):
    """
    COMP_003: detalizēta informācija.
    """

    permission_classes = [AllowAny]

    def get(self, request, company_id: int):
        user = request.user

        if user.is_authenticated and user.role == User.Role.COMPANY_ADMIN:
            if not user.company_id or user.company_id != company_id:
                raise PermissionDenied("Piekļuve liegta.")
            company = Company.objects.filter(id=company_id, deleted_at__isnull=True).first()
            if not company:
                raise NotFound("Uzņēmums nav atrasts.")
            data = CompanyDetailSerializer(company, context={"request": request}).data
            return Response(data, status=status.HTTP_200_OK)

        company = client_visible_queryset().filter(id=company_id).first()
        if not company:
            raise PermissionDenied("Uzņēmuma profils nav pieejams publiskai apskatei.")

        data = CompanyDetailSerializer(company, context={"request": request}).data
        return Response(data, status=status.HTTP_200_OK)


class CompanyCreateView(APIView):
    """
    COMP_004: izveidot uzņēmumu (tikai UA bez uzņēmuma).
    """

    # UA drīkst izveidot uzņēmumu arī tad, ja vēl nav company
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        user: User = request.user

        if user.role != User.Role.COMPANY_ADMIN:
            raise PermissionDenied("Piekļuve liegta.")

        if user.company_id is not None:
            raise PermissionDenied("Uzņēmuma profils jau ir izveidots.")

        serializer = CompanyCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        company = serializer.save()

        user.company = company
        user.save(update_fields=["company_id"])

        return Response(
            {"detail": "Uzņēmums ir veiksmīgi izveidots.", "company_id": company.id},
            status=status.HTTP_201_CREATED,
        )


class CompanyUpdateView(APIView):
    """
    COMP_005: rediģēt savu uzņēmumu.
    """

    permission_classes = [IsAuthenticated, IsCompanyAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def put(self, request):
        user: User = request.user
        if not user.company_id:
            raise NotFound("Uzņēmums nav atrasts.")

        company = Company.objects.filter(id=user.company_id, deleted_at__isnull=True).first()
        if not company:
            raise NotFound("Uzņēmums nav atrasts.")

        serializer = CompanyCreateUpdateSerializer(instance=company, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({"detail": "Uzņēmuma profils ir atjaunināts."}, status=status.HTTP_200_OK)


class CompanySoftDeleteMyView(APIView):
    """
    COMP_006: soft‑delete savam uzņēmumam.
    """

    permission_classes = [IsAuthenticated, IsCompanyAdmin]

    def post(self, request):
        user: User = request.user
        if not user.company_id:
            raise NotFound("Uzņēmums nav atrasts.")

        company = Company.objects.filter(id=user.company_id, deleted_at__isnull=True).first()
        if not company:
            raise NotFound("Uzņēmums nav atrasts.")

        company.soft_delete()
        for u in company.users.all():
            u.soft_delete()

        return Response({"detail": "Uzņēmuma profils ir dzēsts."}, status=status.HTTP_200_OK)


class CompanyDeactivateMyView(APIView):
    """
    COMP_011: deaktivizēt savu uzņēmumu.
    """

    permission_classes = [IsAuthenticated, IsCompanyAdmin]

    def post(self, request):
        user: User = request.user
        if not user.company_id:
            raise NotFound("Uzņēmums nav atrasts.")

        company = Company.objects.filter(id=user.company_id, deleted_at__isnull=True).first()
        if not company:
            raise NotFound("Uzņēmums nav atrasts.")

        company.is_active = False
        company.save(update_fields=["is_active"])

        return Response({"detail": "Uzņēmums ir deaktivizēts."}, status=status.HTTP_200_OK)


class AdminCompanySoftDeleteView(APIView):
    """
    COMP_007: SA soft‑delete uzņēmumam.
    """

    permission_classes = [IsAuthenticated, IsSystemAdmin]

    def post(self, request, company_id: int):
        company = Company.objects.filter(id=company_id, deleted_at__isnull=True).first()
        if not company:
            raise NotFound("Uzņēmums nav atrasts.")

        company.soft_delete()
        for u in company.users.all():
            u.soft_delete()

        return Response({"detail": "Uzņēmums ir dzēsts."}, status=status.HTTP_200_OK)


class AdminCompanyBlockView(APIView):
    """
    COMP_010: SA bloķē/atbloķē uzņēmumu.
    """

    permission_classes = [IsAuthenticated, IsSystemAdmin]

    def post(self, request, company_id: int):
        company = Company.objects.filter(id=company_id, deleted_at__isnull=True).first()
        if not company:
            raise NotFound("Uzņēmums nav atrasts.")

        company.is_blocked = not company.is_blocked
        company.save(update_fields=["is_blocked"])

        msg = "Uzņēmums ir bloķēts." if company.is_blocked else "Uzņēmums ir atbloķēts."
        return Response({"detail": msg, "is_blocked": company.is_blocked}, status=status.HTTP_200_OK)
