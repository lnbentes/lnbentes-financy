import logging

from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from drf_spectacular.utils import extend_schema

from app_core.serializers import UserSerializer, LoginSerializer

logger = logging.getLogger(__name__)


@extend_schema(
    tags=['Auth'],
    summary="Login do usuário",
    description="Realiza a autenticação do usuário utilizando usuário e senha.",
    request=LoginSerializer,
    responses={
        200: UserSerializer,
        400: UserSerializer,  # or an error response dictionary
    }
)
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def api_login(request):
    """
    Caminho Base: /api/auth/login/
    Método: POST
    """
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({'error': 'Usuário e senha são obrigatórios.'}, status=400)

    user = authenticate(request, username=username, password=password)

    if user is not None:
        login(request, user)
        logger.info("Login bem-sucedido: %s", username)
        return Response({'message': 'Login successful', 'user': UserSerializer(user).data})

    logger.warning("Tentativa de login falhou para o usuário: %s", username)
    return Response({'error': 'Credenciais inválidas.'}, status=400)


@extend_schema(
    tags=['Auth'],
    summary="Logout do usuário",
    description="Encerra a sessão ativa do usuário autenticado.",
    responses={200: None}
)
@api_view(['POST'])
def api_logout(request):
    """
    Caminho Base: /api/auth/logout/
    Método: POST
    """
    logger.info("Logout: %s", request.user)
    logout(request)
    return Response({'message': 'Logged out successfully'})
