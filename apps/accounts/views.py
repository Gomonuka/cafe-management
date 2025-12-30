from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

from apps.accounts.models import User
from .serializers import RegisterSerializer, ProfileReadSerializer, ProfileUpdateSerializer


class RegisterView(generics.CreateAPIView):
    # USER_001: konta izveide (KL/UA)
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        s = self.get_serializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.save()

        # Ja izvēlēts “ienākt uzreiz” – atgriež JWT tokenus (un FE var novirzīt uz profilu)
        if getattr(user, "_auto_login", False):
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "code": "P_001",  # “konts izveidots” (te tikai kā piemērs)
                    "detail": "Konts ir veiksmīgi izveidots.",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
                status=status.HTTP_201_CREATED,
            )

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

        # JWT gadījumā sesija ir FE pusē, bet mēs varam nobloķēt refresh tokenu, ja FE to atsūta
        # Šeit pietiek ar profila deaktivizēšanu; StrictJWTAuthentication bloķēs piekļuvi.
        return Response({"code": "P_004", "detail": "Profils ir deaktivizēts."}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    # USER_003: atslēgties (refresh token blacklisting)
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # FE atsūta refresh tokenu, lai to iekļautu blacklist
        refresh = request.data.get("refresh")
        if not refresh:
            return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh)
            token.blacklist()
        except Exception:
            return Response({"detail": "Invalid refresh token."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "Logged out."}, status=status.HTTP_200_OK)
