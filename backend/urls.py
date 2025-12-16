from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

from apps.accounts.views_me import MeView

from apps.accounts.views import UserViewSet
from apps.companies.views import CompanyViewSet, CompanyWorkingHoursViewSet
from apps.menu.views import MenuCategoryViewSet, ProductViewSet
from apps.orders.views import OrderViewSet, OrderItemViewSet, OrderStatusHistoryViewSet
from apps.inventory.views import InventoryItemViewSet, InventoryMovementViewSet, RecipeComponentViewSet
from apps.notifications.views import EmailTemplateViewSet, EmailLogViewSet

router = DefaultRouter()

# accounts
router.register(r"users", UserViewSet, basename="user")

# companies
router.register(r"companies", CompanyViewSet, basename="company")
router.register(r"company-working-hours", CompanyWorkingHoursViewSet, basename="company-working-hours")

# menu
router.register(r"menu-categories", MenuCategoryViewSet, basename="menu-category")
router.register(r"products", ProductViewSet, basename="product")

# orders
router.register(r"orders", OrderViewSet, basename="order")
router.register(r"order-items", OrderItemViewSet, basename="order-item")
router.register(r"order-status-history", OrderStatusHistoryViewSet, basename="order-status-history")

# inventory & recipes
router.register(r"inventory-items", InventoryItemViewSet, basename="inventory-item")
router.register(r"inventory-movements", InventoryMovementViewSet, basename="inventory-movement")
router.register(r"recipe-components", RecipeComponentViewSet, basename="recipe-component")

# notifications
router.register(r"email-templates", EmailTemplateViewSet, basename="email-template")
router.register(r"email-logs", EmailLogViewSet, basename="email-log")


urlpatterns = [
    path("admin/", admin.site.urls),

    # auth (JWT)
    path("api/auth/", include("apps.accounts.urls")),

    # profile
    path("api/me/", MeView.as_view(), name="me"),

    # API
    path("api/", include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
