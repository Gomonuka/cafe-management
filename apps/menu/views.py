from rest_framework import viewsets
from .models import MenuCategory, Product
from .serializers import MenuCategorySerializer, ProductSerializer
from apps.accounts.permissions import (
    IsAuthenticatedAndNotBlocked,
    user_has_role,
)


class MenuCategoryViewSet(viewsets.ModelViewSet):
    """
    Категории меню:
    - Klients: может видеть категории активных компаний
    - company_admin / employee: видят и управляют категориями своего uzņēmuma
    - system_admin: всё
    """

    serializer_class = MenuCategorySerializer
    permission_classes = [IsAuthenticatedAndNotBlocked]

    def get_queryset(self):
        user = self.request.user
        qs = MenuCategory.objects.all()

        if user_has_role(user, ["system_admin"]):
            return qs

        if user_has_role(user, ["company_admin", "employee"]):
            return qs.filter(company=user.company)

        if user_has_role(user, ["client"]):
            return qs.filter(company__is_active=True)

        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user

        if user_has_role(user, ["company_admin"]):
            serializer.save(company=user.company)
        elif user_has_role(user, ["system_admin"]):
            serializer.save()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only company or system admins can create categories.")

    def perform_update(self, serializer):
        from rest_framework.exceptions import PermissionDenied

        user = self.request.user
        instance = self.get_object()

        if user_has_role(user, ["system_admin"]):
            serializer.save()
            return

        if user_has_role(user, ["company_admin"]) and instance.company_id == user.company_id:
            serializer.save()
            return

        raise PermissionDenied("You are not allowed to update this category.")

    def perform_destroy(self, instance):
        from rest_framework.exceptions import PermissionDenied

        user = self.request.user

        if user_has_role(user, ["system_admin"]):
            return super().perform_destroy(instance)

        if user_has_role(user, ["company_admin"]) and instance.company_id == user.company_id:
            return super().perform_destroy(instance)

        raise PermissionDenied("You are not allowed to delete this category.")


class ProductViewSet(viewsets.ModelViewSet):
    """
    Produkti:
    - Klients: может смотреть меню (фильтрация по company, категории, цене)
    - Employee/company_admin: CRUD только по продуктам своей компании
    - system_admin: полный доступ
    """

    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedAndNotBlocked]

    def get_queryset(self):
        user = self.request.user
        qs = Product.objects.all()

        company_id = self.request.query_params.get("company")
        if company_id:
            qs = qs.filter(company_id=company_id)

        if user_has_role(user, ["system_admin"]):
            return qs

        if user_has_role(user, ["company_admin", "employee"]):
            return qs.filter(company=user.company)

        if user_has_role(user, ["client"]):
            return qs.filter(company__is_active=True, is_available=True)

        return qs.none()

    def perform_create(self, serializer):
        from rest_framework.exceptions import PermissionDenied

        user = self.request.user

        if user_has_role(user, ["company_admin"]):
            serializer.save(company=user.company)
        elif user_has_role(user, ["system_admin"]):
            serializer.save()
        else:
            raise PermissionDenied("Only company or system admins can create products.")

    def perform_update(self, serializer):
        from rest_framework.exceptions import PermissionDenied

        user = self.request.user
        instance = self.get_object()

        if user_has_role(user, ["system_admin"]):
            serializer.save()
            return

        if user_has_role(user, ["company_admin"]) and instance.company_id == user.company_id:
            serializer.save()
            return

        raise PermissionDenied("You are not allowed to update this product.")

    def perform_destroy(self, instance):
        from rest_framework.exceptions import PermissionDenied

        user = self.request.user

        if user_has_role(user, ["system_admin"]):
            return super().perform_destroy(instance)

        if user_has_role(user, ["company_admin"]) and instance.company_id == user.company_id:
            return super().perform_destroy(instance)

        raise PermissionDenied("You are not allowed to delete this product.")
