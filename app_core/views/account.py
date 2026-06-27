import logging

from rest_framework import viewsets, permissions
from drf_spectacular.utils import extend_schema

from app_core.serializers import AccountSerializer
from app_core.services import AccountService

logger = logging.getLogger(__name__)


@extend_schema(tags=['Accounts'])
class AccountViewSet(viewsets.ModelViewSet):
    """
    Controller para gerenciamento de contas financeiras.

    Caminho Base: /api/accounts/
    Endpoints:
    - GET    /api/accounts/          (Listar contas do usuário logado)
    - POST   /api/accounts/          (Criar nova conta)
    - GET    /api/accounts/{id}/     (Obter detalhes de uma conta específica)
    - PUT    /api/accounts/{id}/     (Atualizar completamente uma conta)
    - PATCH  /api/accounts/{id}/     (Atualizar parcialmente uma conta)
    - DELETE /api/accounts/{id}/     (Excluir uma conta)
    """
    serializer_class = AccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AccountService.get_user_queryset(self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
