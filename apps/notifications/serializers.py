from rest_framework import serializers
from .models import EmailTemplate, EmailLog


class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = ["id", "code", "subject", "content", "is_active"]

    def validate_code(self, value):
        if not value or len(value) > 100:
            raise serializers.ValidationError("Šablona kods ir obligāts un līdz 100 simboliem.")
        return value

    def validate_subject(self, value):
        if not value or len(value) > 255:
            raise serializers.ValidationError("Tēma ir obligāta un līdz 255 simboliem.")
        return value

    def validate_content(self, value):
        if not value or len(value) > 5000:
            raise serializers.ValidationError("Saturs ir obligāts un līdz 5000 simboliem.")
        return value


class EmailLogListSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailLog
        fields = ["id", "recipient", "subject", "status", "created_at", "sent_at"]
