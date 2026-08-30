from datetime import date
from decimal import Decimal

from django.db.models import Sum, Q

from rest_framework import serializers
from app_core.models import Category, Account, Transaction, Budget, RecurringTransaction
from app_core.services import FinanceService, CategoryService


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

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            user = request.user
            self.fields['account'].queryset = Account.objects.filter(user=user)
            self.fields['to_account'].queryset = Account.objects.filter(user=user)
            self.fields['category'].queryset = CategoryService.get_user_queryset(user)

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user if request and hasattr(request, 'user') else None

        account = attrs.get('account') or (self.instance.account if self.instance else None)
        to_account = attrs.get('to_account') or (self.instance.to_account if self.instance else None)
        category = attrs.get('category') or (self.instance.category if self.instance else None)
        tx_type = attrs.get('type') or (self.instance.type if self.instance else 'EXPENSE')

        if user and user.is_authenticated:
            if account and account.user != user:
                raise serializers.ValidationError({'account': 'Conta não pertence ao usuário autenticado.'})
            if to_account and to_account.user != user:
                raise serializers.ValidationError({'to_account': 'Conta de destino não pertence ao usuário autenticado.'})
            if category and category.user and category.user != user:
                raise serializers.ValidationError({'category': 'Categoria não pertence ao usuário autenticado.'})

        if tx_type == 'TRANSFER':
            if not to_account:
                raise serializers.ValidationError({'to_account': 'Conta de destino é obrigatória para transferências.'})
            if account and to_account and account.id == to_account.id:
                raise serializers.ValidationError({'to_account': 'A conta de origem e destino não podem ser iguais.'})

        return attrs


class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)

    class Meta:
        model = Budget
        fields = [
            'id', 'category', 'category_name', 'category_icon', 'category_color',
            'amount_limit', 'month', 'year', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            self.fields['category'].queryset = CategoryService.get_user_queryset(request.user)

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user if request and hasattr(request, 'user') else None
        category = attrs.get('category') or (self.instance.category if self.instance else None)
        if user and user.is_authenticated and category and category.user and category.user != user:
            raise serializers.ValidationError({'category': 'Categoria não pertence ao usuário autenticado.'})
        return attrs


class RecurringTransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True, allow_null=True)
    category_color = serializers.CharField(source='category.color', read_only=True, allow_null=True)
    account_name = serializers.CharField(source='account.name', read_only=True)
    account_color = serializers.CharField(source='account.color', read_only=True)

    class Meta:
        model = RecurringTransaction
        fields = [
            'id', 'description', 'amount', 'type', 'method',
            'category', 'category_name', 'category_icon', 'category_color',
            'account', 'account_name', 'account_color',
            'frequency', 'day_of_month', 'is_active', 'last_processed_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'last_processed_date', 'created_at', 'updated_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            user = request.user
            self.fields['account'].queryset = Account.objects.filter(user=user)
            self.fields['category'].queryset = CategoryService.get_user_queryset(user)

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user if request and hasattr(request, 'user') else None
        account = attrs.get('account') or (self.instance.account if self.instance else None)
        category = attrs.get('category') or (self.instance.category if self.instance else None)
        if user and user.is_authenticated:
            if account and account.user != user:
                raise serializers.ValidationError({'account': 'Conta não pertence ao usuário autenticado.'})
            if category and category.user and category.user != user:
                raise serializers.ValidationError({'category': 'Categoria não pertence ao usuário autenticado.'})
        return attrs
