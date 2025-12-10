from rest_framework import serializers
from .models import Company, CompanyWorkingHours


class CompanyWorkingHoursSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyWorkingHours
        fields = ["id", "weekday", "opens_at", "closes_at", "is_closed"]


class CompanySerializer(serializers.ModelSerializer):
    working_hours = CompanyWorkingHoursSerializer(many=True, read_only=True)
    working_hours_data = CompanyWorkingHoursSerializer(
        many=True, write_only=True, required=False
    )

    class Meta:
        model = Company
        fields = [
            "id",
            "name",
            "description",
            "country",
            "city",
            "address_line1",
            "logo",
            "phone",
            "email",
            "is_active",
            "working_hours",       # read-only
            "working_hours_data",  # write-only
        ]

    def create(self, validated_data):
        working_hours_data = validated_data.pop("working_hours_data", [])
        company = Company.objects.create(**validated_data)

        for wh in working_hours_data:
            CompanyWorkingHours.objects.create(company=company, **wh)

        return company

    def update(self, instance, validated_data):
        working_hours_data = validated_data.pop("working_hours_data", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if working_hours_data is not None:
            instance.working_hours.all().delete()
            for wh in working_hours_data:
                CompanyWorkingHours.objects.create(company=instance, **wh)

        return instance
