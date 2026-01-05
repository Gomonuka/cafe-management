# backend/urls.py
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from apps.companies.views import AdminCompanySoftDeleteView, AdminCompanyBlockView

urlpatterns = [
    path("accounts/", include("apps.accounts.urls")),
    path("companies/", include("apps.companies.urls")),
    path("menu/", include("apps.menu.urls")),
    path("orders/", include("apps.orders.urls")),
    path("inventory/", include("apps.inventory.urls")),
    # Admin company management (direct admin prefix)
    path("admin/companies/<int:company_id>/delete/", AdminCompanySoftDeleteView.as_view()),
    path("admin/companies/<int:company_id>/block/", AdminCompanyBlockView.as_view()),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
