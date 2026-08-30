import logging
from django.db import models
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from app_core.models import PeerTransfer
from app_core.serializers import (
    PeerTransferSerializer, 
    SendPeerTransferSerializer, 
    AcceptPeerTransferSerializer,
    UserSerializer
)
from app_core.services.peer_transfer import PeerTransferService

logger = logging.getLogger(__name__)


@extend_schema(tags=['PeerTransfers'])
class PeerTransferViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Controller para transferências de valores entre usuários do sistema.

    Caminho Base: /api/peer-transfers/
    """
    serializer_class = PeerTransferSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return PeerTransfer.objects.filter(
            models.Q(sender=user) | models.Q(receiver=user)
        ).select_related('sender', 'sender_account', 'receiver', 'receiver_account').order_by('-created_at')

    @extend_schema(
        summary="Listar destinatários disponíveis para transferência",
        description="Retorna os outros usuários cadastrados no sistema para os quais o usuário atual pode enviar dinheiro.",
        parameters=[
            OpenApiParameter('search', OpenApiTypes.STR, description="Termo de busca por nome, username ou e-mail", required=False),
        ],
        responses={200: UserSerializer(many=True)}
    )
    @action(detail=False, methods=['get'], url_path='recipients')
    def recipients(self, request):
        search = request.query_params.get('search')
        users = PeerTransferService.list_recipients(request.user, search=search)
        return Response(UserSerializer(users, many=True).data)

    @extend_schema(
        summary="Enviar transferência para outro usuário",
        description="Debita o valor da conta de origem informada, cria a transferência pendente e notifica o destinatário.",
        request=SendPeerTransferSerializer,
        responses={201: PeerTransferSerializer}
    )
    def create(self, request, *args, **kwargs):
        serializer = SendPeerTransferSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        try:
            transfer = PeerTransferService.send_transfer(
                sender_user=request.user,
                sender_account_id=data['sender_account'],
                receiver_user_id=data['receiver_id'],
                amount=data['amount'],
                description=data.get('description', ''),
                target_date=data.get('date')
            )
            return Response(PeerTransferSerializer(transfer).data, status=status.HTTP_201_CREATED)
        except ValueError as err:
            return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Aceitar transferência recebida",
        description="O destinatário escolhe em qual de suas contas deseja depositar o valor da transferência.",
        request=AcceptPeerTransferSerializer,
        responses={200: PeerTransferSerializer}
    )
    @action(detail=True, methods=['post'], url_path='accept')
    def accept(self, request, pk=None):
        serializer = AcceptPeerTransferSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        receiver_account_id = serializer.validated_data['receiver_account']
        try:
            transfer = PeerTransferService.accept_transfer(
                receiver_user=request.user,
                transfer_id=pk,
                receiver_account_id=receiver_account_id
            )
            return Response(PeerTransferSerializer(transfer).data, status=status.HTTP_200_OK)
        except ValueError as err:
            return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Recusar transferência recebida",
        description="O destinatário recusa a transferência, estornando o valor para a conta do remetente.",
        responses={200: PeerTransferSerializer}
    )
    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        try:
            transfer = PeerTransferService.reject_transfer(
                receiver_user=request.user,
                transfer_id=pk
            )
            return Response(PeerTransferSerializer(transfer).data, status=status.HTTP_200_OK)
        except ValueError as err:
            return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Cancelar transferência enviada",
        description="O remetente cancela a transferência pendente antes do aceite, estornando o valor para sua conta.",
        responses={200: PeerTransferSerializer}
    )
    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        try:
            transfer = PeerTransferService.cancel_transfer(
                sender_user=request.user,
                transfer_id=pk
            )
            return Response(PeerTransferSerializer(transfer).data, status=status.HTTP_200_OK)
        except ValueError as err:
            return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)
