# apps/accounts/auth_views.py
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .auth_serializers import EmailTokenObtainPairSerializer

ACCESS_COOKIE = "access_token"
REFRESH_COOKIE = "refresh_token"
COOKIE_KW = dict(httponly=True, samesite="Lax", secure=not settings.DEBUG)
ACCESS_MAX_AGE = 60 * 30  # 30min
REFRESH_MAX_AGE = 60 * 60 * 24 * 7  # 7d

def set_jwt_cookies(response: Response, refresh: RefreshToken):
    response.set_cookie(ACCESS_COOKIE, str(refresh.access_token), max_age=ACCESS_MAX_AGE, **COOKIE_KW)
    response.set_cookie(REFRESH_COOKIE, str(refresh), max_age=REFRESH_MAX_AGE, **COOKIE_KW)

def clear_jwt_cookies(response: Response):
    # Django's delete_cookie neņem secure param; samesite pietiek
    response.delete_cookie(ACCESS_COOKIE, samesite="Lax")
    response.delete_cookie(REFRESH_COOKIE, samesite="Lax")

class EmailLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # Autentifikacija ar e-pastu (USER_002)
        s = EmailTokenObtainPairSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        user = s.validated_data["user"]
        refresh = RefreshToken.for_user(user)
        payload = {"detail": "Pierakstīšanās notika veiksmīgi.", "requires_company_creation": False, "requires_profile_completion": False}
        if user.role == "company_admin" and not user.company_id:
            payload["requires_company_creation"] = True
        if not getattr(user, "profile_completed", False):
            payload["requires_profile_completion"] = True
        resp = Response(payload, status=status.HTTP_200_OK)
        set_jwt_cookies(resp, refresh)
        return resp

class RefreshCookieView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(REFRESH_COOKIE)
        if not refresh_token:
            return Response({"detail": "Refresh tokens nav atrasts."}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            refresh = RefreshToken(refresh_token)
        except TokenError:
            return Response({"detail": "Refresh tokens nav derīgs."}, status=status.HTTP_401_UNAUTHORIZED)

        user_id = refresh.payload.get("user_id")
        user = get_user_model().objects.filter(id=user_id, is_active=True).first()
        if not user or getattr(user, "deleted_at", None) is not None or getattr(user, "is_blocked", False):
            resp = Response({"detail": "Lietotājs nav aktīvs."}, status=status.HTTP_401_UNAUTHORIZED)
            clear_jwt_cookies(resp)
            return resp

        new_refresh = RefreshToken.for_user(user)
        resp = Response(status=status.HTTP_200_OK)
        set_jwt_cookies(resp, new_refresh)
        return resp

class LogoutCookieView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token_str = request.COOKIES.get(REFRESH_COOKIE) or request.data.get("refresh")
        if token_str:
            try:
                token = RefreshToken(token_str)
                token.blacklist()
            except TokenError:
                pass
        resp = Response({"detail": "Izrakstīšanās notika veiksmīgi."}, status=status.HTTP_200_OK)
        clear_jwt_cookies(resp)
        return resp
