import uuid
from django.db import models

from .account import Account
from .category import Category


class Transaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    TYPE_CHOICES = [
        ('INCOME', 'Income'),
        ('EXPENSE', 'Expense'),
        ('TRANSFER', 'Transfer'),
    ]
    METHOD_CHOICES = [
        ('CREDIT', 'Crédito'),
        ('DEBIT', 'Débito'),
        ('CASH', 'Dinheiro'),
        ('PIX', 'Pix'),
        ('INSTALLMENT', 'Parcelado'),
    ]

    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    method = models.CharField(max_length=15, choices=METHOD_CHOICES)
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True
    )
    account = models.ForeignKey(
        Account, on_delete=models.CASCADE, related_name='transactions'
    )
    to_account = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name='incoming_transfers',
        null=True,
        blank=True,
    )
    date = models.DateField()
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)

    installment_current = models.IntegerField(null=True, blank=True)
    installment_total = models.IntegerField(null=True, blank=True)
    installment_id_group = models.CharField(max_length=100, null=True, blank=True)

    # Indica se esta transação já foi aplicada ao saldo da conta.
    # Parcelas futuras ficam como False até chegarem ao mês vigente.
    balance_applied = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Transaction'
        verbose_name_plural = 'Transactions'
        ordering = ['-date']

    def __str__(self):
        return self.description
