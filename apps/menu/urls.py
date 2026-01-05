# apps/menu/urls.py
from django.urls import path
from .views import (
    MenuView,
    CategoryCreateView,
    CategoryUpdateView,
    CategoryDeleteView,
    ProductCreateView,
    ProductUpdateView,
    ProductDeleteView,
    ProductRecipeView,
)

urlpatterns = [
    # MENU_001
    path("<int:company_id>/", MenuView.as_view()),

    # MENU_005..007
    path("categories/create/", CategoryCreateView.as_view()),
    path("categories/<int:category_id>/update/", CategoryUpdateView.as_view()),
    path("categories/<int:category_id>/delete/", CategoryDeleteView.as_view()),

    # MENU_002..004
    path("products/create/", ProductCreateView.as_view()),
    path("products/<int:product_id>/update/", ProductUpdateView.as_view()),
    path("products/<int:product_id>/delete/", ProductDeleteView.as_view()),
    path("products/<int:product_id>/recipe/", ProductRecipeView.as_view()),
]
