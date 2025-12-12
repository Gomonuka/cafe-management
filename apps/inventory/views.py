from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from apps.accounts.permissions import IsAuthenticatedAndNotBlocked, user_has_role
from .models import InventoryItem, InventoryMovement, RecipeComponent
from .serializers import (
    InventoryItemSerializer,
    InventoryMovementSerializer,
    RecipeComponentSerializer,
)


class InventoryItemViewSet(viewsets.ModelViewSet):
    serializer_class = InventoryItemSerializer
    queryset = InventoryItem.objects.all()
    permission_classes = [IsAuthenticatedAndNotBlocked]

    def get_queryset(self):
        user = self.request.user
        qs = InventoryItem.objects.all()

        if user_has_role(user, ["system_admin"]):
            return qs

        if user_has_role(user, ["company_admin", "employee"]):
            return qs.filter(company=user.company)

        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user

        if user_has_role(user, ["company_admin", "employee"]):
            serializer.save(company=user.company)
            return

        if user_has_role(user, ["system_admin"]):
            serializer.save()
            return

        raise PermissionDenied("You are not allowed to create inventory items.")

    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()

        if user_has_role(user, ["system_admin"]):
            serializer.save()
            return

        if user_has_role(user, ["company_admin", "employee"]) and instance.company_id == user.company_id:
            serializer.save(company=user.company)
            return

        raise PermissionDenied("You are not allowed to update this inventory item.")

    def perform_destroy(self, instance):
        user = self.request.user

        if user_has_role(user, ["system_admin"]):
            return super().perform_destroy(instance)

        if user_has_role(user, ["company_admin", "employee"]) and instance.company_id == user.company_id:
            return super().perform_destroy(instance)

        raise PermissionDenied("You are not allowed to delete this inventory item.")


class InventoryMovementViewSet(viewsets.ModelViewSet):
    serializer_class = InventoryMovementSerializer
    queryset = InventoryMovement.objects.select_related("inventory_item", "inventory_item__company")
    permission_classes = [IsAuthenticatedAndNotBlocked]

    def get_queryset(self):
        user = self.request.user
        qs = InventoryMovement.objects.select_related("inventory_item", "inventory_item__company")

        if user_has_role(user, ["system_admin"]):
            return qs

        if user_has_role(user, ["company_admin", "employee"]):
            return qs.filter(inventory_item__company=user.company)

        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        inventory_item = serializer.validated_data.get("inventory_item")

        if not inventory_item:
            raise PermissionDenied("Inventory item is required.")

        if user_has_role(user, ["system_admin"]):
            if inventory_item.quantity + serializer.validated_data.get("quantity_change", 0) < 0:
                raise PermissionDenied("Insufficient stock for this movement.")
            serializer.save(created_by=user)
            return

        if user_has_role(user, ["company_admin", "employee"]) and inventory_item.company_id == user.company_id:
            if inventory_item.quantity + serializer.validated_data.get("quantity_change", 0) < 0:
                raise PermissionDenied("Insufficient stock for this movement.")
            serializer.save(created_by=user)
            return

        raise PermissionDenied("You are not allowed to create inventory movements for this item.")


class RecipeComponentViewSet(viewsets.ModelViewSet):
    serializer_class = RecipeComponentSerializer
    queryset = RecipeComponent.objects.select_related(
        "product",
        "product__company",
        "inventory_item",
        "inventory_item__company",
    )
    permission_classes = [IsAuthenticatedAndNotBlocked]

    def get_queryset(self):
        user = self.request.user
        qs = RecipeComponent.objects.select_related(
            "product",
            "product__company",
            "inventory_item",
            "inventory_item__company",
        )

        if user_has_role(user, ["system_admin"]):
            return qs

        if user_has_role(user, ["company_admin", "employee"]):
            return qs.filter(product__company=user.company)

        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        product = serializer.validated_data.get("product")
        inventory_item = serializer.validated_data.get("inventory_item")

        if not product or not inventory_item:
            raise PermissionDenied("Product and inventory item are required.")

        if user_has_role(user, ["system_admin"]):
            serializer.save()
            return

        if (
            user_has_role(user, ["company_admin", "employee"])
            and product.company_id == user.company_id
            and inventory_item.company_id == user.company_id
        ):
            serializer.save()
            return

        raise PermissionDenied("You are not allowed to manage this recipe component.")

    def perform_update(self, serializer):
        instance = self.get_object()
        user = self.request.user

        if user_has_role(user, ["system_admin"]):
            serializer.save()
            return

        if user_has_role(user, ["company_admin", "employee"]) and instance.product.company_id == user.company_id:
            serializer.save()
            return

        raise PermissionDenied("You are not allowed to update this recipe component.")

    def perform_destroy(self, instance):
        user = self.request.user

        if user_has_role(user, ["system_admin"]):
            return super().perform_destroy(instance)

        if user_has_role(user, ["company_admin", "employee"]) and instance.product.company_id == user.company_id:
            return super().perform_destroy(instance)

        raise PermissionDenied("You are not allowed to delete this recipe component.")
