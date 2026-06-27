import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Account(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    TYPE_CHOICES = [
        ('BANK', 'Banco'),
        ('WALLET', 'Carteira'),
        ('INVESTMENT', 'Investimento'),
        ('CREDIT', 'Cartão de Crédito'),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='accounts', null=True, blank=True
    )
    name = models.CharField(max_length=100)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    type = models.CharField(max_length=15, choices=TYPE_CHOICES)
    color = models.CharField(max_length=7, default='#22c55e')
    icon = models.CharField(max_length=50, default='wallet-outline')

    class Meta:
        verbose_name = 'Account'
        verbose_name_plural = 'Accounts'
        ordering = ['name']

    def __str__(self):
        return self.name
