from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from app_core.models import Account, Notification, PeerTransfer


class PeerTransferTestCase(TestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(
            username='user_alice',
            password='Password123',
            first_name='Alice',
            email='alice@exemplo.com'
        )
        self.account_a = Account.objects.create(
            user=self.user_a,
            name='Nubank Alice',
            balance=Decimal('500.00'),
            type='BANK'
        )

        self.user_b = User.objects.create_user(
            username='user_bob',
            password='Password123',
            first_name='Bob',
            email='bob@exemplo.com'
        )
        self.account_b = Account.objects.create(
            user=self.user_b,
            name='Itaú Bob',
            balance=Decimal('100.00'),
            type='BANK'
        )

        self.user_c = User.objects.create_user(
            username='user_charlie',
            password='Password123',
            first_name='Charlie',
            email='charlie@exemplo.com'
        )
        self.account_c = Account.objects.create(
            user=self.user_c,
            name='Bradesco Charlie',
            balance=Decimal('0.00'),
            type='BANK'
        )

        self.client = APIClient()

    def test_send_peer_transfer_and_notify_receiver(self):
        """Alice envia R$ 150 para Bob -> Débito na conta de Alice e Notificação para Bob"""
        self.client.force_authenticate(user=self.user_a)

        response = self.client.post(
            '/api/peer-transfers/',
            {
                'sender_account': str(self.account_a.id),
                'receiver_id': self.user_b.id,
                'amount': '150.00',
                'description': 'Divisão do churrasco',
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        transfer_id = response.data['id']
        self.assertEqual(response.data['status'], 'PENDING')
        self.assertEqual(response.data['amount'], '150.00')

        # Verifica débito imediato na conta de Alice
        self.account_a.refresh_from_db()
        self.assertEqual(self.account_a.balance, Decimal('350.00'))

        # Verifica notificação para Bob
        notifs_bob = Notification.objects.filter(user=self.user_b)
        self.assertEqual(notifs_bob.count(), 1)
        self.assertEqual(str(notifs_bob.first().peer_transfer_id), transfer_id)

    def test_accept_peer_transfer_credits_receiver(self):
        """Bob aceita a transferência de Alice escolhendo a conta Itaú -> Crédito no Bob e Notificação para Alice"""
        self.client.force_authenticate(user=self.user_a)
        res_send = self.client.post(
            '/api/peer-transfers/',
            {
                'sender_account': str(self.account_a.id),
                'receiver_id': self.user_b.id,
                'amount': '150.00',
                'description': 'Presente',
            },
            format='json'
        )
        transfer_id = res_send.data['id']

        # Agora Bob se autentica e aceita na conta Itaú Bob
        self.client.force_authenticate(user=self.user_b)
        response_accept = self.client.post(
            f'/api/peer-transfers/{transfer_id}/accept/',
            {'receiver_account': str(self.account_b.id)},
            format='json'
        )

        self.assertEqual(response_accept.status_code, status.HTTP_200_OK)
        self.assertEqual(response_accept.data['status'], 'ACCEPTED')

        # Verifica crédito no saldo de Bob (100 + 150 = 250)
        self.account_b.refresh_from_db()
        self.assertEqual(self.account_b.balance, Decimal('250.00'))

        # Alice recebe notificação de aceite
        notifs_alice = Notification.objects.filter(user=self.user_a)
        self.assertTrue(notifs_alice.filter(title__icontains='aceita').exists())

    def test_reject_peer_transfer_refunds_sender(self):
        """Bob rejeita a transferência de Alice -> Saldo de Alice é estornado (+150)"""
        self.client.force_authenticate(user=self.user_a)
        res_send = self.client.post(
            '/api/peer-transfers/',
            {
                'sender_account': str(self.account_a.id),
                'receiver_id': self.user_b.id,
                'amount': '150.00',
            },
            format='json'
        )
        transfer_id = res_send.data['id']
        self.account_a.refresh_from_db()
        self.assertEqual(self.account_a.balance, Decimal('350.00'))

        # Bob rejeita
        self.client.force_authenticate(user=self.user_b)
        response_reject = self.client.post(f'/api/peer-transfers/{transfer_id}/reject/')
        self.assertEqual(response_reject.status_code, status.HTTP_200_OK)
        self.assertEqual(response_reject.data['status'], 'REJECTED')

        # Saldo de Alice é estornado de volta para 500
        self.account_a.refresh_from_db()
        self.assertEqual(self.account_a.balance, Decimal('500.00'))

        # Saldo de Bob permanece 100
        self.account_b.refresh_from_db()
        self.assertEqual(self.account_b.balance, Decimal('100.00'))

    def test_cancel_peer_transfer_by_sender(self):
        """Alice cancela sua transferência antes de Bob responder -> Saldo de Alice é estornado"""
        self.client.force_authenticate(user=self.user_a)
        res_send = self.client.post(
            '/api/peer-transfers/',
            {
                'sender_account': str(self.account_a.id),
                'receiver_id': self.user_b.id,
                'amount': '200.00',
            },
            format='json'
        )
        transfer_id = res_send.data['id']

        response_cancel = self.client.post(f'/api/peer-transfers/{transfer_id}/cancel/')
        self.assertEqual(response_cancel.status_code, status.HTTP_200_OK)
        self.assertEqual(response_cancel.data['status'], 'CANCELLED')

        self.account_a.refresh_from_db()
        self.assertEqual(self.account_a.balance, Decimal('500.00'))

    def test_unauthorized_user_cannot_accept(self):
        """Charlie não pode aceitar a transferência que Alice enviou para Bob"""
        self.client.force_authenticate(user=self.user_a)
        res_send = self.client.post(
            '/api/peer-transfers/',
            {
                'sender_account': str(self.account_a.id),
                'receiver_id': self.user_b.id,
                'amount': '100.00',
            },
            format='json'
        )
        transfer_id = res_send.data['id']

        self.client.force_authenticate(user=self.user_c)
        res_charlie = self.client.post(
            f'/api/peer-transfers/{transfer_id}/accept/',
            {'receiver_account': str(self.account_c.id)},
            format='json'
        )
        self.assertEqual(res_charlie.status_code, status.HTTP_400_BAD_REQUEST)
