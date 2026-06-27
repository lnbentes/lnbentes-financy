import logging

from rest_framework import viewsets, permissions
from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema

from app_core.serializers import UserSerializer

logger = logging.getLogger(__name__)


@extend_schema(tags=['Users'])
class UserViewSet(viewsets.ModelViewSet):
    """
    Controller para gerenciamento de usuários.

    Caminho Base: /api/users/
    Endpoints:
    - GET    /api/users/          (Listar todos os usuários)
    - POST   /api/users/          (Criar novo usuário)
    - GET    /api/users/{id}/     (Obter detalhes de um usuário específico)
    - PUT    /api/users/{id}/     (Atualizar completamente um usuário)
    - PATCH  /api/users/{id}/     (Atualizar parcialmente um usuário)
    - DELETE /api/users/{id}/     (Excluir um usuário)
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
