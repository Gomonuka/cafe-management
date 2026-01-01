from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import make_password, check_password
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers

from apps.accounts.models import User, SecretQuestion
from .password_reset import token_generator


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    auto_login = serializers.BooleanField(required=False, default=False)  # sign in immediately
    role = serializers.ChoiceField(choices=[User.Role.CLIENT, User.Role.COMPANY_ADMIN])
    secret_question = serializers.PrimaryKeyRelatedField(queryset=SecretQuestion.objects.filter(is_active=True))
    secret_answer = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "role", "password", "auto_login", "secret_question", "secret_answer"]

    def validate_username(self, value):
        if len(value) > 255:
            raise serializers.ValidationError("Lietotajvards nedrikst parsniegt 255 simbolus.")
        if User.objects.all_with_deleted().filter(username=value).exists():
            raise serializers.ValidationError("Lietotajvards jau eksiste sistema.")
        return value

    def validate_email(self, value):
        v = value.lower().strip()
        if len(v) > 255:
            raise serializers.ValidationError("E-pasts nedrikst parsniegt 255 simbolus.")
        if User.objects.all_with_deleted().filter(email=v).exists():
            raise serializers.ValidationError("E-pasts jau eksiste sistema.")
        return v

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Parolei jabut vismaz 8 simbolus garai.")
        validate_password(value)
        return value

    def validate_secret_answer(self, value):
        if not value or len(value) > 255:
            raise serializers.ValidationError("Slepena atbilde ir obligata un lidz 255 simboliem.")
        return value

    def create(self, validated_data):
        auto_login = validated_data.pop("auto_login", False)
        password = validated_data.pop("password")
        secret_answer = validated_data.pop("secret_answer")

        user = User(**validated_data)
        user.is_active = True
        user.set_password(password)
        user.secret_answer = make_password(secret_answer)
        user.profile_completed = True  # registration collects required fields
        user.save()

        user._auto_login = auto_login
        return user


class ProfileReadSerializer(serializers.ModelSerializer):
    secret_question_text = serializers.CharField(source="secret_question.text", read_only=True)
    requires_profile_completion = serializers.SerializerMethodField()
    requires_company_creation = serializers.SerializerMethodField()
    has_secret_answer = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "avatar",
            "username",
            "first_name",
            "last_name",
            "email",
            "role",
            "company",
            "secret_question",
            "secret_question_text",
            "requires_profile_completion",
            "requires_company_creation",
            "has_secret_answer",
        ]

    def get_requires_profile_completion(self, obj):
        return not bool(obj.profile_completed)

    def get_requires_company_creation(self, obj):
        return obj.role == User.Role.COMPANY_ADMIN and obj.company_id is None

    def get_has_secret_answer(self, obj):
        return bool(obj.secret_answer)


class ProfileUpdateSerializer(serializers.ModelSerializer):
    new_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    repeat_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    secret_question = serializers.PrimaryKeyRelatedField(
        queryset=SecretQuestion.objects.filter(is_active=True), required=False, allow_null=True
    )
    secret_answer = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            "avatar",
            "username",
            "first_name",
            "last_name",
            "email",
            "new_password",
            "repeat_password",
            "secret_question",
            "secret_answer",
        ]

    def validate_username(self, value):
        if len(value) > 255:
            raise serializers.ValidationError("Lietotajvards nedrikst parsniegt 255 simbolus.")
        qs = User.objects.all_with_deleted().filter(username=value).exclude(id=self.instance.id)
        if qs.exists():
            raise serializers.ValidationError("Lietotajvards jau eksiste sistema.")
        return value

    def validate_email(self, value):
        v = value.lower().strip()
        if len(v) > 255:
            raise serializers.ValidationError("E-pasts nedrikst parsniegt 255 simbolus.")
        qs = User.objects.all_with_deleted().filter(email=v).exclude(id=self.instance.id)
        if qs.exists():
            raise serializers.ValidationError("E-pasts jau eksiste sistema.")
        return v

    def validate(self, attrs):
        new_password = attrs.get("new_password") or ""
        repeat_password = attrs.get("repeat_password") or ""
        secret_question = attrs.get("secret_question", None)
        secret_answer = attrs.get("secret_answer", "")

        if new_password:
            if len(new_password) < 8:
                raise serializers.ValidationError({"new_password": "Parolei jabut vismaz 8 simbolus garai."})
            if not repeat_password:
                raise serializers.ValidationError({"repeat_password": "Atkartota parole ir obligata."})
            if new_password != repeat_password:
                raise serializers.ValidationError({"repeat_password": "Atkartota parole nesakrit ar jauno paroli."})
            validate_password(new_password)

        # secret question/answer: atbilde obligata tikai, ja maina jautajumu vai atbilde tuksa
        if secret_question is not None:
            is_question_changed = self.instance.secret_question_id != getattr(secret_question, "id", None)
            if (is_question_changed or not self.instance.secret_answer) and not secret_answer:
                raise serializers.ValidationError({"secret_answer": "Slepena atbilde ir obligata."})
        if secret_answer and len(secret_answer) > 255:
            raise serializers.ValidationError({"secret_answer": "Slepena atbilde nedrikst parsniegt 255 simbolus."})

        return attrs

    def update(self, instance, validated_data):
        new_password = validated_data.pop("new_password", "")
        validated_data.pop("repeat_password", None)
        secret_answer = validated_data.pop("secret_answer", "")

        for k, v in validated_data.items():
            setattr(instance, k, v)

        if new_password:
            instance.set_password(new_password)
        if secret_answer:
            instance.secret_answer = make_password(secret_answer)

        # profile completion: secret question + answer must be set
        if instance.secret_question_id and instance.secret_answer:
            instance.profile_completed = True

        instance.save()
        return instance


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        email = value.lower().strip()
        user = User.objects.all_with_deleted().filter(email=email, deleted_at__isnull=True, is_active=True).first()
        if not user:
            raise serializers.ValidationError({"code": "P_008", "detail": "Lietotajs ar noradito e-pastu nav atrasts."})
        if user.is_blocked:
            raise serializers.ValidationError({"code": "P_018", "detail": "Lietotaja profils ir blokets."})
        if not user.secret_question or not user.secret_answer:
            raise serializers.ValidationError({"detail": "Slepenais jautajums nav iestatits."})
        self.context["user"] = user
        return email


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    answer = serializers.CharField()
    new_password = serializers.CharField(write_only=True)
    repeat_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        uid = attrs["uid"]
        token = attrs["token"]
        answer = attrs["answer"]
        new_password = attrs["new_password"]
        repeat_password = attrs["repeat_password"]

        if len(new_password) < 8:
            raise serializers.ValidationError({"new_password": "Parolei jabut vismaz 8 simbolus garai."})
        if new_password != repeat_password:
            raise serializers.ValidationError({"repeat_password": "Atkartota parole nesakrit ar jauno paroli."})

        try:
            user_id = urlsafe_base64_decode(uid).decode()
        except Exception:
            raise serializers.ValidationError({"detail": "Nederigs UID."})

        user = User.objects.all_with_deleted().filter(id=user_id, deleted_at__isnull=True, is_active=True).first()
        if not user:
            raise serializers.ValidationError({"detail": "Lietotajs nav atrasts."})

        if not token_generator.check_token(user, token):
            raise serializers.ValidationError({"detail": "Nederigs vai beidzies tokens."})

        if not check_password(answer, user.secret_answer):
            raise serializers.ValidationError({"detail": "Slepena atbilde ir nepareiza."})

        validate_password(new_password)
        attrs["user"] = user
        return attrs
