from django.urls import path
from .views import (
    AdminTemplateCreateView, AdminTemplateListView, AdminTemplateUpdateView, AdminTemplateDeleteView,
    CompanyEmailLogListView,
)

urlpatterns = [
    # NOTIF_001..004 (SA)
    path("admin/notif/templates/create/", AdminTemplateCreateView.as_view()),
    path("admin/notif/templates/", AdminTemplateListView.as_view()),
    path("admin/notif/templates/<int:template_id>/update/", AdminTemplateUpdateView.as_view()),
    path("admin/notif/templates/<int:template_id>/delete/", AdminTemplateDeleteView.as_view()),

    # NOTIF_005 (UA)
    path("company/notif/logs/", CompanyEmailLogListView.as_view()),
]
