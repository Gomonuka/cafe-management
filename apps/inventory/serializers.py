from rest_framework import serializers
from apps.accounts.models import User
from .models import InventoryItem


class InventoryListSerializer(serializers.ModelSerializer):
    # INV_001: sarakstam rādam nosaukums, mērvienība, atlikums
    class Meta:
        model = InventoryItem
        fields = ["id", "name", "unit", "quantity"]


class InventoryCreateSerializer(serializers.ModelSerializer):
    # INV_002: izveide (UA)
    class Meta:
        model = InventoryItem
        fields = ["name", "quantity", "unit"]

    def validate_name(self, value):
        if not value or len(value) > 255:
            raise serializers.ValidationError("Nosaukums ir obligāts un līdz 255 simboliem.")
        return value

    def validate_unit(self, value):
        if not value or len(value) > 50:
            raise serializers.ValidationError("Mērvienība ir obligāta un līdz 50 simboliem.")
        return value

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Daudzumam jābūt pozitīvam.")
        return value


class InventoryUpdateAdminSerializer(serializers.ModelSerializer):
    # INV_003: UA var rediģēt visu
    class Meta:
        model = InventoryItem
        fields = ["name", "quantity", "unit"]

    def validate_name(self, value):
        if not value or len(value) > 255:
            raise serializers.ValidationError("Nosaukums ir obligāts un līdz 255 simboliem.")
        return value

    def validate_unit(self, value):
        if not value or len(value) > 50:
            raise serializers.ValidationError("Mērvienība ir obligāta un līdz 50 simboliem.")
        return value

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Daudzumam jābūt pozitīvam.")
        return value


class InventoryUpdateEmployeeSerializer(serializers.ModelSerializer):
    # INV_003: darbinieks var rediģēt tikai daudzumu
    class Meta:
        model = InventoryItem
        fields = ["quantity"]

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Daudzumam jābūt pozitīvam.")
        return value
