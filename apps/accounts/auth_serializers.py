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

        # 1) Pārbauda, vai lietotājs eksistē (P_008) un nav dzēsts/neaktīvs
        user = User.objects.all_with_deleted().filter(email=email).first()
        if not user:
            raise serializers.ValidationError({"code": "P_008", "detail": "Lietotājs ar norādīto e-pastu nav atrasts."})
        if user.deleted_at is not None or not user.is_active:
            raise serializers.ValidationError({"code": "P_008", "detail": "Lietotājs ir dzēsts vai neaktīvs."})

        # 2) Pārbauda, vai konts nav bloķēts
        if user.is_blocked:
            raise serializers.ValidationError({"code": "P_018", "detail": "Lietotāja profils ir bloķēts."})

        # 3) Pārbauda paroles atbilstību (P_009)
        # authenticate pēc noklusējuma strādā ar username, tāpēc izmantojam user.username
        authed = authenticate(username=user.username, password=password)
        if not authed:
            raise serializers.ValidationError({"code": "P_009", "detail": "Nepareiza parole."})

        attrs["user"] = user
        return attrs
