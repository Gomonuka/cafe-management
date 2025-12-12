from rest_framework import serializers
from .models import MenuCategory, Product


class MenuCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuCategory
        fields = "__all__"


class ProductSerializer(serializers.ModelSerializer):
    category = MenuCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=MenuCategory.objects.all(),
        write_only=True,
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "image",
            "price",
            "is_available",
            "company",
            "category",
            "category_id",
            "available_quantity",
        ]
        read_only_fields = ["available_quantity"]

    def validate_price(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")
        return value

    def validate(self, attrs):
        # Ensure category/company alignment
        company = attrs.get("company") or getattr(self.instance, "company", None)
        category = attrs.get("category") or getattr(self.instance, "category", None)
        if company and category and category.company_id != company.id:
            raise serializers.ValidationError("Category must belong to the same company.")
        return super().validate(attrs)

    def get_available_quantity(self, obj):
        # If no recipe components, treat as not available via stock (0)
        recipe_components = list(obj.recipe_components.select_related("inventory_item"))
        if not recipe_components:
            return 0

        max_units = None
        for rc in recipe_components:
            inv = rc.inventory_item
            if rc.quantity <= 0:
                return 0
            possible = int(inv.quantity // rc.quantity)
            max_units = possible if max_units is None else min(max_units, possible)
        return max_units or 0

    available_quantity = serializers.SerializerMethodField()
