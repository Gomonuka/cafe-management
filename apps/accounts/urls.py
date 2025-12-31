from django.urls import path
from .auth_views import EmailLoginView, RefreshCookieView, LogoutCookieView
from .views import RegisterView, ProfileView, DeleteMeView
from .reset_views import PasswordResetRequestView, PasswordResetConfirmView
from .admin_views import AdminUserListView, AdminUserSoftDeleteView, AdminUserBlockView
from .employee_views import EmployeeListView, EmployeeCreateView, EmployeeUpdateView, EmployeeSoftDeleteView

urlpatterns = [
    # USER_001, USER_002, USER_003
    path("auth/register/", RegisterView.as_view()),
    path("auth/login/", EmailLoginView.as_view()),
    path("auth/refresh/", RefreshCookieView.as_view()),
    path("auth/logout/", LogoutCookieView.as_view()),

    # USER_004, USER_005, USER_006
    path("me/", ProfileView.as_view()),
    path("me/delete/", DeleteMeView.as_view()),

    # USER_007
    path("auth/password-reset/request/", PasswordResetRequestView.as_view()),
    path("auth/password-reset/confirm/", PasswordResetConfirmView.as_view()),

    # USER_008, USER_009, USER_014 (SA)
    path("admin/users/", AdminUserListView.as_view()),
    path("admin/users/<int:user_id>/delete/", AdminUserSoftDeleteView.as_view()),
    path("admin/users/<int:user_id>/block/", AdminUserBlockView.as_view()),

    # USER_010..013 (UA)
    path("company/employees/", EmployeeListView.as_view()),
    path("company/employees/create/", EmployeeCreateView.as_view()),
    path("company/employees/<int:employee_id>/update/", EmployeeUpdateView.as_view()),
    path("company/employees/<int:employee_id>/delete/", EmployeeSoftDeleteView.as_view()),
]
