from django.contrib.auth import get_user_model
from rest_framework import serializers

from .permissions import user_has_role

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "password",
            "avatar",
            "theme",
            "is_blocked",
            "role",
            "language",
            "company",
        ]
        read_only_fields = ["is_blocked"]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)

        request = self.context.get("request")
        request_user = getattr(request, "user", None)

        if not user_has_role(request_user, ["system_admin"]):
            validated_data.pop("role", None)

        if not user_has_role(request_user, ["system_admin", "company_admin"]):
            validated_data.pop("company", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
