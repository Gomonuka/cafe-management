from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, NotFound

from apps.accounts.models import User
from apps.companies.models import Company
from .models import MenuCategory, Product
from .serializers import (
    CategorySerializer,
    CategoryCreateUpdateSerializer,
    ProductCreateUpdateSerializer,
    MenuPublicSerializer,
    MenuAdminSerializer,
)
from .permissions import IsCompanyAdmin
from .utils import parse_recipe


def company_public_available(company_id: int) -> bool:
    # Klientam uzņēmumam jābūt aktīvam, nebloķētam un ne soft-deleted
    return Company.objects.filter(id=company_id, deleted_at__isnull=True, is_active=True, is_blocked=False).exists()


class MenuView(APIView):
    """
    MENU_001: apskatīt uzņēmuma ēdienkarti
    - Klients: tikai aktīvās kategorijas + pieejamie produkti
    - UA: visas kategorijas + visi produkti savam uzņēmumam
    """
    permission_classes = [AllowAny]

    def get(self, request, company_id: int):
        company = Company.objects.filter(id=company_id, deleted_at__isnull=True).first()
        if not company:
            raise NotFound("Uzņēmums nav atrasts.")

        user = request.user

        # Klients/viesis
        if not (user.is_authenticated and user.role == User.Role.COMPANY_ADMIN):
            # Pārbauda, vai uzņēmums ir publiski pieejams
            if not company_public_available(company_id):
                raise PermissionDenied("Uzņēmuma ēdienkarte nav pieejama.")

            categories = MenuCategory.objects.filter(company=company, is_active=True).order_by("name")
            data = []
            for cat in categories:
                products = Product.objects.filter(company=company, category=cat, is_available=True).order_by("name")
                data.append(
                    {
                        "id": cat.id,
                        "name": cat.name,
                        "description": cat.description,
                        "products": [
                            {"id": p.id, "name": p.name, "price": str(p.price), "is_available": p.is_available}
                            for p in products
                        ],
                    }
                )
            return Response(MenuPublicSerializer({"categories": data}).data, status=status.HTTP_200_OK)

        # UA
        if user.company_id != company_id:
            raise PermissionDenied("Piekļuve ir atļauta tikai savam uzņēmumam.")

        categories = MenuCategory.objects.filter(company=company).order_by("name")
        products = Product.objects.filter(company=company).order_by("name")

        admin_payload = {
            "categories": [{"id": c.id, "name": c.name} for c in categories],
            "products": [{"id": p.id, "name": p.name} for p in products],
        }
        return Response(MenuAdminSerializer(admin_payload).data, status=status.HTTP_200_OK)


class CategoryCreateView(APIView):
    """
    MENU_005: pievienot kategoriju
    """
    permission_classes = [IsAuthenticated, IsCompanyAdmin]

    def post(self, request):
        user: User = request.user
        if not user.company_id:
            raise PermissionDenied("Administratoram nav piesaistīts uzņēmums.")

        s = CategoryCreateUpdateSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        category = MenuCategory.objects.create(company_id=user.company_id, **s.validated_data)
        return Response({"code": "P_001", "detail": "Kategorija ir izveidota.", "id": category.id},
                        status=status.HTTP_201_CREATED)


class CategoryUpdateView(APIView):
    """
    MENU_006: rediģēt kategoriju
    """
    permission_classes = [IsAuthenticated, IsCompanyAdmin]

    def put(self, request, category_id: int):
        user: User = request.user
        category = MenuCategory.objects.filter(id=category_id, company_id=user.company_id).first()
        if not category:
            raise NotFound("Kategorija nav atrasta.")

        s = CategoryCreateUpdateSerializer(instance=category, data=request.data)
        s.is_valid(raise_exception=True)
        s.save()

        return Response({"code": "P_002", "detail": "Kategorija ir atjaunināta."},
                        status=status.HTTP_200_OK)


class CategoryDeleteView(APIView):
    """
    MENU_007: dzēst kategoriju (hard delete)
    """
    permission_classes = [IsAuthenticated, IsCompanyAdmin]

    def post(self, request, category_id: int):
        user: User = request.user
        category = MenuCategory.objects.filter(id=category_id, company_id=user.company_id).first()
        if not category:
            raise NotFound("Kategorija nav atrasta.")

        category.delete()
        return Response({"code": "P_004", "detail": "Kategorija ir dzēsta."},
                        status=status.HTTP_200_OK)


class ProductCreateView(APIView):
    """
    MENU_002: pievienot produktu
    - recepte obligāta, vismaz 1 sastāvdaļa
    - foto obligāts
    """
    permission_classes = [IsAuthenticated, IsCompanyAdmin]

    def post(self, request):
        user: User = request.user
        if not user.company_id:
            raise PermissionDenied("Administratoram nav piesaistīts uzņēmums.")

        data = request.data.copy()
        # Parsē recepte no FormData (ja nepieciešams)
        data["recipe"] = parse_recipe(data)

        s = ProductCreateUpdateSerializer(data=data, context={"company": user.company})
        s.is_valid(raise_exception=True)
        product = s.save()

        return Response({"code": "P_001", "detail": "Produkts ir izveidots.", "id": product.id},
                        status=status.HTTP_201_CREATED)


class ProductUpdateView(APIView):
    """
    MENU_003: rediģēt produktu
    """
    permission_classes = [IsAuthenticated, IsCompanyAdmin]

    def put(self, request, product_id: int):
        user: User = request.user
        product = Product.objects.filter(id=product_id, company_id=user.company_id).first()
        if not product:
            raise NotFound("Produkts nav atrasts.")

        data = request.data.copy()
        data["recipe"] = parse_recipe(data)

        s = ProductCreateUpdateSerializer(instance=product, data=data, context={"company": user.company})
        s.is_valid(raise_exception=True)
        s.save()

        return Response({"code": "P_002", "detail": "Produkts ir atjaunināts."},
                        status=status.HTTP_200_OK)


class ProductDeleteView(APIView):
    """
    MENU_004: dzēst produktu (hard delete)
    """
    permission_classes = [IsAuthenticated, IsCompanyAdmin]

    def post(self, request, product_id: int):
        user: User = request.user
        product = Product.objects.filter(id=product_id, company_id=user.company_id).first()
        if not product:
            raise NotFound("Produkts nav atrasts.")

        product.delete()
        return Response({"code": "P_004", "detail": "Produkts ir dzēsts."},
                        status=status.HTTP_200_OK)
