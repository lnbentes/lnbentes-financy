from decimal import Decimal
from rest_framework import serializers
from app_core.models.peer_transfer import PeerTransfer


class PeerTransferSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_name = serializers.SerializerMethodField()
    sender_account_name = serializers.CharField(source='sender_account.name', read_only=True)
    sender_account_color = serializers.CharField(source='sender_account.color', read_only=True)
    sender_account_icon = serializers.CharField(source='sender_account.icon', read_only=True)

    receiver_username = serializers.CharField(source='receiver.username', read_only=True)
    receiver_name = serializers.SerializerMethodField()
    receiver_account_name = serializers.CharField(source='receiver_account.name', read_only=True, allow_null=True)

    class Meta:
        model = PeerTransfer
        fields = [
            'id',
            'sender',
            'sender_username',
            'sender_name',
            'sender_account',
            'sender_account_name',
            'sender_account_color',
            'sender_account_icon',
            'receiver',
            'receiver_username',
            'receiver_name',
            'receiver_account',
            'receiver_account_name',
            'amount',
            'description',
            'status',
            'date',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'sender',
            'sender_username',
            'sender_name',
            'sender_account_name',
            'sender_account_color',
            'sender_account_icon',
            'receiver',
            'receiver_username',
            'receiver_name',
            'receiver_account_name',
            'status',
            'created_at',
            'updated_at',
        ]

    def get_sender_name(self, obj):
        name = f"{obj.sender.first_name} {obj.sender.last_name}".strip()
        return name or obj.sender.username

    def get_receiver_name(self, obj):
        name = f"{obj.receiver.first_name} {obj.receiver.last_name}".strip()
        return name or obj.receiver.username


class SendPeerTransferSerializer(serializers.Serializer):
    sender_account = serializers.UUIDField(required=True, help_text="ID da conta de origem")
    receiver_id = serializers.IntegerField(required=True, help_text="ID do usuário destinatário")
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=True, min_value=Decimal('0.01'))
    description = serializers.CharField(required=False, allow_blank=True, max_length=255, default='')
    date = serializers.DateField(required=False)


class AcceptPeerTransferSerializer(serializers.Serializer):
    receiver_account = serializers.UUIDField(required=True, help_text="ID da conta em que o valor será depositado")
