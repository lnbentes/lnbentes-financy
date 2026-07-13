from rest_framework import serializers
from app_core.models.notification import Notification
from app_core.serializers.registration import RegistrationRequestSerializer

class NotificationSerializer(serializers.ModelSerializer):
    registration_request_detail = RegistrationRequestSerializer(source='registration_request', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 
            'title', 
            'message', 
            'is_read', 
            'registration_request', 
            'registration_request_detail', 
            'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'registration_request_detail']
