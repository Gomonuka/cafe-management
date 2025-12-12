from decimal import Decimal

from rest_framework import serializers

from .models import Order, OrderItem, OrderStatusHistory


class OrderItemSerializer(serializers.ModelSerializer):
    def _calc_line_total(self, validated_data):
        product = validated_data.get("product")
        quantity = validated_data.get("quantity") or 0
        unit_price = validated_data.get("unit_price")

        if unit_price is None and product:
            unit_price = product.price
        if unit_price is None:
            raise serializers.ValidationError("unit_price or product price is required.")

        unit_price = Decimal(unit_price)
        line_total = unit_price * Decimal(quantity)
        validated_data["unit_price"] = unit_price
        validated_data["line_total"] = line_total
        return validated_data

    def create(self, validated_data):
        validated_data = self._calc_line_total(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data = self._calc_line_total(validated_data)
        return super().update(instance, validated_data)

    def validate(self, attrs):
        order = attrs.get("order") or getattr(self.instance, "order", None)
        product = attrs.get("product") or getattr(self.instance, "product", None)
        if order and product and product.company_id != order.company_id:
            raise serializers.ValidationError("Product must belong to the same company as the order.")
        return super().validate(attrs)

    class Meta:
        model = OrderItem
        fields = "__all__"


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusHistory
        fields = "__all__"


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, required=False)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "number",
            "notes",
            "created_at",
            "order_type",
            "status",
            "company",
            "client",
            "total_amount",
            "last_modified_at",
            "items",
            "status_history",
        ]
        read_only_fields = [
            "number",
            "created_at",
            "last_modified_at",
            "total_amount",
        ]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        if not items_data:
            raise serializers.ValidationError("Order must contain at least one item.")
        order = Order.objects.create(**validated_data)

        total = Decimal("0")
        for item_data in items_data:
            serializer = OrderItemSerializer(data=item_data)
            serializer.is_valid(raise_exception=True)
            serializer.save(order=order)
            total += serializer.instance.line_total

        order.total_amount = total
        order.save(update_fields=["total_amount"])
        return order

    def update(self, instance, validated_data):
        # Items are not updated here; use OrderItem endpoints.
        validated_data.pop("items", None)
        return super().update(instance, validated_data)
