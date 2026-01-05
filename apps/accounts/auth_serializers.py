from django.contrib.auth import authenticate
from rest_framework import serializers
from apps.accounts.models import User


class EmailTokenObtainPairSerializer(serializers.Serializer):
    # Lietotājs ievada e-pastu un paroli (USER_002)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs["email"].lower().strip()
        password = attrs["password"]

        # 1) Pārbauda, vai lietotājs eksistē un nav dzēsts/neaktīvs
        user = User.objects.all_with_deleted().filter(email=email).first()
        if not user:
            raise serializers.ValidationError({"detail": "Lietotājs ar norādīto e-pastu nav atrasts."})
        if user.deleted_at is not None or not user.is_active:
            raise serializers.ValidationError({"detail": "Lietotājs ir dzēsts vai neaktīvs."})

        # 2) Pārbauda, vai konts nav bloķēts
        if user.is_blocked:
            raise serializers.ValidationError({"detail": "Lietotāja profils ir bloķēts."})

        # 3) Pārbauda paroles atbilstību
        authed = authenticate(username=user.username, password=password)
        if not authed:
            raise serializers.ValidationError({"detail": "Nepareiza parole."})

        attrs["user"] = user
        return attrs
