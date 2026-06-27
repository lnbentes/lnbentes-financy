import logging
from django.db.models import Q
from app_core.models import Category

logger = logging.getLogger(__name__)


class CategoryService:
    @staticmethod
    def get_user_queryset(user):
        """Retorna categorias do usuário + categorias globais (sem dono)."""
        return Category.objects.filter(Q(user=user) | Q(user__isnull=True))

    @staticmethod
    def get_queryset():
        return Category.objects.all()
