from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.db.models import Count, Avg, Sum
from django.db.models.functions import TruncDate
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, NotFound, ValidationError

from apps.accounts.models import User
from apps.companies.models import Company
from apps.menu.models import Product
from apps.menu.services import compute_available_quantities
from .models import Cart, CartItem, Order, OrderItem
from .services import consume_inventory_for_order
from .permissions import IsClient, IsCompanyStaff
from .serializers import (
    CartItemInputSerializer,
    CartViewSerializer,
    CartItemViewSerializer,
    CheckoutSerializer,
    OrderClientSerializer,
    OrderKanbanSerializer,
    OrderStatusChangeSerializer,
)


def _client_can_order_company(company_id: int) -> bool:
    # Klients var pasūtīt tikai aktīvā, nebloķētā, ne soft-deleted uzņēmumā
    return Company.objects.filter(id=company_id, deleted_at__isnull=True, is_active=True, is_blocked=False).exists()


def _calc_cart_total(cart: Cart) -> Decimal:
    # Aprēķina groza kopējo summu
    total = Decimal("0.00")
    for item in cart.items.select_related("product").all():
        total += (item.product.price * item.quantity)
    return total


class CartView(APIView):
    """
    ORDER_001: veidot pasūtījumu (grozs)
    - POST: pievieno/atjaunina produktu grozā
    - DELETE: izņem produktu no groza
    - GET: parāda grozu ar summu
    """
    permission_classes = [IsAuthenticated, IsClient]

    def get(self, request, company_id: int):
        # Parāda grozu konkrētam uzņēmumam
        if not _client_can_order_company(company_id):
            raise PermissionDenied("Uzņēmums nav pieejams pasūtījumiem.")

        cart, _ = Cart.objects.get_or_create(user=request.user, company_id=company_id)
        total = _calc_cart_total(cart)
        payload = {"items": cart.items.all(), "total_amount": total}
        return Response(CartViewSerializer(payload).data, status=status.HTTP_200_OK)

    def post(self, request, company_id: int):
        # Pievieno produktu grozā (P_015)
        if not _client_can_order_company(company_id):
            raise PermissionDenied("Uzņēmums nav pieejams pasūtījumiem.")

        s = CartItemInputSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        product_id = s.validated_data["product_id"]
        qty = s.validated_data["quantity"]

        # Pārbauda, vai produkts pieder uzņēmumam un ir pieejams
        product = Product.objects.filter(
            id=product_id,
            company_id=company_id,
            is_available=True,
        ).first()
        if not product:
            raise ValidationError({"code": "P_010", "detail": "Produkts nav pieejams vai neeksistē."})

        avail_map = compute_available_quantities([product])
        max_available = avail_map.get(product.id, 0)
        if max_available <= 0 or qty > max_available:
            raise ValidationError({"code": "P_010", "detail": "Nepietiek noliktavas atlikuma šim produktam."})

        cart, _ = Cart.objects.get_or_create(user=request.user, company_id=company_id)
        item, created = CartItem.objects.update_or_create(
            cart=cart,
            product=product,
            defaults={"quantity": qty},
        )

        total = _calc_cart_total(cart)
        return Response(
            {"code": "P_015", "detail": "Produkts pievienots pasūtījumam.", "total_amount": str(total)},
            status=status.HTTP_200_OK,
        )

    def delete(self, request, company_id: int):
        # Izņem produktu no groza (P_016)
        if not _client_can_order_company(company_id):
            raise PermissionDenied("Uzņēmums nav pieejams pasūtījumiem.")

        product_id = request.query_params.get("product_id")
        if not product_id:
            return Response({"detail": "product_id ir obligāts."}, status=status.HTTP_400_BAD_REQUEST)

        cart = Cart.objects.filter(user=request.user, company_id=company_id).first()
        if not cart:
            return Response({"code": "P_016", "detail": "Produkts izņemts no pasūtījuma."}, status=status.HTTP_200_OK)

        CartItem.objects.filter(cart=cart, product_id=int(product_id)).delete()

        total = _calc_cart_total(cart)
        return Response(
            {"code": "P_016", "detail": "Produkts izņemts no pasūtījuma.", "total_amount": str(total)},
            status=status.HTTP_200_OK,
        )


class CheckoutView(APIView):
    """
    ORDER_008: noformēt pasūtījumu
    - ņem groza saturu no DB (cart)
    - izveido Order ar statusu 'Jauns'
    """
    permission_classes = [IsAuthenticated, IsClient]

    @transaction.atomic
    def post(self, request):
        s = CheckoutSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        company_id = s.validated_data["company_id"]
        if not _client_can_order_company(company_id):
            raise PermissionDenied("Uzņēmums nav pieejams pasūtījumiem.")

        cart = Cart.objects.filter(user=request.user, company_id=company_id).first()
        if not cart or cart.items.count() == 0:
            # Grozs nedrīkst būt tukšs (P_010)
            raise ValidationError({"code": "P_010", "detail": "Pasūtījuma grozs ir tukšs."})

        company = Company.objects.get(id=company_id)
        order = Order.objects.create(
            user=request.user,
            company=company,
            order_type=s.validated_data["order_type"],
            notes=s.validated_data.get("notes", "")[:1000],
            status=Order.Status.NEW,
        )

        # Fiksē cenas uz pasūtījuma brīdi
        total = Decimal("0.00")
        order_items = []
        for ci in cart.items.select_related("product").all():
            # Drošībai pārbaudām pieejamību vēlreiz
            if not ci.product.is_available:
                raise ValidationError({"code": "P_010", "detail": "Grozā ir produkts, kas vairs nav pieejams."})

            avail_map = compute_available_quantities([ci.product])
            max_available = avail_map.get(ci.product.id, 0)
            if max_available <= 0 or ci.quantity > max_available:
                raise ValidationError({"code": "P_010", "detail": "Nepietiek noliktavas atlikuma pasūtījumam."})

            line_total = ci.product.price * ci.quantity
            total += line_total

            order_items.append(
                OrderItem(
                    order=order,
                    product=ci.product,
                    quantity=ci.quantity,
                    unit_price=ci.product.price,
                )
            )

        OrderItem.objects.bulk_create(order_items)
        order.total_amount = total
        order.save(update_fields=["total_amount"])

        # Notīra grozu pēc pasūtījuma izveides
        cart.delete()

        return Response({"code": "P_001", "detail": "Pasūtījums ir izveidots.", "order_id": order.id},
                        status=status.HTTP_201_CREATED)


class ClientOrdersView(APIView):
    """
    ORDER_003: apskatīt savus pasūtījumus (aktīvie + pabeigtie)
    """
    permission_classes = [IsAuthenticated, IsClient]

    def get(self, request):
        qs = Order.objects.filter(user=request.user).prefetch_related("items", "items__product").select_related("company")

        active_statuses = {Order.Status.NEW, Order.Status.IN_PROGRESS, Order.Status.READY}
        finished_statuses = {Order.Status.DONE, Order.Status.CANCELED}

        active = qs.filter(status__in=active_statuses).order_by("-created_at")
        finished = qs.filter(status__in=finished_statuses).order_by("-created_at")

        return Response(
            {
                "active": OrderClientSerializer(active, many=True).data,
                "finished": OrderClientSerializer(finished, many=True).data,
            },
            status=status.HTTP_200_OK,
        )


class CancelOrderView(APIView):
    """
    ORDER_002: atcelt savu pasūtījumu (tikai, ja statuss 'Jauns')
    """
    permission_classes = [IsAuthenticated, IsClient]

    def post(self, request, order_id: int):
        order = Order.objects.filter(id=order_id, user=request.user).first()
        if not order:
            raise NotFound("Pasūtījums nav atrasts.")

        if order.status != Order.Status.NEW:
            # P_010: atcelšana nav atļauta
            raise ValidationError({"code": "P_010", "detail": "Pasūtījumu nevar atcelt šajā statusā."})

        order.status = Order.Status.CANCELED
        order.completed_at = timezone.now()
        order.save(update_fields=["status", "completed_at"])

        return Response({"code": "P_014", "detail": "Pasūtījums ir atcelts."},
                        status=status.HTTP_200_OK)


class CompanyOrdersKanbanView(APIView):
    """
    ORDER_004: uzņēmuma pasūtījumi Kanban skatā (UA/DA)
    """
    permission_classes = [IsAuthenticated, IsCompanyStaff]

    def get(self, request):
        user: User = request.user
        if not user.company_id:
            raise PermissionDenied("Lietotājam nav uzņēmuma.")

        qs = Order.objects.filter(company_id=user.company_id).order_by("-created_at")

        active_statuses = {Order.Status.NEW, Order.Status.IN_PROGRESS, Order.Status.READY, Order.Status.DONE}
        finished_statuses = {Order.Status.DONE, Order.Status.CANCELED}

        active = qs.filter(status__in=active_statuses)
        finished = qs.filter(status__in=finished_statuses)

        return Response(
            {
                "active": OrderKanbanSerializer(active, many=True).data,
                "finished": OrderKanbanSerializer(finished, many=True).data,
                # Piezīme: “pēc 1 minūtes” (DONE noņemšana) ir fronta uzvedība (taimeris) vai websocket/polling
            },
            status=status.HTTP_200_OK,
        )


class CompanyOrderDetailView(APIView):
    """
    ORDER_006: apskatīt pasūtījuma detaļas (UA/DA)
    """
    permission_classes = [IsAuthenticated, IsCompanyStaff]

    def get(self, request, order_id: int):
        user: User = request.user
        if not user.company_id:
            raise PermissionDenied("Lietotājam nav uzņēmuma.")

        order = Order.objects.filter(id=order_id, company_id=user.company_id).prefetch_related(
            "items", "items__product"
        ).select_related("company").first()
        if not order:
            raise NotFound("Pasūtījums nav atrasts.")

        # Atgriež detalizētu info (līdzīgs klienta serializer, bet der arī darbiniekiem)
        return Response(OrderClientSerializer(order).data, status=status.HTTP_200_OK)


class ChangeOrderStatusView(APIView):
    """
    ORDER_005: mainīt pasūtījuma statusu (UA/DA)
    + norakstīt noliktavu, kad Gatavs -> Pabeigts
    """
    permission_classes = [IsAuthenticated, IsCompanyStaff]

    def post(self, request, order_id: int):
        user: User = request.user
        if not user.company_id:
            raise PermissionDenied("Lietotājam nav uzņēmuma.")

        order = Order.objects.filter(id=order_id, company_id=user.company_id).first()
        if not order:
            raise NotFound("Pasūtījums nav atrasts.")

        s = OrderStatusChangeSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        new_status = s.validated_data["new_status"]

        old_status = order.status

        try:
            # Validē secību (NEW->INP->RDY->DONE)
            order.set_status(new_status)

            # Ja pāreja ir Gatavs -> Pabeigts, norakstām noliktavu
            if old_status == Order.Status.READY and new_status == Order.Status.DONE:
                consume_inventory_for_order(order)

        except Exception:
            raise ValidationError({"code": "P_010", "detail": "Statusa maiņa nav atļauta vai nepietiek noliktavas atlikuma."})

        order.save(update_fields=["status", "completed_at"])
        return Response({"detail": "Statuss atjaunināts."}, status=status.HTTP_200_OK)


class CompanyOrderStatsView(APIView):
    """
    ORDER_007: pasūtījumu statistika (UA)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user: User = request.user
        if user.role != User.Role.COMPANY_ADMIN:
            raise PermissionDenied("Piekļuve ir liegta.")

        if not user.company_id:
            raise PermissionDenied("Lietotājam nav uzņēmuma.")

        qs = Order.objects.filter(company_id=user.company_id)

        total_orders = qs.count()
        avg_amount = qs.aggregate(a=Avg("total_amount"))["a"] or 0

        # Populārākais produkts pēc pārdotā daudzuma
        top = (
            OrderItem.objects
            .filter(order__company_id=user.company_id)
            .values("product_id", "product__name")
            .annotate(total_qty=Sum("quantity"))
            .order_by("-total_qty")
        )
        most_popular = top.first()

        top_products = list(top[:10])

        # Pārdošanās grafiks pa dienām (summa)
        sales_by_day = (
            qs.annotate(d=TruncDate("created_at"))
              .values("d")
              .annotate(total=Sum("total_amount"))
              .order_by("d")
        )

        return Response(
            {
                "total_orders": total_orders,
                "avg_order_amount": str(avg_amount),
                "most_popular_product": most_popular,
                "top_products": top_products,
                "sales_by_day": list(sales_by_day),
            },
            status=status.HTTP_200_OK,
        )
