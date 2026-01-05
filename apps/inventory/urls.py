# apps/inventory/urls.py
from django.urls import path
from .views import InventoryListView, InventoryCreateView, InventoryUpdateView, InventoryDeleteView

urlpatterns = [
    # INV_001
    path("", InventoryListView.as_view()),

    # INV_002
    path("create/", InventoryCreateView.as_view()),

    # INV_003
    path("<int:item_id>/update/", InventoryUpdateView.as_view()),

    # INV_004
    path("<int:item_id>/delete/", InventoryDeleteView.as_view()),
]
