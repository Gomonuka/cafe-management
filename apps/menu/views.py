# apps/menu/views.py
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from apps.accounts.models import User
from apps.companies.models import Company
from apps.inventory.models import InventoryItem
from .models import MenuCategory, Product, RecipeItem
from .serializers import (
    CategorySerializer,
    CategoryCreateUpdateSerializer,
    ProductCreateUpdateSerializer,
    MenuPublicSerializer,
    MenuAdminSerializer,
)
from .permissions import IsCompanyAdmin
from .utils import parse_recipe
from .services import compute_available_quantities

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

        # Klients
        if not (user.is_authenticated and user.role == User.Role.COMPANY_ADMIN):
            # Pārbauda, vai uzņēmums ir publiski pieejams
            if not company_public_available(company_id):
                raise PermissionDenied("Uzņēmuma ēdienkarte nav pieejama.")

            categories = MenuCategory.objects.filter(company=company, is_active=True).order_by("name")
            data = []
            product_ids = [p.id for p in Product.objects.filter(company=company, is_available=True)]
            recipe_ids = set(
                RecipeItem.objects.filter(product_id__in=product_ids).values_list("product_id", flat=True).distinct()
            )
            for cat in categories:
                products = list(
                    Product.objects.filter(company=company, category=cat, is_available=True)
                    .order_by("name")
                    .prefetch_related("recipe_items__inventory_item")
                )
                available_map = compute_available_quantities(products)

                products_payload = []
                for p in products:
                    # ja nav receptes – nerādam klientam
                    if p.id not in recipe_ids:
                        continue
                    available_qty = available_map.get(p.id, 0)
                    # Atklāt tikai tos produktus, kurus faktiski var ražot tagad
                    if available_qty <= 0:
                        continue
                    products_payload.append(
                        {
                            "id": p.id,
                            "name": p.name,
                            "price": str(p.price),
                            "is_available": p.is_available,
                            "available_quantity": available_qty,
                            "photo": request.build_absolute_uri(p.photo.url) if p.photo else None,
                        }
                    )

                data.append(
                    {
                        "id": cat.id,
                        "name": cat.name,
                        "description": cat.description,
                        "products": products_payload,
                    }
                )
            return Response(MenuPublicSerializer({"categories": data}, context={"request": request}).data, status=status.HTTP_200_OK)

        # Uzņēmuma administrators
        if user.company_id != company_id:
            raise PermissionDenied("Piekļuve ir atļauta tikai savam uzņēmumam.")

        categories = MenuCategory.objects.filter(company=company).order_by("name")
        products = list(
            Product.objects.filter(company=company).order_by("name").prefetch_related("recipe_items__inventory_item")
        )
        available_map = compute_available_quantities(products)

        admin_payload = {
            "categories": [{"id": c.id, "name": c.name} for c in categories],
            "products": [
                {
                    "id": p.id,
                    "name": p.name,
                    "price": str(p.price),
                    "is_available": p.is_available,
                    "available_quantity": available_map.get(p.id, 0),
                    "category_id": p.category_id,
                    "photo": request.build_absolute_uri(p.photo.url) if p.photo else None,
                }
                for p in products
            ],
        }
        return Response(MenuAdminSerializer(admin_payload, context={"request": request}).data, status=status.HTTP_200_OK)

class CategoryCreateView(APIView):
    """
    MENU_005: pievienot kategoriju
    """
    permission_classes = [IsAuthenticated, IsCompanyAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

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
    parser_classes = [MultiPartParser, FormParser, JSONParser]

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

        s = ProductCreateUpdateSerializer(data=data, context={"company": user.company, "allow_empty_recipe": True})
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
        if "recipe" in request.data:
            data["recipe"] = parse_recipe(data)

        s = ProductCreateUpdateSerializer(
            instance=product,
            data=data,
            context={"company": user.company, "allow_empty_recipe": True},
            partial=True,
        )
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

class ProductRecipeView(APIView):
    """
    MENU_002/003 helper: apskatīt/rediģēt produkta recepti (UA)
    """
    permission_classes = [IsAuthenticated, IsCompanyAdmin]

    def get(self, request, product_id: int):
        user: User = request.user
        product = Product.objects.filter(id=product_id, company_id=user.company_id).first()
        if not product:
            raise NotFound("Produkts nav atrasts.")

        recipe = RecipeItem.objects.filter(product=product).select_related("inventory_item").order_by("id")
        rows = [
            {
                "inventory_item_id": ri.inventory_item_id,
                "inventory_item_name": ri.inventory_item.name if ri.inventory_item else "",
                "amount": str(ri.amount),
            }
            for ri in recipe
        ]
        return Response({"product_id": product.id, "recipe": rows}, status=status.HTTP_200_OK)

    def put(self, request, product_id: int):
        user: User = request.user
        product = Product.objects.filter(id=product_id, company_id=user.company_id).first()
        if not product:
            raise NotFound("Produkts nav atrasts.")

        payload = request.data.get("recipe")
        if not isinstance(payload, list):
            return Response({"detail": "Receptes formāts nav korekts."}, status=status.HTTP_400_BAD_REQUEST)

        cleaned = []
        for row in payload:
            inv = row.get("inventory_item_id")
            amt = row.get("amount")
            try:
                inv_id = int(inv)
                amt_val = float(amt)
            except (TypeError, ValueError):
                continue
            if inv_id <= 0 or amt_val <= 0:
                continue
            cleaned.append({"inventory_item_id": inv_id, "amount": amt_val})

        # Validate inventory ownership
        inv_ids = [r["inventory_item_id"] for r in cleaned]
        if inv_ids:
            count = InventoryItem.objects.filter(company_id=user.company_id, id__in=inv_ids).count()
            if count != len(set(inv_ids)):
                return Response({"detail": "Recepte satur noliktavas vienības, kas nepieder uzņēmumam."},
                                status=status.HTTP_400_BAD_REQUEST)

        # Replace recipe
        RecipeItem.objects.filter(product=product).delete()
        items = [RecipeItem(product=product, inventory_item_id=r["inventory_item_id"], amount=r["amount"]) for r in cleaned]
        if items:
            RecipeItem.objects.bulk_create(items)

        recipe = RecipeItem.objects.filter(product=product).select_related("inventory_item").order_by("id")
        rows = [
            {
                "inventory_item_id": ri.inventory_item_id,
                "inventory_item_name": ri.inventory_item.name if ri.inventory_item else "",
                "amount": str(ri.amount),
            }
            for ri in recipe
        ]
        return Response({"product_id": product.id, "recipe": rows}, status=status.HTTP_200_OK)
