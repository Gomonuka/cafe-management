from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from .reset_serializers import PasswordResetRequestSerializer, PasswordResetConfirmSerializer
from .password_reset import token_generator

from apps.notifications.services import send_email_from_template


def send_password_reset_email(to_email: str, link: str):
    context = {"reset_link": link}
    log = send_email_from_template(
        template_code="PASSWORD_RESET",
        to_email=to_email,
        context=context,
        company_id=None,
    )
    if log is None:
        # Fallback to console when template is missing or inactive.
        print(f"[RESET LINK] {to_email}: {link}")


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = PasswordResetRequestSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        user = s.context["user"]
        uid = urlsafe_base64_encode(force_bytes(user.id))
        token = token_generator.make_token(user)

        frontend_url = request.data.get("frontend_url") or "http://localhost:5173"
        link = f"{frontend_url}/reset-password?uid={uid}&token={token}"
        send_password_reset_email(user.email, link)

        return Response({"code": "P_012", "detail": "Paroles atiestatisanas saite ir nosutita."}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = PasswordResetConfirmSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        user = s.validated_data["user"]
        user.set_password(s.validated_data["new_password"])
        user.save(update_fields=["password"])

        return Response({"code": "P_013", "detail": "Parole ir veiksmigi atiestatita."}, status=status.HTTP_200_OK)
