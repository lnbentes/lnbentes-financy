import logging

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers

from app_core.serializers import UserSerializer

logger = logging.getLogger(__name__)


@extend_schema(tags=['Users'])
class UserViewSet(viewsets.ModelViewSet):
    """
    Controller para gerenciamento de usuários.

    Caminho Base: /api/users/
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer

    def get_permissions(self):
        # Apenas admins podem criar/excluir usuários ou alternar flags admin
        if self.action in ['create', 'destroy', 'toggle_active', 'toggle_staff']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return User.objects.all().order_by('-date_joined')
        return User.objects.filter(id=user.id)

    def perform_update(self, serializer):
        # Usuários comuns não podem alterar suas próprias flags de permissão
        if not self.request.user.is_staff and not self.request.user.is_superuser:
            current_obj = self.get_object()
            serializer.save(
                is_staff=current_obj.is_staff,
                is_superuser=current_obj.is_superuser,
                is_active=current_obj.is_active,
            )
        else:
            serializer.save()

    @extend_schema(
        summary="Alternar status ativo/inativo",
        description="Ativa ou desativa um usuário no sistema.",
        responses={200: UserSerializer}
    )
    @action(detail=True, methods=['post'], url_path='toggle-active', permission_classes=[permissions.IsAdminUser])
    def toggle_active(self, request, pk=None):
        user_obj = self.get_object()
        if user_obj == request.user:
            return Response({'error': 'Você não pode desativar sua própria conta de administrador.'}, status=status.HTTP_400_BAD_REQUEST)
        user_obj.is_active = not user_obj.is_active
        user_obj.save()
        logger.info("Status do usuário %s alterado para is_active=%s por %s", user_obj.username, user_obj.is_active, request.user.username)
        return Response(self.get_serializer(user_obj).data)

    @extend_schema(
        summary="Alternar privilégio de administrador (Staff)",
        description="Concede ou revoga permissões de administrador para um usuário.",
        responses={200: UserSerializer}
    )
    @action(detail=True, methods=['post'], url_path='toggle-staff', permission_classes=[permissions.IsAdminUser])
    def toggle_staff(self, request, pk=None):
        user_obj = self.get_object()
        if user_obj == request.user and not request.user.is_superuser:
            return Response({'error': 'Você não pode revogar seu próprio acesso de staff.'}, status=status.HTTP_400_BAD_REQUEST)
        user_obj.is_staff = not user_obj.is_staff
        user_obj.save()
        logger.info("Permissão de staff do usuário %s alterada para is_staff=%s por %s", user_obj.username, user_obj.is_staff, request.user.username)
        return Response(self.get_serializer(user_obj).data)

    @extend_schema(
        summary="Redefinir ou alterar senha de usuário",
        description="Permite que o usuário altere sua própria senha ou que o administrador redefina a senha de qualquer conta.",
        request=inline_serializer(
            name='ResetPasswordRequest',
            fields={'password': serializers.CharField(required=True, min_length=8)}
        ),
        responses={200: inline_serializer(name='SuccessMsg', fields={'message': serializers.CharField()})}
    )
    @action(detail=True, methods=['post'], url_path='reset-password', permission_classes=[permissions.IsAuthenticated])
    def reset_password(self, request, pk=None):
        user_obj = self.get_object()
        if user_obj != request.user and not request.user.is_staff:
            return Response({'error': 'Você não tem permissão para alterar a senha deste usuário.'}, status=status.HTTP_403_FORBIDDEN)

        new_password = request.data.get('password')
        if not new_password or len(new_password) < 8:
            return Response({'error': 'A nova senha deve ter no mínimo 8 caracteres.'}, status=status.HTTP_400_BAD_REQUEST)
        user_obj.set_password(new_password)
        user_obj.save()
        logger.info("Senha do usuário %s redefinida por %s", user_obj.username, request.user.username)
        return Response({'message': f'Senha do usuário {user_obj.username} redefinida com sucesso.'})
