from decimal import Decimal
from datetime import date
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from app_core.models import Account, Category, Transaction


class FamilyFinanceStatsTestCase(TestCase):
    def setUp(self):
        # Admin / Pai da família
        self.admin = User.objects.create_superuser(
            username='pai_admin',
            password='Password123',
            first_name='Carlos',
            email='carlos@familia.com'
        )
        self.account_admin = Account.objects.create(
            user=self.admin,
            name='Conta Conjunta Carlos',
            balance=Decimal('8500.00'),
            type='BANK'
        )

        # Membro comum / Mãe da família
        self.mae = User.objects.create_user(
            username='mae_maria',
            password='Password123',
            first_name='Maria',
            email='maria@familia.com'
        )
        self.account_mae = Account.objects.create(
            user=self.mae,
            name='Investimentos Maria',
            balance=Decimal('4200.00'),
            type='INVESTMENT'
        )

        # Categorias
        self.cat_mercado = Category.objects.create(
            name='Supermercado',
            color='#16a34a',
            icon='ShoppingCart',
            type='EXPENSE'
        )
        self.cat_salario = Category.objects.create(
            name='Salário Familiar',
            color='#2563eb',
            icon='Briefcase',
            type='INCOME'
        )

        # Lançamentos do mês atual
        today = date.today()
        # Receita Carlos: 10000
        Transaction.objects.create(
            user=self.admin,
            account=self.account_admin,
            amount=Decimal('10000.00'),
            type='INCOME',
            category=self.cat_salario,
            date=today
        )
        # Despesa Carlos: 2500 (Mercado)
        Transaction.objects.create(
            user=self.admin,
            account=self.account_admin,
            amount=Decimal('2500.00'),
            type='EXPENSE',
            category=self.cat_mercado,
            date=today
        )
        # Receita Maria: 6000
        Transaction.objects.create(
            user=self.mae,
            account=self.account_mae,
            amount=Decimal('6000.00'),
            type='INCOME',
            category=self.cat_salario,
            date=today
        )
        # Despesa Maria: 1500 (Mercado)
        Transaction.objects.create(
            user=self.mae,
            account=self.account_mae,
            amount=Decimal('1500.00'),
            type='EXPENSE',
            category=self.cat_mercado,
            date=today
        )

        self.client = APIClient()

    def test_family_finance_stats_requires_admin(self):
        """Usuário comum não pode acessar o painel financeiro consolidado da família"""
        self.client.force_authenticate(user=self.mae)
        response = self.client.get('/api/admin/family-finance/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_family_finance_stats_aggregated_metrics(self):
        """Admin visualiza o saldo consolidado, receitas, despesas e comparativo por membro"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/admin/family-finance/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        kpis = data['kpis']
        
        # Patrimônio consolidado: 8500 + 4200 = 12700
        self.assertEqual(kpis['total_net_worth'], 12700.0)
        self.assertEqual(kpis['total_accounts'], 2)
        
        # Receitas totais: 10000 + 6000 = 16000
        self.assertEqual(kpis['family_income'], 16000.0)
        # Despesas totais: 2500 + 1500 = 4000
        self.assertEqual(kpis['family_expense'], 4000.0)
        # Saldo líquido: 16000 - 4000 = 12000
        self.assertEqual(kpis['family_net_savings'], 12000.0)
        # Taxa de poupança: 12000 / 16000 = 75%
        self.assertEqual(kpis['savings_rate'], 75.0)

        # Categorias de despesas
        self.assertTrue(len(data['categories']) >= 1)
        self.assertEqual(data['categories'][0]['name'], 'Supermercado')
        self.assertEqual(data['categories'][0]['total_amount'], 4000.0)

        # Membros da família
        members = data['members']
        self.assertEqual(len(members), 2)
        carlos = next(m for m in members if m['username'] == 'pai_admin')
        maria = next(m for m in members if m['username'] == 'mae_maria')
        
        self.assertEqual(carlos['expense'], 2500.0)
        self.assertEqual(carlos['expense_share_percentage'], 62.5) # 2500 / 4000 * 100
        self.assertEqual(maria['expense'], 1500.0)
        self.assertEqual(maria['expense_share_percentage'], 37.5) # 1500 / 4000 * 100

        # Histórico dos últimos 6 meses
        self.assertEqual(len(data['monthly_history']), 6)
