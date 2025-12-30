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
    # Šeit vēlāk pieslēgsi Brevo/notifications moduli (NOTIF_008).
    # Pagaidām var ielikt print/log vai izsaukumu uz savu email servisu.
    print(f"[RESET LINK] {to_email}: {link}")

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = PasswordResetRequestSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        user = s.context["user"]
        uid = urlsafe_base64_encode(force_bytes(user.id))
        token = token_generator.make_token(user)

        # Saite uz FE (piemērs): FRONTEND_URL/reset-password?uid=...&token=...
        frontend_url = request.data.get("frontend_url")  # pēc izvēles
        if not frontend_url:
            frontend_url = "http://localhost:5173"

        link = f"{frontend_url}/reset-password?uid={uid}&token={token}"
        send_password_reset_email(user.email, link)

        return Response({"code": "P_012", "detail": "Paroles atiestatīšanas saite ir nosūtīta."}, status=status.HTTP_200_OK)

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = PasswordResetConfirmSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        user = s.validated_data["user"]
        user.set_password(s.validated_data["new_password"])
        user.save(update_fields=["password"])

        return Response({"code": "P_013", "detail": "Parole ir veiksmīgi atiestatīta."}, status=status.HTTP_200_OK)
