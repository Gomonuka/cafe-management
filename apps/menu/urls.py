from django.urls import path
from .views import (
    MenuView,
    CategoryCreateView,
    CategoryUpdateView,
    CategoryDeleteView,
    ProductCreateView,
    ProductUpdateView,
    ProductDeleteView,
)

urlpatterns = [
    # MENU_001
    path("menu/<int:company_id>/", MenuView.as_view()),

    # MENU_005..007
    path("menu/categories/create/", CategoryCreateView.as_view()),
    path("menu/categories/<int:category_id>/update/", CategoryUpdateView.as_view()),
    path("menu/categories/<int:category_id>/delete/", CategoryDeleteView.as_view()),

    # MENU_002..004
    path("menu/products/create/", ProductCreateView.as_view()),
    path("menu/products/<int:product_id>/update/", ProductUpdateView.as_view()),
    path("menu/products/<int:product_id>/delete/", ProductDeleteView.as_view()),
]
