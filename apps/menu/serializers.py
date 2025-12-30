from rest_framework import serializers
from apps.accounts.models import User
from apps.inventory.models import InventoryItem  # jāeksistē inventory app/modelim

from .models import MenuCategory, Product, RecipeItem


class RecipeItemInputSerializer(serializers.Serializer):
    # Ievadei: sastāvdaļa + daudzums
    inventory_item_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=3)

    def validate_amount(self, value):
        # Daudzumam jābūt pozitīvam
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
    # Klientam: kategorijas ar produktiem (tikai aktīvas kategorijas un pieejamie produkti)
    categories = serializers.ListField()


class MenuAdminSerializer(serializers.Serializer):
    # UA: kategoriju saraksts + produktu saraksts ar ID un nosaukumiem
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
    recipe = RecipeItemInputSerializer(many=True, write_only=True)

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

    def validate_recipe(self, value):
        # Recepte ir obligāta un vismaz ar 1 sastāvdaļu
        if not value or len(value) < 1:
            raise serializers.ValidationError("Recepte ir obligāta un jānorāda vismaz 1 sastāvdaļa.")
        return value

    def validate(self, attrs):
        # Pārbauda, ka sastāvdaļas pieder uzņēmuma noliktavai
        company = self.context["company"]
        recipe = attrs.get("recipe", [])
        ids = [x["inventory_item_id"] for x in recipe]

        inv_qs = InventoryItem.objects.filter(company=company, id__in=ids)
        if inv_qs.count() != len(set(ids)):
            raise serializers.ValidationError("Recepte satur noliktavas sastāvdaļu, kas nepieder uzņēmumam.")
        return attrs

    def create(self, validated_data):
        recipe_data = validated_data.pop("recipe")
        company = self.context["company"]

        product = Product.objects.create(company=company, **validated_data)

        items = []
        for row in recipe_data:
            items.append(
                RecipeItem(
                    product=product,
                    inventory_item_id=row["inventory_item_id"],
                    amount=row["amount"],
                )
            )
        RecipeItem.objects.bulk_create(items)
        return product

    def update(self, instance, validated_data):
        recipe_data = validated_data.pop("recipe", None)

        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()

        if recipe_data is not None:
            # Atjaunina recepti (pārraksta)
            RecipeItem.objects.filter(product=instance).delete()
            items = []
            for row in recipe_data:
                items.append(
                    RecipeItem(
                        product=instance,
                        inventory_item_id=row["inventory_item_id"],
                        amount=row["amount"],
                    )
                )
            RecipeItem.objects.bulk_create(items)

        return instance
