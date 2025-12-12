from django.contrib.auth import authenticate, login, logout
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied

from .serializers import UserSerializer
from .permissions import IsAuthenticatedAndNotBlocked


class LoginView(APIView):
    authentication_classes = []  # disable session auth for credential submission
    permission_classes = []      # allow anonymous to attempt login

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

        login(request, user)
        return Response(UserSerializer(user).data)


class LogoutView(APIView):
    permission_classes = [IsAuthenticatedAndNotBlocked]

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)
