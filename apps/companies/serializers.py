import re
from rest_framework import serializers
from .models import Company


PHONE_RE = re.compile(r"^\+\d[\d\s\-]{6,20}$")  # vienkārša validācija ar valsts kodu


class CompanyPublicSerializer(serializers.ModelSerializer):
    address_line = serializers.CharField(source="address_line1")
    open_now = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = ["id", "logo", "name", "address_line", "city", "country", "open_now"]

    def get_open_now(self, obj: Company) -> bool:
        return obj.is_open_now()


class CompanyAdminListSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = ["id", "name", "status"]

    def get_status(self, obj: Company) -> str:
        if obj.deleted_at is not None:
            return "deleted"
        if obj.is_blocked:
            return "blocked"
        if not obj.is_active:
            return "inactive"
        return "active"


class CompanyDetailSerializer(serializers.ModelSerializer):
    address_line = serializers.CharField(source="address_line1")

    class Meta:
        model = Company
        fields = [
            "id",
            "name",
            "logo",
            "address_line",
            "city",
            "country",
            "phone",
            "email",
            "description",
            "is_active",
            "is_blocked",
            "deleted_at",
        ]
        read_only_fields = ["is_blocked", "deleted_at"]


class CompanyCreateUpdateSerializer(serializers.ModelSerializer):
    address_line = serializers.CharField(source="address_line1")

    class Meta:
        model = Company
        fields = [
            "name",
            "email",
            "phone",
            "country",
            "city",
            "address_line",
            "description",
            "logo",
            "is_active",
        ]

    def validate_name(self, value):
        if not value or len(value) > 255:
            raise serializers.ValidationError("Uzņēmuma nosaukums ir obligāts un līdz 255 simboliem.")
        return value

    def validate_email(self, value):
        if not value or len(value) > 255:
            raise serializers.ValidationError("E-pasts ir obligāts un līdz 255 simboliem.")
        return value.lower().strip()

    def validate_phone(self, value):
        if not PHONE_RE.match(value.strip()):
            raise serializers.ValidationError("Tālrunim jābūt ar valsts kodu (piem., +371...).")
        return value.strip()

    def validate_country(self, value):
        if not value or len(value) > 255:
            raise serializers.ValidationError("Valsts ir obligāta un līdz 255 simboliem.")
        return value

    def validate_city(self, value):
        if not value or len(value) > 255:
            raise serializers.ValidationError("Pilsēta ir obligāta un līdz 255 simboliem.")
        return value

    def validate_address_line(self, value):
        if not value or len(value) > 255:
            raise serializers.ValidationError("Adrese ir obligāta un līdz 255 simboliem.")
        return value

    def validate_description(self, value):
        if not value or len(value) > 1000:
            raise serializers.ValidationError("Apraksts ir obligāts un līdz 1000 simboliem.")
        return value

    def validate_logo(self, value):
        if not value:
            raise serializers.ValidationError("Uzņēmuma logotips ir obligāts.")
        return value
