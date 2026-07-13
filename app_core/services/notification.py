import logging
from app_core.models.notification import Notification

logger = logging.getLogger(__name__)

def list_notifications(user):
    """
    Retorna a lista de notificações para um usuário específico.
    """
    return Notification.objects.filter(user=user)

def mark_notification_as_read(notification_id, user):
    """
    Marca uma notificação do usuário como lida.
    """
    try:
        notification = Notification.objects.get(id=notification_id, user=user)
        notification.is_read = True
        notification.save()
        logger.info("Notificação %d marcada como lida pelo usuário %s.", notification_id, user.username)
        return notification
    except Notification.DoesNotExist:
        raise ValueError("Notificação não encontrada.")

def mark_all_notifications_as_read(user):
    """
    Marca todas as notificações do usuário como lidas.
    """
    count = Notification.objects.filter(user=user, is_read=False).update(is_read=True)
    logger.info("Marcadas %d notificações como lidas pelo usuário %s.", count, user.username)
    return count
