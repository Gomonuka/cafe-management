from rest_framework import serializers
from apps.menu.models import Product
from .models import Cart, CartItem, Order, OrderItem


class CartItemInputSerializer(serializers.Serializer):
    # Ievadei grozam: produkts + daudzums
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Daudzumam jābūt pozitīvam.")
        return value


class CartItemViewSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    unit_price = serializers.DecimalField(source="product.price", max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ["id", "product_id", "product_name", "quantity", "unit_price"]


class CartViewSerializer(serializers.Serializer):
    # Groza skatam: items + total
    items = CartItemViewSerializer(many=True)
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)


class CheckoutSerializer(serializers.Serializer):
    # ORDER_008: noformēt pasūtījumu
    company_id = serializers.IntegerField()
    order_type = serializers.ChoiceField(choices=Order.OrderType.choices)
    notes = serializers.CharField(required=False, allow_blank=True, max_length=1000)


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["product_id", "product_name", "quantity", "unit_price"]


class OrderClientSerializer(serializers.ModelSerializer):
    # ORDER_003: klienta skatam - detalizētāka informācija
    company_name = serializers.CharField(source="company.name", read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "created_at", "company_name", "status",
            "items", "total_amount", "order_type", "notes",
        ]


class OrderKanbanSerializer(serializers.ModelSerializer):
    # ORDER_004: uzņēmuma Kanban skatam
    class Meta:
        model = Order
        fields = ["id", "created_at", "order_type", "total_amount", "status"]


class OrderStatusChangeSerializer(serializers.Serializer):
    # ORDER_005: mainīt statusu
    new_status = serializers.ChoiceField(choices=Order.Status.choices)
