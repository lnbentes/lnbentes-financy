from django.urls import path

from app_core.views.auth import api_login, api_logout
from app_core.views.user import UserViewSet
from app_core.views.registration import RegistrationRequestViewSet
from app_core.views.notification import NotificationViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'registration-requests', RegistrationRequestViewSet, basename='registration-request')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = router.urls + [
    path('auth/login/', api_login, name='api_login'),
    path('auth/logout/', api_logout, name='api_logout'),
]
