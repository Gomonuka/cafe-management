from django.db.models import Q
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import PermissionDenied, NotFound

from apps.accounts.models import User
from .models import Company
from .serializers import (
    CompanyPublicSerializer,
    CompanyAdminListSerializer,
    CompanyDetailSerializer,
    CompanyCreateUpdateSerializer,
)
from .permissions import IsSystemAdmin, IsCompanyAdmin
from .utils import parse_working_hours

def client_visible_queryset():
    # Klientam redzami tikai: aktīvi, nebloķēti, nav soft-delete
    return Company.objects.filter(deleted_at__isnull=True, is_active=True, is_blocked=False)


class CompanyListView(APIView):
    """
    COMP_001: skatīt uzņēmumu sarakstu
    COMP_008: kārtot pēc nosaukuma (A-Ž / Ž-A)
    COMP_009: meklēt pēc nosaukuma
    """
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user

        # Sistēma nosaka lietotāja lomu
        if user.is_authenticated and user.role == User.Role.SYSTEM_ADMIN:
            # SA redz visus (izņemot soft-delete pēc noklusējuma var rādīt vai nerādīt; te nerādām dzēstos)
            qs = Company.objects.filter(deleted_at__isnull=True)

            data = CompanyAdminListSerializer(qs.order_by("id"), many=True).data
            return Response(data, status=status.HTTP_200_OK)

        # Klients (vai viesis) redz publiski pieejamos uzņēmumus + tikai "atvērtos"
        qs = client_visible_queryset()

        # COMP_009: meklēšana (meklēšanas frāze līdz 255)
        search = request.query_params.get("search")
        if search:
            if len(search) > 255:
                return Response({"detail": "Meklēšanas frāze nedrīkst pārsniegt 255 simbolus."},
                                status=status.HTTP_400_BAD_REQUEST)
            qs = qs.filter(name__icontains=search)

        # COMP_008: kārtošana pēc nosaukuma (A-Ž vai Ž-A)
        sort = request.query_params.get("sort")  # "asc" vai "desc"
        if sort == "desc":
            qs = qs.order_by("-name")
        else:
            qs = qs.order_by("name")

        # “Atvērts” filtrs: atstājam tikai tos, kas šobrīd atvērti
        # (prasība: aktīvs + nebloķēts + atvērts)
        qs = [c for c in qs if c.is_open_now()]

        if (search or request.query_params.get("city")) and len(qs) == 0:
            # P_006: nav atrasts neviens uzņēmums pēc filtra/meklēšanas
            return Response({"code": "P_006", "detail": "Nav atrasts neviens uzņēmums."}, status=status.HTTP_200_OK)

        return Response(CompanyPublicSerializer(qs, many=True).data, status=status.HTTP_200_OK)


class CompanyCitiesView(APIView):
    """
    COMP_002: izgūst pieejamo pilsētu sarakstu filtram
    """
    permission_classes = [AllowAny]

    def get(self, request):
        qs = client_visible_queryset().values_list("city", flat=True).distinct().order_by("city")
        city = request.query_params.get("city")
        if city:
            qs = qs.filter(city=city)
        return Response({"cities": list(qs)}, status=status.HTTP_200_OK)

class CompanyListFilteredView(APIView):
    """
    COMP_002: filtrēt pēc pilsētas
    (Atskaitot bloķētos/neaktīvos/soft-deleted un “slēgtos” uzņēmumus)
    """
    permission_classes = [AllowAny]

    def get(self, request):
        city = request.query_params.get("city")
        qs = client_visible_queryset()

        if city:
            qs = qs.filter(city=city)

        # “Atvērts” filtrs
        qs = [c for c in qs if c.is_open_now()]

        if city and len(qs) == 0:
            return Response({"code": "P_006", "detail": "Nav atrasts neviens uzņēmums."}, status=status.HTTP_200_OK)

        return Response(CompanyPublicSerializer(qs, many=True).data, status=status.HTTP_200_OK)


class CompanyDetailView(APIView):
    """
    COMP_003: detalizēta informācija
    - Klients redz tikai publiski pieejamu (aktīvs, nebloķēts) uzņēmumu
    - UA redz tikai savu uzņēmumu (pēc user.company_id)
    """
    permission_classes = [AllowAny]

    def get(self, request, company_id: int):
        user = request.user

        if user.is_authenticated and user.role == User.Role.COMPANY_ADMIN:
            # UA drīkst skatīt tikai savu uzņēmumu
            if not user.company_id or user.company_id != company_id:
                raise PermissionDenied("Piekļuve ir liegta.")
            company = Company.objects.filter(id=company_id, deleted_at__isnull=True).first()
            if not company:
                raise NotFound("Uzņēmums nav atrasts.")
            return Response(CompanyDetailSerializer(company).data, status=status.HTTP_200_OK)

        # Klients/viesis: tikai publiski pieejams
        company = client_visible_queryset().filter(id=company_id).first()
        if not company:
            raise PermissionDenied("Uzņēmuma profils nav pieejams publiskai apskatei.")
        return Response(CompanyDetailSerializer(company).data, status=status.HTTP_200_OK)


class CompanyCreateView(APIView):
    """
    COMP_004: izveidot uzņēmumu
    - tikai UA
    - tikai, ja UA vēl nav uzņēmuma
    - darba laiki obligāti (7 dienas)
    - logo obligāts
    """
    permission_classes = [IsAuthenticated, IsCompanyAdmin]

    def post(self, request):
        user: User = request.user

        if user.company_id is not None:
            raise PermissionDenied("Uzņēmuma profils jau ir izveidots.")

        # Parsē darba laikus no FormData (ja nepieciešams)
        data = request.data.copy()
        data["working_hours"] = parse_working_hours(data)

        s = CompanyCreateUpdateSerializer(data=data)
        s.is_valid(raise_exception=True)
        company = s.save()

        # piesaiste UA -> Company
        user.company = company
        user.save(update_fields=["company_id"])

        return Response(
            {"code": "P_001", "detail": "Uzņēmums ir veiksmīgi izveidots.", "company_id": company.id},
            status=status.HTTP_201_CREATED,
        )


class CompanyUpdateView(APIView):
    """
    COMP_005: rediģēt uzņēmumu
    - tikai UA savam uzņēmumam
    - darba laiki obligāti (7 dienas)
    - logo: ja augšupielādē, jābūt derīgam; (lauki pēc serializer)
    """
    permission_classes = [IsAuthenticated, IsCompanyAdmin]

    def put(self, request):
        user: User = request.user
        if not user.company_id:
            raise NotFound("Uzņēmums nav atrasts.")

        company = Company.objects.filter(id=user.company_id, deleted_at__isnull=True).first()
        if not company:
            raise NotFound("Uzņēmums nav atrasts.")

        data = request.data.copy()

        # Darba laiki ir obligāti arī rediģējot (pēc prasības)
        data["working_hours"] = parse_working_hours(data)

        s = CompanyCreateUpdateSerializer(instance=company, data=data)
        s.is_valid(raise_exception=True)
        s.save()

        return Response(
            {"code": "P_002", "detail": "Uzņēmuma profils ir veiksmīgi atjaunināts."},
            status=status.HTTP_200_OK,
        )


class CompanySoftDeleteMyView(APIView):
    """
    COMP_006: dzēst savu uzņēmumu (soft-delete)
    - tikai UA savam uzņēmumam
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
        return Response({"code": "P_004", "detail": "Uzņēmuma profils ir deaktivizēts (soft-delete)."},
                        status=status.HTTP_200_OK)


class CompanyDeactivateMyView(APIView):
    """
    COMP_011: deaktivizēt savu uzņēmumu
    - tikai UA
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

        return Response({"code": "P_017", "detail": "Uzņēmums ir deaktivizēts."},
                        status=status.HTTP_200_OK)


class AdminCompanySoftDeleteView(APIView):
    """
    COMP_007: SA dzēš uzņēmumu (soft-delete)
    """
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    def post(self, request, company_id: int):
        company = Company.objects.filter(id=company_id, deleted_at__isnull=True).first()
        if not company:
            raise NotFound("Uzņēmums nav atrasts.")

        company.soft_delete()
        return Response({"code": "P_004", "detail": "Uzņēmums ir dzēsts (soft-delete)."},
                        status=status.HTTP_200_OK)


class AdminCompanyBlockView(APIView):
    """
    COMP_010: SA bloķē uzņēmumu
    """
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    def post(self, request, company_id: int):
        company = Company.objects.filter(id=company_id, deleted_at__isnull=True).first()
        if not company:
            raise NotFound("Uzņēmums nav atrasts.")

        company.is_blocked = True
        company.save(update_fields=["is_blocked"])

        return Response({"code": "P_018", "detail": "Uzņēmums ir bloķēts."},
                        status=status.HTTP_200_OK)
