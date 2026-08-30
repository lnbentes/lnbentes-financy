import logging
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view
from app_core.models.registration import RegistrationRequest
from app_core.serializers.registration import RegistrationRequestSerializer
from app_core.services.registration import (
    create_registration_request, 
    approve_registration_request, 
    reject_registration_request
)

logger = logging.getLogger(__name__)

@extend_schema_view(
    create=extend_schema(
        summary="Solicitar novo cadastro",
        description="Endpoint público para que novos usuários solicitem cadastro no sistema.",
        request=RegistrationRequestSerializer,
        responses={201: RegistrationRequestSerializer}
    ),
    list=extend_schema(
        summary="Listar pedidos de cadastro",
        description="Endpoint restrito a administradores para listar todos os pedidos de cadastro.",
        responses={200: RegistrationRequestSerializer(many=True)}
    ),
    retrieve=extend_schema(
        summary="Detalhar pedido de cadastro",
        description="Endpoint restrito a administradores para visualizar um pedido específico.",
        responses={200: RegistrationRequestSerializer}
    )
)
class RegistrationRequestViewSet(viewsets.ModelViewSet):
    queryset = RegistrationRequest.objects.all()
    serializer_class = RegistrationRequestSerializer
    throttle_scope = 'registration'

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def create(self, request, *args, **kwargs):
        try:
            req_obj = create_registration_request(request.data)
            serializer = self.get_serializer(req_obj)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error("Erro ao processar pedido de cadastro: %s", str(e))
            # O rest_framework trata automaticamente as validações lançadas no serializer
            raise e

    @extend_schema(
        summary="Aprovar pedido de cadastro",
        description="Aprova a solicitação e cria o usuário ativo correspondente no sistema.",
        request=None,
        responses={200: None}
    )
    @action(detail=True, methods=['POST'], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, pk=None):
        try:
            approve_registration_request(pk, request.user)
            return Response({'message': 'Pedido aprovado com sucesso e usuário criado.'}, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error("Erro inesperado ao aprovar cadastro: %s", str(e))
            return Response({'error': 'Erro interno do servidor.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(
        summary="Rejeitar pedido de cadastro",
        description="Rejeita a solicitação de cadastro do usuário.",
        request=None,
        responses={200: None}
    )
    @action(detail=True, methods=['POST'], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        try:
            reject_registration_request(pk, request.user)
            return Response({'message': 'Pedido de cadastro rejeitado com sucesso.'}, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error("Erro inesperado ao rejeitar cadastro: %s", str(e))
            return Response({'error': 'Erro interno do servidor.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
