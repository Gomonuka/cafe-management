from decimal import Decimal
from uuid import uuid4

from django.utils import timezone
from django.db import models
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.accounts.permissions import IsAuthenticatedAndNotBlocked, user_has_role
from apps.inventory.models import InventoryMovement
from apps.notifications.services import send_templated_email
from .models import Order, OrderItem, OrderStatusHistory
from .serializers import (
    OrderSerializer,
    OrderItemSerializer,
    OrderStatusHistorySerializer,
)


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    queryset = Order.objects.all()
    permission_classes = [IsAuthenticatedAndNotBlocked]

    ALLOWED_STATUS_TRANSITIONS = {
        Order.OrderStatus.NEW: {Order.OrderStatus.IN_PROGRESS, Order.OrderStatus.CANCELED},
        Order.OrderStatus.IN_PROGRESS: {Order.OrderStatus.READY},
        Order.OrderStatus.READY: {Order.OrderStatus.COMPLETED},
        Order.OrderStatus.COMPLETED: set(),
        Order.OrderStatus.CANCELED: set(),
    }

    def get_queryset(self):
        user = self.request.user
        qs = Order.objects.all()

        if user_has_role(user, ["system_admin"]):
            return qs

        if user_has_role(user, ["company_admin", "employee"]):
            return qs.filter(company=user.company)

        if user_has_role(user, ["client"]):
            return qs.filter(client=user)

        return qs.none()

    def _generate_order_number(self) -> str:
        # Simple time-based unique number with random suffix
        ts = timezone.now().strftime("%Y%m%d%H%M%S")
        return f"ORD-{ts}-{uuid4().hex[:6].upper()}"

    def _create_status_history(self, order, previous_status, new_status):
        if previous_status == new_status:
            return
        OrderStatusHistory.objects.create(
            order=order,
            previous_status=previous_status,
            new_status=new_status,
            changed_by=self.request.user,
        )
        self._notify_status_change(order, previous_status, new_status)

    def _recalculate_total(self, order: Order):
        total = (
            order.items.all()
            .aggregate(total_amount=models.Sum("line_total"))
            .get("total_amount")
            or Decimal("0")
        )
        order.total_amount = total
        order.save(update_fields=["total_amount"])

    def _ensure_has_items_and_recipes(self, order: Order):
        if not order.items.exists():
            raise PermissionDenied("Order has no items.")

        # All products must have recipe components for stock deduction
        missing = [
            item.product.name
            for item in order.items.select_related("product").all()
            if not item.product.recipe_components.exists()
        ]
        if missing:
            raise PermissionDenied(
                f"Products missing recipe components: {', '.join(missing)}."
            )

    def _collect_requirements(self, items_data):
        """
        Build inventory deltas (negative) required for given items data.
        items_data: iterable of dicts with product and quantity.
        """
        deltas = {}
        for item in items_data:
            product = item.get("product")
            qty = Decimal(item.get("quantity") or 0)
            if not product.recipe_components.exists():
                raise PermissionDenied(f"Product '{product.name}' has no recipe components.")
            for rc in product.recipe_components.select_related("inventory_item"):
                change = -(rc.quantity * qty)
                inv_item = rc.inventory_item
                deltas[inv_item] = deltas.get(inv_item, Decimal("0")) + change
        return deltas

    def _ensure_inventory_available(self, deltas):
        """
        Validate that applying deltas (negative consumes) will not drop inventory below zero.
        """
        for inv_item, delta in deltas.items():
            if inv_item.quantity + delta < 0:
                raise PermissionDenied(f"Not enough stock for {inv_item.name}.")

    def _apply_inventory_deltas(self, deltas, reason: str, user):
        """
        Apply inventory movements for given deltas (can be positive or negative).
        """
        for inv_item, delta in deltas.items():
            if delta == 0:
                continue
            InventoryMovement.objects.create(
                inventory_item=inv_item,
                quantity_change=delta,
                reason=reason,
                created_by=user,
            )
            inv_item.quantity = inv_item.quantity + delta
            inv_item.save(update_fields=["quantity"])

    def _notify_order_created(self, order: Order):
        # Notify client
        client_email = getattr(order.client, "email", None)
        if client_email:
            send_templated_email(
                code="order_created",
                to_email=client_email,
                context={
                    "order_number": order.number,
                    "status": order.status,
                    "company": order.company.name,
                },
                receiver_user=order.client,
            )

        # Notify company staff (admins + employees) about new order
        staff_emails = (
            order.company.users.filter(role__in=["company_admin", "employee"], email__isnull=False)
            .values_list("email", flat=True)
            .distinct()
        )
        for email in staff_emails:
            send_templated_email(
                code="order_new_for_company",
                to_email=email,
                context={
                    "order_number": order.number,
                    "company": order.company.name,
                },
            )

    def _notify_status_change(self, order: Order, previous_status: str, new_status: str):
        # Notify client about status change
        client_email = getattr(order.client, "email", None)
        if client_email:
            send_templated_email(
                code="order_status_changed",
                to_email=client_email,
                context={
                    "order_number": order.number,
                    "previous_status": previous_status,
                    "new_status": new_status,
                    "company": order.company.name,
                },
                receiver_user=order.client,
            )

    def _ensure_company_order_access(self, order: Order):
        user = self.request.user

        if user_has_role(user, ["system_admin"]):
            return

        if user_has_role(user, ["company_admin", "employee"]) and order.company_id == getattr(
            user, "company_id", None
        ):
            return

        raise PermissionDenied("You are not allowed to modify this order.")

    def perform_create(self, serializer):
        user = self.request.user
        if not user_has_role(user, ["client"]):
            raise PermissionDenied("Only clients can create orders.")

        company = serializer.validated_data.get("company")
        if not company:
            raise PermissionDenied("Company is required for order.")

        if not company.is_active or not company.is_open_now:
            raise PermissionDenied("Company is not available for ordering right now.")

        items_data = serializer.validated_data.get("items", [])
        deltas = self._collect_requirements(items_data)
        self._ensure_inventory_available(deltas)

        order = serializer.save(client=user, number=self._generate_order_number(), status=Order.OrderStatus.NEW)
        self._apply_inventory_deltas(deltas, reason=f"Order {order.number} creation", user=user)
        self._notify_order_created(order)

    def perform_update(self, serializer):
        order = self.get_object()
        previous_status = order.status
        self._ensure_company_order_access(order)
        new_status = serializer.validated_data.get("status", previous_status)
        if previous_status in (Order.OrderStatus.COMPLETED, Order.OrderStatus.CANCELED):
            raise PermissionDenied("Completed or canceled orders cannot be modified.")
        if new_status != previous_status:
            allowed = self.ALLOWED_STATUS_TRANSITIONS.get(previous_status, set())
            if new_status not in allowed:
                raise PermissionDenied(f"Transition from {previous_status} to {new_status} is not allowed.")
            self._ensure_has_items_and_recipes(order)
        serializer.save()
        order.refresh_from_db()
        self._create_status_history(order, previous_status, order.status)
        if previous_status == Order.OrderStatus.NEW and order.status == Order.OrderStatus.CANCELED:
            # Restock everything consumed on creation
            deltas = self._collect_requirements(
                [{"product": item.product, "quantity": item.quantity} for item in order.items.all()]
            )
            # reverse sign to restock
            reversed_deltas = {inv_item: -delta for inv_item, delta in deltas.items()}
            self._apply_inventory_deltas(
                reversed_deltas,
                reason=f"Order {order.number} cancellation restock",
                user=self.request.user,
            )

    def perform_destroy(self, instance):
        raise PermissionDenied("Orders cannot be deleted.")


class OrderItemViewSet(viewsets.ModelViewSet):
    serializer_class = OrderItemSerializer
    queryset = OrderItem.objects.all()
    permission_classes = [IsAuthenticatedAndNotBlocked]

    def get_queryset(self):
        user = self.request.user
        qs = OrderItem.objects.select_related("order", "order__company", "order__client")

        if user_has_role(user, ["system_admin"]):
            return qs

        if user_has_role(user, ["company_admin", "employee"]):
            return qs.filter(order__company=user.company)

        if user_has_role(user, ["client"]):
            return qs.filter(order__client=user)

        return qs.none()

    def _check_order_scope(self, order: Order):
        user = self.request.user

        if user_has_role(user, ["system_admin"]):
            return

        if user_has_role(user, ["company_admin", "employee"]) and order.company_id == getattr(
            user, "company_id", None
        ):
            return

        raise PermissionDenied("You are not allowed to access this order item.")

    def _item_deltas(self, product, quantity):
        if not product.recipe_components.exists():
            raise PermissionDenied("Product has no recipe components.")
        deltas = {}
        qty = Decimal(quantity or 0)
        for rc in product.recipe_components.select_related("inventory_item"):
            change = -(rc.quantity * qty)
            inv_item = rc.inventory_item
            deltas[inv_item] = deltas.get(inv_item, Decimal("0")) + change
        return deltas

    def perform_create(self, serializer):
        order = serializer.validated_data.get("order")
        if not order:
            raise PermissionDenied("Order is required.")

        self._check_order_scope(order)
        if order.status != Order.OrderStatus.NEW:
            raise PermissionDenied("Items can only be modified while order is NEW.")

        product = serializer.validated_data.get("product")
        deltas = self._item_deltas(product, serializer.validated_data.get("quantity"))
        OrderViewSet._ensure_inventory_available(self, deltas)

        serializer.save()
        OrderViewSet._apply_inventory_deltas(
            self,
            deltas,
            reason=f"Order {order.number} item add",
            user=self.request.user,
        )
        order.refresh_from_db()
        OrderViewSet._recalculate_total(self, order)

    def perform_update(self, serializer):
        instance = self.get_object()
        order = instance.order
        self._check_order_scope(order)
        if order.status != Order.OrderStatus.NEW:
            raise PermissionDenied("Items can only be modified while order is NEW.")

        new_product = serializer.validated_data.get("product", instance.product)
        new_qty = serializer.validated_data.get("quantity", instance.quantity)

        old_deltas = self._item_deltas(instance.product, instance.quantity)
        new_deltas = self._item_deltas(new_product, new_qty)

        delta_changes = {}
        for inv_item, delta in new_deltas.items():
            delta_changes[inv_item] = delta_changes.get(inv_item, Decimal("0")) + delta
        for inv_item, delta in old_deltas.items():
            delta_changes[inv_item] = delta_changes.get(inv_item, Decimal("0")) - delta

        OrderViewSet._ensure_inventory_available(self, delta_changes)

        serializer.save()
        OrderViewSet._apply_inventory_deltas(
            self,
            delta_changes,
            reason=f"Order {order.number} item update",
            user=self.request.user,
        )
        order.refresh_from_db()
        OrderViewSet._recalculate_total(self, order)

    def perform_destroy(self, instance):
        order = instance.order
        self._check_order_scope(order)
        if order.status != Order.OrderStatus.NEW:
            raise PermissionDenied("Items can only be modified while order is NEW.")

        old_deltas = self._item_deltas(instance.product, instance.quantity)
        restock = {inv_item: -delta for inv_item, delta in old_deltas.items()}

        response = super().perform_destroy(instance)
        OrderViewSet._apply_inventory_deltas(
            self,
            restock,
            reason=f"Order {order.number} item remove",
            user=self.request.user,
        )
        order.refresh_from_db()
        OrderViewSet._recalculate_total(self, order)
        return response


class OrderStatusHistoryViewSet(viewsets.ModelViewSet):
    serializer_class = OrderStatusHistorySerializer
    queryset = OrderStatusHistory.objects.all()
    permission_classes = [IsAuthenticatedAndNotBlocked]

    def get_queryset(self):
        user = self.request.user
        qs = OrderStatusHistory.objects.select_related("order", "order__company", "order__client")

        if user_has_role(user, ["system_admin"]):
            return qs

        if user_has_role(user, ["company_admin", "employee"]):
            return qs.filter(order__company=user.company)

        if user_has_role(user, ["client"]):
            return qs.filter(order__client=user)

        return qs.none()

    def perform_create(self, serializer):
        order = serializer.validated_data.get("order")
        if not order:
            raise PermissionDenied("Order is required.")

        user = self.request.user
        if user_has_role(user, ["system_admin"]):
            serializer.save(changed_by=user)
            return

        if user_has_role(user, ["company_admin", "employee"]) and order.company_id == getattr(
            user, "company_id", None
        ):
            serializer.save(changed_by=user)
            return

        raise PermissionDenied("You are not allowed to create status history entries.")
