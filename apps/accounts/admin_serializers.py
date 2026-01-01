from rest_framework import serializers
from apps.accounts.models import User

class AdminUserListSerializer(serializers.ModelSerializer):
    # SA sarakstam rādām ID, username, role un statusu (bloķēts)
    class Meta:
        model = User
        fields = ["id", "username", "role", "is_blocked"]
