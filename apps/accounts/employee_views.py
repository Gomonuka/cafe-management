from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, NotFound

from apps.accounts.models import User
from apps.companies.models import Company
from .permissions import IsCompanyAdmin
from .employee_serializers import EmployeeListSerializer, EmployeeCreateSerializer, EmployeeUpdateSerializer

class EmployeeListView(generics.ListAPIView):
    # USER_010: saraksts ar darbiniekiem (neiekļauj soft-deleted)
    permission_classes = [IsAuthenticated, IsCompanyAdmin]
    serializer_class = EmployeeListSerializer

    def get_queryset(self):
        user: User = self.request.user
        if not user.company_id:
            return User.objects.none()
        return User.objects.all_with_deleted().filter(
            company_id=user.company_id,
            role=User.Role.EMPLOYEE,
            deleted_at__isnull=True,
            is_active=True,
        )

class EmployeeCreateView(generics.CreateAPIView):
    # USER_011: pievienot darbinieku uzņēmumam
    permission_classes = [IsAuthenticated, IsCompanyAdmin]
    serializer_class = EmployeeCreateSerializer

    def perform_create(self, serializer):
        admin: User = self.request.user
        if not admin.company_id:
            raise PermissionDenied("Administratoram nav piesaistīts uzņēmums.")
        company = Company.objects.get(id=admin.company_id, deleted_at__isnull=True)
        serializer.save(company=company)

class EmployeeUpdateView(generics.UpdateAPIView):
    # USER_012: rediģēt darbinieku
    permission_classes = [IsAuthenticated, IsCompanyAdmin]
    serializer_class = EmployeeUpdateSerializer
    lookup_url_kwarg = "employee_id"

    def get_object(self):
        admin: User = self.request.user
        employee_id = self.kwargs["employee_id"]

        employee = User.objects.all_with_deleted().filter(
            id=employee_id,
            company_id=admin.company_id,
            role=User.Role.EMPLOYEE,
            deleted_at__isnull=True,
        ).first()
        if not employee:
            raise NotFound("Darbinieks nav atrasts.")
        return employee

    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

class EmployeeSoftDeleteView(APIView):
    # USER_013: soft-delete darbinieku
    permission_classes = [IsAuthenticated, IsCompanyAdmin]

    def post(self, request, employee_id: int):
        admin: User = request.user
        employee = User.objects.all_with_deleted().filter(
            id=employee_id,
            company_id=admin.company_id,
            role=User.Role.EMPLOYEE,
            deleted_at__isnull=True,
        ).first()
        if not employee:
            raise NotFound("Darbinieks nav atrasts.")

        employee.soft_delete()
        return Response({"code": "P_004", "detail": "Darbinieks ir deaktivizēts."}, status=status.HTTP_200_OK)
