from django.contrib import admin
from .models import InventoryItem, InventoryMovement, RecipeComponent


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ("name", "company", "unit", "quantity", "min_quantity")
    list_filter = ("company",)
    search_fields = ("name",)


@admin.register(InventoryMovement)
class InventoryMovementAdmin(admin.ModelAdmin):
    list_display = (
        "inventory_item",
        "quantity_change",
        "reason",
        "created_by",
        "created_at",
    )
    list_filter = ("inventory_item__company", "created_by", "created_at")


@admin.register(RecipeComponent)
class RecipeComponentAdmin(admin.ModelAdmin):
    list_display = ("product", "inventory_item", "quantity")
    list_filter = ("product__company",)
    search_fields = ("product__name", "inventory_item__name")
