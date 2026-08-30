from django.urls import path
from rest_framework.routers import DefaultRouter

from app_core.views.auth import api_login, api_logout
from app_core.views.user import UserViewSet
from app_core.views.registration import RegistrationRequestViewSet
from app_core.views.notification import NotificationViewSet
from app_core.views.admin_system import system_stats, db_maintenance, db_backup, family_finance_stats

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'registration-requests', RegistrationRequestViewSet, basename='registration-request')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = router.urls + [
    path('auth/login/', api_login, name='api_login'),
    path('auth/logout/', api_logout, name='api_logout'),
    
    # Endpoints do Portal Administrativo
    path('admin/stats/', system_stats, name='admin_system_stats'),
    path('admin/family-finance/', family_finance_stats, name='admin_family_finance'),
    path('admin/db-maintenance/', db_maintenance, name='admin_db_maintenance'),
    path('admin/db-backup/', db_backup, name='admin_db_backup'),
]
