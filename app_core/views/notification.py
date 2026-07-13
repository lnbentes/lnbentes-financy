import logging
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view
from app_core.models.notification import Notification
from app_core.serializers.notification import NotificationSerializer
from app_core.services.notification import (
    list_notifications, 
    mark_notification_as_read, 
    mark_all_notifications_as_read
)

logger = logging.getLogger(__name__)

@extend_schema_view(
    list=extend_schema(
        summary="Listar notificações do usuário",
        description="Retorna todas as notificações direcionadas ao usuário autenticado.",
        responses={200: NotificationSerializer(many=True)}
    ),
    retrieve=extend_schema(
        summary="Obter detalhes de uma notificação",
        description="Retorna os detalhes de uma notificação específica.",
        responses={200: NotificationSerializer}
    )
)
class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Apenas notificações do próprio usuário autenticado
        return list_notifications(self.request.user)

    @extend_schema(
        summary="Marcar notificação como lida",
        description="Marca uma notificação específica como lida.",
        request=None,
        responses={200: NotificationSerializer}
    )
    @action(detail=True, methods=['POST'])
    def read(self, request, pk=None):
        try:
            notification = mark_notification_as_read(pk, request.user)
            serializer = self.get_serializer(notification)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error("Erro ao marcar notificação como lida: %s", str(e))
            return Response({'error': 'Erro interno do servidor.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(
        summary="Marcar todas as notificações como lidas",
        description="Marca todas as notificações pendentes do usuário como lidas de uma só vez.",
        request=None,
        responses={200: None}
    )
    @action(detail=False, methods=['POST'], url_path='read-all')
    def read_all(self, request):
        try:
            count = mark_all_notifications_as_read(request.user)
            return Response({'message': f'{count} notificações foram marcadas como lidas.'}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error("Erro ao marcar todas as notificações como lidas: %s", str(e))
            return Response({'error': 'Erro interno do servidor.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
