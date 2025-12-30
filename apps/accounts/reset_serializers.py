from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from apps.accounts.models import User
from .password_reset import token_generator

class PasswordResetRequestSerializer(serializers.Serializer):
    # Lietotājs ievada e-pastu (USER_007 - 1. solis)
    email = serializers.EmailField()

    def validate_email(self, value):
        email = value.lower().strip()
        user = User.objects.all_with_deleted().filter(email=email, deleted_at__isnull=True, is_active=True).first()
        if not user:
            raise serializers.ValidationError({"code": "P_008", "detail": "Lietotājs ar norādīto e-pastu nav atrasts."})
        if user.is_blocked:
            raise serializers.ValidationError({"code": "P_018", "detail": "Lietotāja profils ir bloķēts."})
        self.context["user"] = user
        return email

class PasswordResetConfirmSerializer(serializers.Serializer):
    # Lietotājs ievada jauno paroli (USER_007 - 2. solis)
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)
    repeat_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        uid = attrs["uid"]
        token = attrs["token"]
        new_password = attrs["new_password"]
        repeat_password = attrs["repeat_password"]

        if len(new_password) < 8:
            raise serializers.ValidationError({"new_password": "Parolei jābūt vismaz 8 simbolus garai."})
        if new_password != repeat_password:
            raise serializers.ValidationError({"repeat_password": "Atkārtotā parole nesakrīt ar jauno paroli."})

        try:
            user_id = urlsafe_base64_decode(uid).decode()
        except Exception:
            raise serializers.ValidationError({"detail": "Nederīgs UID."})

        user = User.objects.all_with_deleted().filter(id=user_id, deleted_at__isnull=True, is_active=True).first()
        if not user:
            raise serializers.ValidationError({"detail": "Lietotājs nav atrasts."})

        if not token_generator.check_token(user, token):
            raise serializers.ValidationError({"detail": "Nederīgs vai beidzies tokens."})

        validate_password(new_password)
        attrs["user"] = user
        return attrs
