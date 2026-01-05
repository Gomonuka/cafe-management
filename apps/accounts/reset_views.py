# apps/accounts/reset_views.py
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from .serializers import PasswordResetRequestSerializer, PasswordResetConfirmSerializer
from .password_reset import token_generator

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = PasswordResetRequestSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        user = s.context["user"]
        uid = urlsafe_base64_encode(force_bytes(user.id))
        token = token_generator.make_token(user)
        question = user.secret_question.text if user.secret_question else ""

        return Response(
            {
                "code": "P_012",
                "detail": "Var turpināt paroles atiestatīšanu.",
                "uid": uid,
                "token": token,
                "question": question,
            },
            status=status.HTTP_200_OK,
        )

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = PasswordResetConfirmSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        user = s.validated_data["user"]
        user.set_password(s.validated_data["new_password"])
        user.save(update_fields=["password"])

        return Response({"code": "P_013", "detail": "Parole ir veiksmīgi atiestatīta."}, status=status.HTTP_200_OK)
