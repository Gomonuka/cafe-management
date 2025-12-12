from django.db import models
from django.db.models import Q, Sum, Count, F
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from .models import Company, CompanyWorkingHours
from .serializers import CompanySerializer, CompanyWorkingHoursSerializer
from apps.accounts.permissions import (
    IsAuthenticatedAndNotBlocked,
    user_has_role,
)


class CompanyViewSet(viewsets.ModelViewSet):
    """
    Uzņēmumu profili:

      Klienti:
        1) redz tikai aktīvos uzņēmumus (is_active=True)
        2) var filtrēt un meklēt uzņēmumus pēc nosaukuma/adreses
        3) var kārtot uzņēmumu sarakstu pēc nosaukuma

      Darbinieks:
        1) redz tikai savu uzņēmumu
        2) nevar labot uzņēmuma profilu

      Uzņēmuma admins:
        1) redz un var labot tikai savu uzņēmumu
           (nosaukums, kontakti, darba laiks, deaktivizēt / dzēst savu uzņēmumu)

      Sistēmas admins:
        1) redz visus uzņēmumus
        2) var deaktivizēt (is_active=False) vai dzēst jebkuru uzņēmumu
           (profila labošanu neveic)
    """

    serializer_class = CompanySerializer
    queryset = Company.objects.all()
    permission_classes = [IsAuthenticatedAndNotBlocked]

    def perform_create(self, serializer):
        user = self.request.user

        if user_has_role(user, ["company_admin", "system_admin"]):
            serializer.save()
            return

        raise PermissionDenied("You are not allowed to create companies.")

    def get_queryset(self):
        user = self.request.user
        qs = Company.objects.all()

        # --- bāzes redzamība pēc lomām --------------------------------------
        if user_has_role(user, ["system_admin"]):
            # SA redz visus
            pass
        elif user_has_role(user, ["company_admin", "employee"]):
            # UA / DA redz tikai savu uzņēmumu
            qs = qs.filter(id=user.company_id)
        elif user_has_role(user, ["client"]):
            # Klients redz tikai aktīvus uzņēmumus
            qs = qs.filter(is_active=True)
        else:
            return Company.objects.none()

        # --- filtrēšana / meklēšana / kārtošana ------------------------------
        params = self.request.query_params

        country = params.get("country")
        city = params.get("city")
        address = params.get("address")
        search = params.get("search")
        ordering = params.get("ordering")

        if country:
            qs = qs.filter(country__icontains=country)

        if city:
            qs = qs.filter(city__icontains=city)

        if address:
            qs = qs.filter(address_line1__icontains=address)

        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(city__icontains=search)
                | Q(address_line1__icontains=search)
                | Q(country__icontains=search)
            )

        if ordering in ("name", "-name"):
            qs = qs.order_by(ordering)

        return qs

    def update(self, request, *args, **kwargs):
        user = self.request.user
        instance = self.get_object()

        # Sistēmas admins profilu nelabo, tikai deaktivizē/dzēš
        if user_has_role(user, ["system_admin"]):
            raise PermissionDenied(
                "System admin can only deactivate/delete companies, not edit their profile."
            )

        if user_has_role(user, ["company_admin"]) and instance.id != user.company_id:
            raise PermissionDenied("You can edit only your own company.")

        # darbiniekam un klientam nav atļauts
        if not user_has_role(user, ["company_admin"]):
            raise PermissionDenied("You are not allowed to edit companies.")

        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        user = self.request.user
        instance = self.get_object()

        if user_has_role(user, ["system_admin"]):
            raise PermissionDenied(
                "System admin can only deactivate/delete companies, not edit their profile."
            )

        if user_has_role(user, ["company_admin"]) and instance.id != user.company_id:
            raise PermissionDenied("You can edit only your own company.")

        if not user_has_role(user, ["company_admin"]):
            raise PermissionDenied("You are not allowed to edit companies.")

        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        user = self.request.user
        instance = self.get_object()

        # SA – var dzēst jebkuru uzņēmumu
        if user_has_role(user, ["system_admin"]):
            return super().destroy(request, *args, **kwargs)

        # UA – var dzēst tikai savu uzņēmumu
        if user_has_role(user, ["company_admin"]) and instance.id == user.company_id:
            return super().destroy(request, *args, **kwargs)

        raise PermissionDenied("You are not allowed to delete this company.")

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        """
        POST /api/companies/<id>/deactivate/
          - SA var deaktivizēt jebkuru
          - UA var deaktivizēt tikai savu uzņēmumu
        """
        user = self.request.user
        company = self.get_object()

        if user_has_role(user, ["system_admin"]):
            pass
        elif user_has_role(user, ["company_admin"]) and company.id == user.company_id:
            pass
        else:
            raise PermissionDenied("You are not allowed to deactivate this company.")

        company.is_active = False
        company.save()
        serializer = self.get_serializer(company)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        """
        POST /api/companies/<id>/activate/
          - tikai SA
        """
        user = self.request.user
        company = self.get_object()

        if not user_has_role(user, ["system_admin"]):
            raise PermissionDenied("Only system admins can activate companies.")

        company.is_active = True
        company.save()
        serializer = self.get_serializer(company)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def analytics(self, request, pk=None):
        """
        GET /api/companies/<id>/analytics/
        - company_admin: tikai savai
        """
        user = self.request.user
        company = self.get_object()

        if user_has_role(user, ["company_admin"]) and company.id == user.company_id:
            pass
        else:
            raise PermissionDenied("You are not allowed to view analytics for this company.")

        orders = company.orders.all()
        items = company.products.all()

        total_orders = orders.count()
        revenue = orders.aggregate(total=Sum("total_amount")).get("total") or 0
        by_status = orders.values("status").annotate(count=Count("id"), revenue=Sum("total_amount"))
        top_products = (
            company.products.annotate(
                order_count=Count("order_items"),
                quantity_sold=Sum("order_items__quantity"),
                revenue=Sum(F("order_items__line_total")),
            )
            .filter(order_count__gt=0)
            .order_by("-revenue")[:5]
            .values("id", "name", "order_count", "quantity_sold", "revenue")
        )

        low_stock = company.inventory_items.filter(quantity__lt=F("min_quantity")).count()

        data = {
            "company_id": company.id,
            "company_name": company.name,
            "total_orders": total_orders,
            "total_revenue": revenue,
            "orders_by_status": list(by_status),
            "top_products": list(top_products),
            "low_stock_items": low_stock,
        }
        return Response(data)


class CompanyWorkingHoursViewSet(viewsets.ModelViewSet):
    """
    Uzņēmuma darba laiks:
      - SA: redz/labo visiem uzņēmumiem
      - UA: redz/labo tikai sava uzņēmuma darba laiku
      - Darbinieks: var tikai skatīt sava uzņēmuma darba laiku
      - Klients: var skatīt aktīvo uzņēmumu darba laiku
    """

    serializer_class = CompanyWorkingHoursSerializer
    queryset = CompanyWorkingHours.objects.all()
    permission_classes = [IsAuthenticatedAndNotBlocked]

    def _ensure_edit_permission(self, instance: CompanyWorkingHours):
        user = self.request.user

        if user_has_role(user, ["system_admin"]):
            return

        if user_has_role(user, ["company_admin"]) and instance.company_id == user.company_id:
            return

        raise PermissionDenied("You are not allowed to modify these working hours.")

    def get_queryset(self):
        user = self.request.user
        qs = CompanyWorkingHours.objects.all()

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
            raise PermissionDenied("You are not allowed to create working hours entries.")

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        self._ensure_edit_permission(instance)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        self._ensure_edit_permission(instance)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self._ensure_edit_permission(instance)
        return super().destroy(request, *args, **kwargs)
