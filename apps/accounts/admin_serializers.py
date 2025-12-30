from rest_framework import serializers
from apps.accounts.models import User

class AdminUserListSerializer(serializers.ModelSerializer):
    # SA sarakstam rādām tikai ID, username, role (kā prasīts USER_008)
    class Meta:
        model = User
        fields = ["id", "username", "role"]
