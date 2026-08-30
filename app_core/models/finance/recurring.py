import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

from .account import Account
from .category import Category

User = get_user_model()


class RecurringTransaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    TYPE_CHOICES = [
        ('INCOME', 'Receita'),
        ('EXPENSE', 'Despesa'),
    ]
    METHOD_CHOICES = [
        ('CREDIT', 'Crédito'),
        ('DEBIT', 'Débito'),
        ('CASH', 'Dinheiro'),
        ('PIX', 'Pix'),
        ('BOLETO', 'Boleto'),
    ]
    FREQUENCY_CHOICES = [
        ('MONTHLY', 'Mensal'),
        ('WEEKLY', 'Semanal'),
        ('YEARLY', 'Anual'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recurring_transactions')
    description = models.CharField(max_length=255)
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0.01)]
    )
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='EXPENSE')
    method = models.CharField(max_length=15, choices=METHOD_CHOICES, default='DEBIT')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='recurring_transactions')
    frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES, default='MONTHLY')
    day_of_month = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(31)],
        help_text="Dia do mês programado para o vencimento/lançamento."
    )
    is_active = models.BooleanField(default=True)
    last_processed_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Recurring Transaction'
        verbose_name_plural = 'Recurring Transactions'
        ordering = ['day_of_month', 'description']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['user', 'day_of_month']),
        ]

    def __str__(self):
        return f"{self.description} - R$ {self.amount} (Dia {self.day_of_month})"
