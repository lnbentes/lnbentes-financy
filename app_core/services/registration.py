import logging
from django.contrib.auth.models import User
from django.db import transaction
from django.core.exceptions import ObjectDoesNotExist
from app_core.models.registration import RegistrationRequest
from app_core.models.notification import Notification

logger = logging.getLogger(__name__)

def create_registration_request(data):
    """
    Cria uma nova solicitação de cadastro e gera notificações para todos os administradores.
    """
    from app_core.serializers.registration import RegistrationRequestSerializer
    
    serializer = RegistrationRequestSerializer(data=data)
    serializer.is_valid(raise_exception=True)
    
    with transaction.atomic():
        request_obj = serializer.save()
        
        # Obter todos os administradores
        admins = User.objects.filter(is_staff=True) | User.objects.filter(is_superuser=True)
        admins = admins.distinct()
        
        # Gerar notificações para os administradores
        notifications = []
        for admin in admins:
            notifications.append(
                Notification(
                    user=admin,
                    title="Novo Pedido de Cadastro",
                    message=f"O usuário '{request_obj.username}' ({request_obj.first_name} {request_obj.last_name}) solicitou cadastro.",
                    registration_request=request_obj
                )
            )
        
        if notifications:
            Notification.objects.bulk_create(notifications)
            
        logger.info(
            "Pedido de cadastro criado para o usuário: %s. Notificados %d administradores.", 
            request_obj.username, 
            len(notifications)
        )
        
    return request_obj

def approve_registration_request(request_id, admin_user):
    """
    Aprova um pedido de cadastro, criando o usuário correspondente de forma ativa, 
    atualiza o status do pedido para APPROVED, e marca todas as notificações associadas como lidas.
    """
    try:
        req = RegistrationRequest.objects.get(id=request_id, status='PENDING')
    except RegistrationRequest.DoesNotExist:
        raise ValueError("Pedido de cadastro pendente não encontrado.")

    with transaction.atomic():
        # Criar o usuário
        user = User(
            username=req.username,
            email=req.email,
            first_name=req.first_name,
            last_name=req.last_name,
            is_active=True
        )
        user.password = req.password  # Já está em hash
        user.save()
        
        # Atualizar status do pedido
        req.status = 'APPROVED'
        req.save()
        
        # Marcar todas as notificações associadas como lidas
        Notification.objects.filter(registration_request=req).update(is_read=True)
        
        logger.info("Pedido de cadastro %d aprovado por admin %s.", request_id, admin_user.username)
        
    return user

def reject_registration_request(request_id, admin_user):
    """
    Rejeita um pedido de cadastro, atualizando o status para REJECTED e marcando 
    todas as notificações associadas a ele como lidas.
    """
    try:
        req = RegistrationRequest.objects.get(id=request_id, status='PENDING')
    except RegistrationRequest.DoesNotExist:
        raise ValueError("Pedido de cadastro pendente não encontrado.")
        
    with transaction.atomic():
        req.status = 'REJECTED'
        req.save()
        
        # Marcar todas as notificações associadas como lidas
        Notification.objects.filter(registration_request=req).update(is_read=True)
        
        logger.info("Pedido de cadastro %d rejeitado por admin %s.", request_id, admin_user.username)
        
    return req
