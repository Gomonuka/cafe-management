from rest_framework import serializers
from .models import Order, OrderItem, OrderStatusHistory


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = "__all__"


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusHistory
        fields = "__all__"


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
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
