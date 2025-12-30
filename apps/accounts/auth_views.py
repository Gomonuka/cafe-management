from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from .auth_serializers import EmailTokenObtainPairSerializer

class EmailLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # Autentifikācija ar e-pastu (USER_002)
        s = EmailTokenObtainPairSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        user = s.validated_data["user"]

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_200_OK,
        )
