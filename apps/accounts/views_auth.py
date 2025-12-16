from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from rest_framework.generics import CreateAPIView
from .serializers import UserSerializer
from .serializers_auth import RegisterSerializer

from django.contrib.auth import authenticate, get_user_model

from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class RegisterView(CreateAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = RegisterSerializer

class LoginView(APIView):
    """
    JWT login:
      - pieņem username + password
      - atgriež access + refresh
      - (pēc izvēles) atgriež arī user profilu
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            raise AuthenticationFailed("Username and password are required.")

        user = authenticate(request, username=username, password=password)
        if not user:
            raise AuthenticationFailed("Invalid credentials.")

        if getattr(user, "is_blocked", False):
            raise PermissionDenied("User is blocked.")

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,  # можно убрать, если не нужно
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """
    JWT logout (без blacklist):
      - serverī neko īpaši nedara
      - front-end vienkārši izdzēš tokenus (localStorage)
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        return Response(status=status.HTTP_204_NO_CONTENT)
    