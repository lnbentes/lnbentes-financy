from rest_framework import serializers
from app_core.models.notification import Notification
from app_core.serializers.registration import RegistrationRequestSerializer
from app_core.serializers.peer_transfer import PeerTransferSerializer


class NotificationSerializer(serializers.ModelSerializer):
    registration_request_detail = RegistrationRequestSerializer(source='registration_request', read_only=True)
    peer_transfer_detail = PeerTransferSerializer(source='peer_transfer', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 
            'title', 
            'message', 
            'is_read', 
            'registration_request', 
            'registration_request_detail',
            'peer_transfer',
            'peer_transfer_detail',
            'created_at'
        ]
        read_only_fields = [
            'id', 
            'created_at', 
            'registration_request_detail',
            'peer_transfer_detail'
        ]
