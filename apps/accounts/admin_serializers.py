# apps/accounts/admin_serializers.py
from rest_framework import serializers
from apps.accounts.models import User

class AdminUserListSerializer(serializers.ModelSerializer):
    # Sistēmas administratora lietotāju sarakstam rādām ID, username, role un bloķēšanas statusu
    class Meta:
        model = User
        fields = ["id", "username", "role", "is_blocked"]
