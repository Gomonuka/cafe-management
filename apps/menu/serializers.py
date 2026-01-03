from rest_framework import serializers
from apps.accounts.models import User
from apps.inventory.models import InventoryItem

from .models import MenuCategory, Product, RecipeItem


class RecipeItemInputSerializer(serializers.Serializer):
    # Ievadei: sastāvdaļa + daudzums
    inventory_item_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=3)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Daudzumam jābūt pozitīvam.")
        return value


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuCategory
        fields = ["id", "name", "description", "is_active"]


class ProductPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "price", "is_available"]


class ProductAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "price", "is_available", "category_id", "photo"]


class MenuPublicSerializer(serializers.Serializer):
    categories = serializers.ListField()


class MenuAdminSerializer(serializers.Serializer):
    categories = serializers.ListField()
    products = serializers.ListField()


class CategoryCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuCategory
        fields = ["name", "description", "is_active"]

    def validate_name(self, value):
        if not value or len(value) > 255:
            raise serializers.ValidationError("Nosaukums ir obligāts un līdz 255 simboliem.")
        return value

    def validate_description(self, value):
        if value and len(value) > 1000:
            raise serializers.ValidationError("Apraksts nedrīkst pārsniegt 1000 simbolus.")
        return value


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    # Produkta izveide/rediģēšana ar recepti
    recipe = RecipeItemInputSerializer(many=True, write_only=True, required=False, allow_empty=True)

    class Meta:
        model = Product
        fields = ["name", "photo", "category", "is_available", "price", "recipe"]

    def validate_name(self, value):
        if not value or len(value) > 255:
            raise serializers.ValidationError("Produkta nosaukums ir obligāts un līdz 255 simboliem.")
        return value

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Cena par vienību ir jābūt pozitīvai.")
        return value

    def validate_photo(self, value):
        if not value:
            raise serializers.ValidationError("Produkta fotogrāfija ir obligāta.")
        return value

    def validate_recipe(self, value):
        # Recepte var būt tukša izveides brīdī
        if not value:
            return []
        return value

    def validate(self, attrs):
        company = self.context["company"]
        recipe = attrs.get("recipe", [])
        cleaned = []
        for row in recipe:
            inv = row.get("inventory_item_id")
            amt = row.get("amount")
            if inv is None or amt is None:
                continue
            cleaned.append(row)

        attrs["recipe"] = cleaned

        ids = [x["inventory_item_id"] for x in cleaned]

        if ids:
            inv_qs = InventoryItem.objects.filter(company=company, id__in=ids)
            if inv_qs.count() != len(set(ids)):
                raise serializers.ValidationError("Recepte satur noliktavas sastāvdaļu, kas nepieder uzņēmumam.")

        category = attrs.get("category")
        if category and category.company_id != company.id:
            raise serializers.ValidationError({"category": "Kategorija nepieder uzņēmumam."})
        return attrs

    def create(self, validated_data):
        recipe_data = validated_data.pop("recipe", [])
        company = self.context["company"]

        product = Product.objects.create(company=company, **validated_data)

        if recipe_data:
            items = [
                RecipeItem(product=product, inventory_item_id=row["inventory_item_id"], amount=row["amount"])
                for row in recipe_data
            ]
            RecipeItem.objects.bulk_create(items)
        return product

    def update(self, instance, validated_data):
        recipe_data = validated_data.pop("recipe", None)

        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()

        if recipe_data is not None:
            RecipeItem.objects.filter(product=instance).delete()
            items = [
                RecipeItem(product=instance, inventory_item_id=row["inventory_item_id"], amount=row["amount"])
                for row in recipe_data
            ]
            RecipeItem.objects.bulk_create(items)

        return instance
