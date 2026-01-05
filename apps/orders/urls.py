# apps/orders/urls.py
from django.urls import path
from .views import (
    CartView,
    CheckoutView,
    ClientOrdersView,
    CancelOrderView,
    CompanyOrdersKanbanView,
    CompanyOrderDetailView,
    ChangeOrderStatusView,
    CompanyOrderStatsView,
)

urlpatterns = [
    # ORDER_001 (grozs)
    path("cart/<int:company_id>/", CartView.as_view()),

    # ORDER_008 (noformēt)
    path("orders/checkout/", CheckoutView.as_view()),

    # ORDER_003 (klients)
    path("orders/my/", ClientOrdersView.as_view()),

    # ORDER_002 (atcelt)
    path("orders/<int:order_id>/cancel/", CancelOrderView.as_view()),

    # ORDER_004 (UA/DA kanban)
    path("company/orders/", CompanyOrdersKanbanView.as_view()),

    # ORDER_006 (UA/DA detaļas)
    path("company/orders/<int:order_id>/", CompanyOrderDetailView.as_view()),

    # ORDER_005 (UA/DA status)
    path("company/orders/<int:order_id>/status/", ChangeOrderStatusView.as_view()),

    # ORDER_007 (UA stats)
    path("company/orders/stats/", CompanyOrderStatsView.as_view()),
]
