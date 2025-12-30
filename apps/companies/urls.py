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
    path("companies/", CompanyListView.as_view()),

    # COMP_002 (pilsētu saraksts + filtrēšana)
    path("companies/cities/", CompanyCitiesView.as_view()),
    path("companies/filter/", CompanyListFilteredView.as_view()),

    # COMP_003
    path("companies/<int:company_id>/", CompanyDetailView.as_view()),

    # COMP_004/005/006/011 (UA)
    path("companies/me/create/", CompanyCreateView.as_view()),
    path("companies/me/update/", CompanyUpdateView.as_view()),
    path("companies/me/delete/", CompanySoftDeleteMyView.as_view()),
    path("companies/me/deactivate/", CompanyDeactivateMyView.as_view()),

    # COMP_007/010 (SA)
    path("admin/companies/<int:company_id>/delete/", AdminCompanySoftDeleteView.as_view()),
    path("admin/companies/<int:company_id>/block/", AdminCompanyBlockView.as_view()),
]
