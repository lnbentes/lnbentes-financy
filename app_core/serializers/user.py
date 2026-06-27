from rest_framework import serializers
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True, help_text="Nome de usuário")
    password = serializers.CharField(required=True, help_text="Senha do usuário", write_only=True)

