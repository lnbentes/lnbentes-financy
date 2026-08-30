from datetime import date
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from django.db.utils import IntegrityError

from app_core.models import Account, Category, Transaction, Budget, RecurringTransaction
from app_core.services.budget import get_budget_summary
from app_core.services.recurring import process_recurring_transactions


class BudgetAndRecurringTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.account = Account.objects.create(
            user=self.user,
            name='Conta Corrente',
            balance=Decimal('1000.00'),
            type='BANK'
        )
        self.category = Category.objects.create(
            user=self.user,
            name='Alimentação',
            type='EXPENSE'
        )

    def test_budget_summary_and_constraint(self):
        # 1. Cria orçamento de R$ 500 para Alimentação no mês atual
        today = date.today()
        budget = Budget.objects.create(
            user=self.user,
            category=self.category,
            amount_limit=Decimal('500.00'),
            month=today.month,
            year=today.year
        )

        # 2. Cria transação de despesa de R$ 200
        Transaction.objects.create(
            user=self.user,
            account=self.account,
            category=self.category,
            description='Supermercado',
            amount=Decimal('200.00'),
            type='EXPENSE',
            method='DEBIT',
            date=today,
            balance_applied=True
        )

        # 3. Testa resumo de orçamento
        summary = get_budget_summary(self.user, month=today.month, year=today.year)
        self.assertEqual(len(summary), 1)
        self.assertEqual(summary[0]['amount_limit'], 500.0)
        self.assertEqual(summary[0]['spent_amount'], 200.0)
        self.assertEqual(summary[0]['remaining_amount'], 300.0)
        self.assertEqual(summary[0]['percentage_spent'], 40.0)
        self.assertEqual(summary[0]['status'], 'OK')

        # 4. Testa constraint de unicidade (mesmo user + categoria + mês + ano)
        with self.assertRaises(IntegrityError):
            Budget.objects.create(
                user=self.user,
                category=self.category,
                amount_limit=Decimal('600.00'),
                month=today.month,
                year=today.year
            )

    def test_recurring_transaction_processing(self):
        # 1. Cria recorrência mensal de R$ 50
        recurring = RecurringTransaction.objects.create(
            user=self.user,
            account=self.account,
            category=self.category,
            description='Assinatura Streaming',
            amount=Decimal('50.00'),
            type='EXPENSE',
            method='DEBIT',
            day_of_month=10,
            is_active=True
        )

        # 2. Executa processamento
        today = date.today()
        result = process_recurring_transactions(user=self.user, target_date=today)
        self.assertEqual(result['processed_count'], 1)

        # 3. Verifica transação gerada e saldo atualizado
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal('950.00'))

        txs = Transaction.objects.filter(user=self.user, description__contains='Assinatura Streaming')
        self.assertEqual(txs.count(), 1)
        self.assertEqual(txs.first().amount, Decimal('50.00'))

        # 4. Executar novamente no mesmo mês não deve duplicar
        result_again = process_recurring_transactions(user=self.user, target_date=today)
        self.assertEqual(result_again['processed_count'], 0)

    def test_transaction_positive_amount_constraint(self):
        with self.assertRaises(IntegrityError):
            Transaction.objects.create(
                user=self.user,
                account=self.account,
                description='Valor Inválido',
                amount=Decimal('0.00'),
                type='EXPENSE',
                method='DEBIT',
                date=date.today()
            )

    def test_create_transaction_with_global_category(self):
        """Valida que o endpoint POST /api/transactions/ aceita categorias padrão globais (user=None)."""
        global_category = Category.objects.create(
            user=None,
            name='Salário',
            type='INCOME'
        )
        response = self.client.post(
            '/api/transactions/',
            {
                'description': 'salario',
                'amount': '250.20',
                'type': 'INCOME',
                'method': 'DEBIT',
                'date': str(date.today()),
                'account': str(self.account.id),
                'category': str(global_category.id),
            },
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['description'], 'salario')
        self.assertEqual(response.data[0]['category'], global_category.id)

