from django.urls import path
from .views import InventoryListView, InventoryCreateView, InventoryUpdateView, InventoryDeleteView

urlpatterns = [
    # INV_001
    path("inventory/", InventoryListView.as_view()),

    # INV_002
    path("inventory/create/", InventoryCreateView.as_view()),

    # INV_003
    path("inventory/<int:item_id>/update/", InventoryUpdateView.as_view()),

    # INV_004
    path("inventory/<int:item_id>/delete/", InventoryDeleteView.as_view()),
]
