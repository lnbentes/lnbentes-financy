import logging

from rest_framework import viewsets, permissions
from drf_spectacular.utils import extend_schema

from app_core.serializers import CategorySerializer
from app_core.services import CategoryService

logger = logging.getLogger(__name__)


@extend_schema(tags=['Categories'])
class CategoryViewSet(viewsets.ModelViewSet):
    """
    Controller para gerenciamento de categorias de transações.

    Caminho Base: /api/categories/
    Endpoints:
    - GET    /api/categories/          (Listar categorias do usuário logado)
    - POST   /api/categories/          (Criar nova categoria)
    - GET    /api/categories/{id}/     (Obter detalhes de uma categoria específica)
    - PUT    /api/categories/{id}/     (Atualizar completamente uma categoria)
    - PATCH  /api/categories/{id}/     (Atualizar parcialmente uma categoria)
    - DELETE /api/categories/{id}/     (Excluir uma categoria)
    """
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CategoryService.get_user_queryset(self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
