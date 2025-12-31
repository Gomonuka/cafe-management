import re
from rest_framework import serializers
from .models import Company, CompanyWorkingHour


PHONE_RE = re.compile(r"^\+\d[\d\s\-]{6,20}$")  # vienkarsa validacija ar valsts kodu


class WorkingHourInputSerializer(serializers.Serializer):
    # Ievadei: viena diena ar "No" un "Lidz"
    weekday = serializers.IntegerField(min_value=0, max_value=6)
    from_time = serializers.TimeField()
    to_time = serializers.TimeField()

    def validate(self, attrs):
        # Validacija: No < Lidz (COMP_004) vai No <= Lidz (COMP_005),
        # un sleegta diena = 00:00-00:00
        ft = attrs["from_time"]
        tt = attrs["to_time"]

        is_closed = (ft.strftime("%H:%M") == "00:00" and tt.strftime("%H:%M") == "00:00")
        if is_closed:
            return attrs

        if ft >= tt:
            raise serializers.ValidationError("Darba laikam jabut korektam: 'No' jabut mazakam par 'Lidz'.")
        return attrs


class WorkingHourPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyWorkingHour
        fields = ["weekday", "from_time", "to_time"]


class CompanyPublicSerializer(serializers.ModelSerializer):
    # Klientam: logotips, nosaukums, adrese, darba laiks + open_now
    working_hours = WorkingHourPublicSerializer(many=True, read_only=True)
    open_now = serializers.SerializerMethodField()
    address_line = serializers.CharField(source="address_line1")

    class Meta:
        model = Company
        fields = ["id", "logo", "name", "address_line", "city", "country", "working_hours", "open_now"]

    def get_open_now(self, obj: Company) -> bool:
        return obj.is_open_now()


class CompanyAdminListSerializer(serializers.ModelSerializer):
    # SA sarakstam: ID, nosaukums, statuss
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
    # Detalizetai informacijai (COMP_003) + darba laiki
    working_hours = WorkingHourPublicSerializer(many=True, read_only=True)
    address_line = serializers.CharField(source="address_line1")

    class Meta:
        model = Company
        fields = [
            "id", "name", "logo", "address_line", "city", "country",
            "phone", "email", "description",
            "working_hours",
            "is_active", "is_blocked", "deleted_at",
        ]
        read_only_fields = ["is_blocked", "deleted_at"]


class CompanyCreateUpdateSerializer(serializers.ModelSerializer):
    # COMP_004/COMP_005: izveide/redigesana ar strukturetiem darba laikiem
    working_hours = WorkingHourInputSerializer(many=True)
    address_line = serializers.CharField(source="address_line1")

    class Meta:
        model = Company
        fields = [
            "name", "email", "phone", "country", "city", "address_line",
            "description", "logo", "working_hours"
        ]

    def validate_name(self, value):
        if not value or len(value) > 255:
            raise serializers.ValidationError("Uzņēmuma nosaukums ir obligats un lidz 255 simboliem.")
        return value

    def validate_email(self, value):
        if not value or len(value) > 255:
            raise serializers.ValidationError("E-pasts ir obligats un lidz 255 simboliem.")
        return value.lower().strip()

    def validate_phone(self, value):
        if not PHONE_RE.match(value.strip()):
            raise serializers.ValidationError("Talrunim jabut ar valsts kodu (piem., +371...).")
        return value.strip()

    def validate_country(self, value):
        if not value or len(value) > 255:
            raise serializers.ValidationError("Valsts ir obligata un lidz 255 simboliem.")
        return value

    def validate_city(self, value):
        if not value or len(value) > 255:
            raise serializers.ValidationError("Pilseta ir obligata un lidz 255 simboliem.")
        return value

    def validate_address_line(self, value):
        if not value or len(value) > 255:
            raise serializers.ValidationError("Adrese ir obligata un lidz 255 simboliem.")
        return value

    def validate_description(self, value):
        if not value or len(value) > 1000:
            raise serializers.ValidationError("Apraksts ir obligats un lidz 1000 simboliem.")
        return value

    def validate_logo(self, value):
        if not value:
            raise serializers.ValidationError("Uzņēmuma logotips ir obligats.")
        return value

    def validate_working_hours(self, value):
        # Jābūt 7 ierakstiem (katrai dienai)
        if len(value) != 7:
            raise serializers.ValidationError("Darba laikiem jabut noraditiem katrai nedelas dienai (7 ieraksti).")
        weekdays = [x["weekday"] for x in value]
        if sorted(weekdays) != [0, 1, 2, 3, 4, 5, 6]:
            raise serializers.ValidationError("Darba laiku dienam jabut 0..6 bez dublikatiem.")
        return value

    def create(self, validated_data):
        # Izveido uzņēmumu + darba laikus
        wh_data = validated_data.pop("working_hours")
        company = Company.objects.create(**validated_data)

        CompanyWorkingHour.objects.bulk_create([
            CompanyWorkingHour(company=company, **row) for row in wh_data
        ])
        return company

    def update(self, instance, validated_data):
        # Redige uzņēmumu + pārraksta darba laikus
        wh_data = validated_data.pop("working_hours", None)

        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()

        if wh_data is not None:
            CompanyWorkingHour.objects.filter(company=instance).delete()
            CompanyWorkingHour.objects.bulk_create([
                CompanyWorkingHour(company=instance, **row) for row in wh_data
            ])

        return instance
