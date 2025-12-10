from django.contrib import admin
from .models import MenuCategory, Product


@admin.register(MenuCategory)
class MenuCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "company")
    list_filter = ("company",)
    search_fields = ("name",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "company", "category", "price", "is_available")
    list_filter = ("company", "category", "is_available")
    search_fields = ("name", "description")
