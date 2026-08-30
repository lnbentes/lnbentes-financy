from datetime import date, timedelta
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from app_core.models import Account, Category, Transaction
from app_core.services import TransactionService


class InstallmentsAnticipationTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='test_installments', password='Password123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.account = Account.objects.create(
            user=self.user,
            name='Cartão de Crédito',
            balance=Decimal('0.00'),
            type='BANK'
        )
        self.category = Category.objects.create(
            user=self.user,
            name='Eletrônicos',
            type='EXPENSE'
        )

    def test_create_and_list_installment_groups(self):
        """Cria compra parcelada em 6x e lista via API"""
        today = date.today()
        created = TransactionService.create_with_installments(
            user=self.user,
            data={
                'description': 'Smartphone Novo',
                'amount': Decimal('600.00'),
                'type': 'EXPENSE',
                'method': 'CREDIT',
                'account': self.account,
                'category': self.category,
                'date': today,
            },
            installments=6
        )

        self.assertEqual(len(created), 6)
        group_id = created[0].installment_id_group

        response = self.client.get('/api/transactions/installments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        group = response.data[0]
        self.assertEqual(group['group_id'], group_id)
        self.assertEqual(group['installment_total'], 6)
        self.assertEqual(group['paid_count'], 1)  # Apenas a parcela de hoje
        self.assertEqual(group['remaining_count'], 5)
        self.assertEqual(group['total_amount'], 600.0)
        self.assertEqual(group['paid_amount'], 100.0)
        self.assertEqual(group['remaining_amount'], 500.0)

    def test_anticipate_installments_with_date_realignment_and_discount(self):
        """Testa adiantamento de 2 parcelas com desconto e reajuste automático das futuras"""
        today = date.today()
        created = TransactionService.create_with_installments(
            user=self.user,
            data={
                'description': 'Notebook Gamer',
                'amount': Decimal('600.00'),
                'type': 'EXPENSE',
                'method': 'CREDIT',
                'account': self.account,
                'category': self.category,
                'date': today,
            },
            installments=6
        )
        group_id = created[0].installment_id_group

        # Adiantar 2 parcelas para hoje com R$ 10 de desconto
        response = self.client.post(
            f'/api/transactions/installments/{group_id}/anticipate/',
            {
                'count': 2,
                'target_date': str(today),
                'discount_amount': '10.00',
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['anticipated_count'], 2)
        self.assertEqual(response.data['discount_applied'], 10.0)

        # Agora no mês atual temos 3 parcelas (a original + 2 antecipadas)
        txs = Transaction.objects.filter(installment_id_group=group_id).order_by('installment_current')
        paid_now = [t for t in txs if t.date <= today]
        self.assertEqual(len(paid_now), 3)

        # Verifica desconto aplicado nas parcelas antecipadas (R$ 5 de desconto em cada uma de R$ 100 = R$ 95)
        self.assertEqual(txs[1].amount, Decimal('95.00'))
        self.assertEqual(txs[2].amount, Decimal('95.00'))

        # As 3 parcelas futuras restantes devem estar em sequência sem buracos
        future_txs = [t for t in txs if t.date > today]
        self.assertEqual(len(future_txs), 3)
        self.assertGreater(future_txs[0].date, today)
        self.assertGreater(future_txs[1].date, future_txs[0].date)
        self.assertGreater(future_txs[2].date, future_txs[1].date)

    def test_payoff_entire_installment_group(self):
        """Testa quitação total antecipada de todas as parcelas restantes"""
        today = date.today()
        created = TransactionService.create_with_installments(
            user=self.user,
            data={
                'description': 'Smart TV 4K',
                'amount': Decimal('400.00'),
                'type': 'EXPENSE',
                'method': 'CREDIT',
                'account': self.account,
                'category': self.category,
                'date': today,
            },
            installments=4
        )
        group_id = created[0].installment_id_group

        response = self.client.post(
            f'/api/transactions/installments/{group_id}/payoff/',
            {
                'target_date': str(today),
                'discount_amount': '20.00',
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['remaining_count'], 0)

        # Todas as parcelas agora devem estar com data <= hoje
        txs = Transaction.objects.filter(installment_id_group=group_id)
        for t in txs:
            self.assertLessEqual(t.date, today)
            self.assertTrue(t.balance_applied)
