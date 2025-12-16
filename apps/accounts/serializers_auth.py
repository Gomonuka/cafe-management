from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """
    Vieslietotājs var reģistrēties tikai kā:
      - client
      - company_admin

    Darbinieku pašreģistrācija NAV atļauta.
    Sistēmas administratoru arī nevar izveidot ar reģistrāciju.
    """

    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["username", "email", "password", "role", "language", "theme", "avatar", "company"]
        extra_kwargs = {
            "company": {"required": False, "allow_null": True},
            "avatar": {"required": False, "allow_null": True},
            "language": {"required": False},
            "theme": {"required": False},
        }

    def validate_role(self, value):
        if value not in ("client", "company_admin"):
            raise serializers.ValidationError("Only client or company_admin can self-register.")
        return value

    def validate(self, attrs):
        attrs.pop("company", None)
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
