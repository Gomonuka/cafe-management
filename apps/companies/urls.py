from django.urls import path
from .views import (
    CompanyListView,
    CompanyCitiesView,
    CompanyListFilteredView,
    CompanyDetailView,
    CompanyCreateView,
    CompanyUpdateView,
    CompanySoftDeleteMyView,
    CompanyDeactivateMyView,
    AdminCompanySoftDeleteView,
    AdminCompanyBlockView,
)

urlpatterns = [
    # COMP_001/008/009
    path("", CompanyListView.as_view()),

    # COMP_002 (pilsētu saraksts + filtrēšana)
    path("cities/", CompanyCitiesView.as_view()),
    path("filter/", CompanyListFilteredView.as_view()),

    # COMP_003
    path("<int:company_id>/", CompanyDetailView.as_view()),

    # COMP_004/005/006/011 (UA)
    path("me/create/", CompanyCreateView.as_view()),
    path("me/update/", CompanyUpdateView.as_view()),
    path("me/delete/", CompanySoftDeleteMyView.as_view()),
    path("me/deactivate/", CompanyDeactivateMyView.as_view()),

    # COMP_007/010 (SA)
    path("admin/<int:company_id>/delete/", AdminCompanySoftDeleteView.as_view()),
    path("admin/<int:company_id>/block/", AdminCompanyBlockView.as_view()),
]
