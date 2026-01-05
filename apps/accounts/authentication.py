# apps/accounts/authentication.py
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed

ACCESS_COOKIE = "access_token"

class StrictJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        # Header (Authorization) first, fallback to access token cookie
        header = self.get_header(request)
        raw_token = self.get_raw_token(header) if header else None
        if raw_token is None:
            raw_token = request.COOKIES.get(ACCESS_COOKIE)
        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token

    def get_user(self, validated_token):
        user = super().get_user(validated_token)

        if getattr(user, "is_blocked", False):
            raise AuthenticationFailed("Lietotājs ir bloķēts.")

        if getattr(user, "deleted_at", None) is not None or not user.is_active:
            raise AuthenticationFailed("Lietotājs ir dzēsts vai neaktīvs.")

        return user
