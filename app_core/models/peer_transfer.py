import uuid
from datetime import date
from django.db import models
from django.contrib.auth.models import User
from app_core.models.finance import Account, Transaction


class PeerTransfer(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pendente'),
        ('ACCEPTED', 'Aceito'),
        ('REJECTED', 'Recusado'),
        ('CANCELLED', 'Cancelado'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_peer_transfers')
    sender_account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='sent_peer_transfers')
    sender_transaction = models.ForeignKey(
        Transaction, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='sent_peer_transfer'
    )

    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_peer_transfers')
    receiver_account = models.ForeignKey(
        Account, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='received_peer_transfers'
    )
    receiver_transaction = models.ForeignKey(
        Transaction, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='received_peer_transfer'
    )

    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING')
    date = models.DateField(default=date.today)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'peer_transfers'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sender', 'status', '-created_at']),
            models.Index(fields=['receiver', 'status', '-created_at']),
        ]

    def __str__(self):
        return f"Transferência de {self.sender.username} para {self.receiver.username} - R$ {self.amount} ({self.status})"
