from django.urls import path
from .views import admin_portal_view

app_name = 'front_admin'

urlpatterns = [
    path('', admin_portal_view, name='portal_home'),
]
