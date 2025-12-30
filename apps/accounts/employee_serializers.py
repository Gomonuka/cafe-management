from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from apps.accounts.models import User

class EmployeeListSerializer(serializers.ModelSerializer):
    # USER_010: darbinieku saraksts (ID + username)
    class Meta:
        model = User
        fields = ["id", "username"]

class EmployeeCreateSerializer(serializers.ModelSerializer):
    # USER_011: izveidot darbinieku
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "first_name", "last_name", "email", "password", "avatar"]

    def validate_username(self, value):
        if len(value) > 255:
            raise serializers.ValidationError("Lietotājvārds nedrīkst pārsniegt 255 simbolus.")
        if User.objects.all_with_deleted().filter(username=value).exists():
            raise serializers.ValidationError("Lietotājvārds jau eksistē sistēmā.")
        return value

    def validate_email(self, value):
        v = value.lower().strip()
        if len(v) > 255:
            raise serializers.ValidationError("E-pasts nedrīkst pārsniegt 255 simbolus.")
        if User.objects.all_with_deleted().filter(email=v).exists():
            raise serializers.ValidationError("E-pasts jau eksistē sistēmā.")
        return v

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Parolei jābūt vismaz 8 simbolus garai.")
        validate_password(value)
        return value

    def create(self, validated_data):
        # Darbiniekam vienmēr loma = DA, company paņemam no konteksta
        password = validated_data.pop("password")
        company = self.context["company"]

        user = User(**validated_data)
        user.role = User.Role.EMPLOYEE
        user.company = company
        user.is_active = True
        user.set_password(password)
        user.save()
        return user

class EmployeeUpdateSerializer(serializers.ModelSerializer):
    # USER_012: rediģēt darbinieku (username, vārds, uzvārds, email, avatar, jauna parole)
    new_password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["username", "first_name", "last_name", "email", "avatar", "new_password"]

    def validate_username(self, value):
        if len(value) > 255:
            raise serializers.ValidationError("Lietotājvārds nedrīkst pārsniegt 255 simbolus.")
        qs = User.objects.all_with_deleted().filter(username=value).exclude(id=self.instance.id)
        if qs.exists():
            raise serializers.ValidationError("Lietotājvārds jau eksistē sistēmā.")
        return value

    def validate_email(self, value):
        v = value.lower().strip()
        if len(v) > 255:
            raise serializers.ValidationError("E-pasts nedrīkst pārsniegt 255 simbolus.")
        qs = User.objects.all_with_deleted().filter(email=v).exclude(id=self.instance.id)
        if qs.exists():
            raise serializers.ValidationError("E-pasts jau eksistē sistēmā.")
        return v

    def validate_new_password(self, value):
        if value:
            if len(value) < 8:
                raise serializers.ValidationError("Parolei jābūt vismaz 8 simbolus garai.")
            validate_password(value)
        return value

    def update(self, instance, validated_data):
        new_password = validated_data.pop("new_password", "")
        for k, v in validated_data.items():
            setattr(instance, k, v)
        if new_password:
            instance.set_password(new_password)
        instance.save()
        return instance
