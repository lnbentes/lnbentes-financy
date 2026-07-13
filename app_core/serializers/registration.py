import re
from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from app_core.models.registration import RegistrationRequest

class RegistrationRequestSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = RegistrationRequest
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password', 'status', 'created_at']
        read_only_fields = ['id', 'status', 'created_at']

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Este nome de usuário já está em uso por uma conta ativa.")
        if RegistrationRequest.objects.filter(username__iexact=value, status='PENDING').exists():
            raise serializers.ValidationError("Já existe um pedido de cadastro pendente para este usuário.")
        if not re.match(r'^[\w.@+-]+$', value):
            raise serializers.ValidationError("Nome de usuário inválido. Use apenas letras, números e @/./+/-/_.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Este endereço de e-mail já está em uso por uma conta ativa.")
        if RegistrationRequest.objects.filter(email__iexact=value, status='PENDING').exists():
            raise serializers.ValidationError("Já existe um pedido de cadastro pendente com este e-mail.")
        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("A senha deve ter pelo menos 8 caracteres.")
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("A senha deve conter pelo menos um número.")
        if not any(char.isupper() for char in value):
            raise serializers.ValidationError("A senha deve conter pelo menos uma letra maiúscula.")
        return value

    def create(self, validated_data):
        # Criptografa a senha antes de armazenar
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)
