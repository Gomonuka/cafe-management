from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied

from apps.notifications.services import send_templated_email
from .permissions import IsAuthenticatedAndNotBlocked

User = get_user_model()
token_generator = PasswordResetTokenGenerator()


class PasswordResetRequestView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        email = request.data.get("email")
        reset_base = request.data.get(
            "reset_base_url",
            getattr(request, "reset_base_url", None)
            or getattr(request, "META", {}).get("HTTP_ORIGIN")
            or getattr(request._request, "build_absolute_uri", lambda: None)(),
        )

        if not email:
            raise ValidationError("Email is required.")

        user = User.objects.filter(email=email).first()
        if not user:
            return Response(status=status.HTTP_204_NO_CONTENT)

        if getattr(user, "is_blocked", False):
            raise PermissionDenied("User is blocked.")

        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = token_generator.make_token(user)

        if not reset_base:
            reset_base = getattr(
                request, "scheme", "http"
            ) + "://" + request.get_host() + "/reset-password"

        if reset_base.endswith("/"):
            reset_link = f"{reset_base}{uidb64}/{token}/"
        else:
            reset_link = f"{reset_base}/{uidb64}/{token}/"

        send_templated_email(
            code="password_reset_request",
            to_email=user.email,
            context={
                "username": user.username,
                "reset_link": reset_link,
            },
            receiver_user=user,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class PasswordResetConfirmView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        uidb64 = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("new_password")

        if not uidb64 or not token or not new_password:
            raise ValidationError("uid, token and new_password are required.")

        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except Exception:
            raise ValidationError("Invalid reset link.")

        if getattr(user, "is_blocked", False):
            raise PermissionDenied("User is blocked.")

        if not token_generator.check_token(user, token):
            raise ValidationError("Invalid or expired token.")

        user.set_password(new_password)
        user.save(update_fields=["password"])

        send_templated_email(
            code="password_reset_success",
            to_email=user.email,
            context={"username": user.username},
            receiver_user=user,
        )
        return Response(status=status.HTTP_200_OK)
