from django.contrib.auth import get_user_model
from rest_framework import generics

from .serializers import UserSerializer
from .permissions import IsAuthenticatedAndNotBlocked

User = get_user_model()

class MeView(generics.RetrieveUpdateDestroyAPIView):
    """
    /api/me/
      - GET    → iegūt savu kontu
      - PATCH  → labot konta informāciju
      - DELETE → dzēst savu kontu

    Darbojas visām lomām:
      - Klients
      - Darbinieks
      - Uzņēmuma administrators
      - Sistēmas administrators
    """

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticatedAndNotBlocked]

    def get_object(self):
        return self.request.user
