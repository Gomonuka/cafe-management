from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

from apps.accounts.models import User
from .serializers import RegisterSerializer, ProfileReadSerializer, ProfileUpdateSerializer
from .auth_views import set_jwt_cookies


class RegisterView(generics.CreateAPIView):
    # USER_001: konta izveide (KL/UA)
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        s = self.get_serializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.save()

        # Ja izvēlēts ienākt uzreiz — uzliekam JWT cookies
        if getattr(user, "_auto_login", False):
            refresh = RefreshToken.for_user(user)
            resp = Response(
                {
                    "code": "P_001",
                    "detail": "Konts ir veiksmīgi izveidots.",
                },
                status=status.HTTP_201_CREATED,
            )
            set_jwt_cookies(resp, refresh)
            return resp

        return Response(
            {"code": "P_001", "detail": "Konts ir veiksmīgi izveidots."},
            status=status.HTTP_201_CREATED,
        )


class ProfileView(APIView):
    # USER_004 + USER_005
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Profila datu apskate (USER_004)
        return Response(ProfileReadSerializer(request.user).data, status=status.HTTP_200_OK)

    def patch(self, request):
        # Profila datu rediģēšana (USER_005)
        s = ProfileUpdateSerializer(instance=request.user, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return Response({"code": "P_002", "detail": "Profila dati ir veiksmīgi atjaunināti."}, status=status.HTTP_200_OK)


class DeleteMeView(APIView):
    # USER_006: dzēst savu profilu (soft-delete) + atslēgties
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.soft_delete()

        # JWT gadījumā sesija ir FE pusē; pietiek ar profila deaktivizēšanu.
        return Response({"code": "P_004", "detail": "Profils ir deaktivizēts."}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    # Deprecated: header/body-based logout; paliek savietojamībai
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh = request.data.get("refresh")
        if not refresh:
            return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh)
            token.blacklist()
        except Exception:
            return Response({"detail": "Invalid refresh token."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "Logged out."}, status=status.HTTP_200_OK)
