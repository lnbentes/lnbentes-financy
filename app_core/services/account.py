import logging
from app_core.models import Account

logger = logging.getLogger(__name__)


class AccountService:
    @staticmethod
    def get_user_queryset(user):
        return Account.objects.filter(user=user)

    @staticmethod
    def get_queryset():
        return Account.objects.all()
