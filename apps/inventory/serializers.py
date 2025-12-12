from rest_framework import serializers
from .models import InventoryItem, InventoryMovement, RecipeComponent


class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = "__all__"

    def validate_quantity(self, value):
        if value is None or value < 0:
            raise serializers.ValidationError("Quantity must be non-negative.")
        return value

    def validate_min_quantity(self, value):
        if value is None or value < 0:
            raise serializers.ValidationError("Min quantity must be non-negative.")
        return value


class InventoryMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryMovement
        fields = "__all__"

    def validate_quantity_change(self, value):
        if value == 0:
            raise serializers.ValidationError("Quantity change cannot be zero.")
        return value

class RecipeComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipeComponent
        fields = "__all__"

    def validate_quantity(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero.")
        return value

    def validate(self, attrs):
        product = attrs.get("product") or getattr(self.instance, "product", None)
        inv_item = attrs.get("inventory_item") or getattr(self.instance, "inventory_item", None)
        if product and inv_item and product.company_id != inv_item.company_id:
            raise serializers.ValidationError("Product and inventory item must belong to the same company.")
        return super().validate(attrs)
        
