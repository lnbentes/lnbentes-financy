from datetime import date
from decimal import Decimal

from django.db.models import Sum

from rest_framework import serializers
from app_core.models import Category, Account, Transaction
from app_core.services import FinanceService


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'icon', 'color', 'type']
        read_only_fields = ['id']


class AccountSerializer(serializers.ModelSerializer):
    # Saldo calculado em tempo real a partir das transações (não usa o campo armazenado).
    # Considera apenas transações com data <= hoje, garantindo o padrão bancário BR.
    balance = serializers.SerializerMethodField()
    pending_installments_amount = serializers.SerializerMethodField()
    pending_installments_months = serializers.SerializerMethodField()

    def get_balance(self, obj):
        today = date.today()
        qs = Transaction.objects.filter(account=obj, date__lte=today)

        income = (
            qs.filter(type='INCOME').aggregate(t=Sum('amount'))['t'] or Decimal('0')
        )
        expense = (
            qs.filter(type='EXPENSE').aggregate(t=Sum('amount'))['t'] or Decimal('0')
        )
        transfer_out = (
            qs.filter(type='TRANSFER').aggregate(t=Sum('amount'))['t'] or Decimal('0')
        )
        transfer_in = (
            Transaction.objects.filter(to_account=obj, type='TRANSFER', date__lte=today)
            .aggregate(t=Sum('amount'))['t'] or Decimal('0')
        )
        return float(income - expense - transfer_out + transfer_in)

    def get_pending_installments_amount(self, obj):
        return FinanceService.get_pending_installments_for_account(obj.id)['pending_installments_amount']

    def get_pending_installments_months(self, obj):
        return FinanceService.get_pending_installments_for_account(obj.id)['pending_installments_months']

    class Meta:
        model = Account
        fields = [
            'id', 'name', 'balance', 'type', 'color', 'icon',
            'pending_installments_amount', 'pending_installments_months',
        ]
        read_only_fields = [
            'id', 'balance', 'pending_installments_amount', 'pending_installments_months',
        ]


class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    category_color = serializers.CharField(source='category.color', read_only=True, allow_null=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True, allow_null=True)
    account_name = serializers.CharField(source='account.name', read_only=True)
    account_color = serializers.CharField(source='account.color', read_only=True)
    account_icon = serializers.CharField(source='account.icon', read_only=True)
    to_account_name = serializers.CharField(source='to_account.name', read_only=True, allow_null=True)
    # Campo write-only para indicar quantas parcelas criar
    installments = serializers.IntegerField(write_only=True, required=False, min_value=1, max_value=60, default=1)

    class Meta:
        model = Transaction
        fields = [
            'id', 'description', 'amount', 'type', 'method',
            'category', 'account', 'to_account', 'date',
            'installment_current', 'installment_total', 'installment_id_group',
            'balance_applied',
            'category_name', 'category_color', 'category_icon',
            'account_name', 'account_color', 'account_icon',
            'to_account_name',
            'installments',
        ]
        read_only_fields = [
            'id', 'installment_current', 'installment_total', 'installment_id_group',
            'balance_applied',
        ]
