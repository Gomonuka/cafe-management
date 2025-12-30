from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed

class StrictJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user = super().get_user(validated_token)

        if getattr(user, "is_blocked", False):
            raise AuthenticationFailed("Lietotājs ir bloķēts.")

        if getattr(user, "deleted_at", None) is not None or not user.is_active:
            raise AuthenticationFailed("Lietotājs ir izdzēsts vai neaktīvs.")

        return user
