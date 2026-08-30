import logging
from datetime import date
from decimal import Decimal
from django.db import models, transaction as db_transaction
from django.contrib.auth.models import User
from app_core.models import Account, Transaction, Notification, PeerTransfer
from app_core.services.transaction import TransactionService

logger = logging.getLogger(__name__)


class PeerTransferService:
    @staticmethod
    def list_recipients(current_user, search=None):
        """Retorna outros usuários ativos para quem o usuário atual pode transferir."""
        qs = User.objects.filter(is_active=True).exclude(id=current_user.id)
        if search:
            qs = qs.filter(
                models.Q(username__icontains=search) |
                models.Q(first_name__icontains=search) |
                models.Q(last_name__icontains=search) |
                models.Q(email__icontains=search)
            )
        return qs.order_by('first_name', 'username')

    @staticmethod
    def send_transfer(sender_user, sender_account_id, receiver_user_id, amount, description='', target_date=None):
        """Debita valor da conta do remetente, cria PeerTransfer (PENDING) e notifica o destinatário."""
        target_date = target_date or date.today()
        amount = Decimal(str(amount))
        if amount <= Decimal('0.00'):
            raise ValueError('O valor da transferência deve ser maior que zero.')

        try:
            sender_account = Account.objects.get(id=sender_account_id, user=sender_user)
        except Account.DoesNotExist:
            raise ValueError('Conta de origem não encontrada ou não pertence ao usuário.')

        try:
            receiver_user = User.objects.get(id=receiver_user_id, is_active=True)
        except User.DoesNotExist:
            raise ValueError('Usuário destinatário não encontrado ou inativo.')

        if receiver_user.id == sender_user.id:
            raise ValueError('Você não pode enviar uma transferência para si mesmo. Use a transferência entre contas.')

        with db_transaction.atomic():
            # 1. Cria transação de débito no remetente
            sender_tx_desc = f"Transferência enviada para @{receiver_user.username}"
            if description:
                sender_tx_desc += f" - {description}"

            sender_tx = Transaction.objects.create(
                user=sender_user,
                account=sender_account,
                amount=amount,
                type='EXPENSE',
                method='PIX',
                description=sender_tx_desc,
                date=target_date,
            )
            TransactionService._apply_balance(sender_tx)

            # 2. Cria o registro de PeerTransfer pendente
            peer_tx = PeerTransfer.objects.create(
                sender=sender_user,
                sender_account=sender_account,
                sender_transaction=sender_tx,
                receiver=receiver_user,
                amount=amount,
                description=description,
                status='PENDING',
                date=target_date,
            )

            # 3. Cria Notificação interativa para o destinatário
            notif_msg = f"@{sender_user.username} lhe enviou R$ {amount:.2f}."
            if description:
                notif_msg += f" Motivo: {description}."
            notif_msg += " Escolha em qual das suas contas deseja depositar o valor."

            Notification.objects.create(
                user=receiver_user,
                title=f"Transferência recebida de @{sender_user.username}",
                message=notif_msg,
                peer_transfer=peer_tx,
            )

            logger.info(
                "Transferência P2P iniciada: id=%s de @%s para @%s valor=%s",
                peer_tx.id, sender_user.username, receiver_user.username, amount
            )
            return peer_tx

    @staticmethod
    def accept_transfer(receiver_user, transfer_id, receiver_account_id):
        """Destinatário escolhe a conta, credita o saldo e conclui a transferência."""
        try:
            transfer = PeerTransfer.objects.select_related('sender', 'sender_account', 'sender_transaction').get(
                id=transfer_id,
                receiver=receiver_user
            )
        except PeerTransfer.DoesNotExist:
            raise ValueError('Transferência não encontrada.')

        if transfer.status != 'PENDING':
            raise ValueError(f'Esta transferência não pode mais ser aceita (Status: {transfer.status}).')

        try:
            receiver_account = Account.objects.get(id=receiver_account_id, user=receiver_user)
        except Account.DoesNotExist:
            raise ValueError('Conta de destino não encontrada ou não pertence ao usuário.')

        with db_transaction.atomic():
            # 1. Cria transação de crédito no destinatário
            receiver_tx_desc = f"Transferência recebida de @{transfer.sender.username}"
            if transfer.description:
                receiver_tx_desc += f" - {transfer.description}"

            receiver_tx = Transaction.objects.create(
                user=receiver_user,
                account=receiver_account,
                amount=transfer.amount,
                type='INCOME',
                method='PIX',
                description=receiver_tx_desc,
                date=transfer.date,
            )
            TransactionService._apply_balance(receiver_tx)

            # 2. Atualiza status do PeerTransfer
            transfer.status = 'ACCEPTED'
            transfer.receiver_account = receiver_account
            transfer.receiver_transaction = receiver_tx
            transfer.save()

            # 3. Notifica o remetente sobre o recebimento com sucesso
            Notification.objects.create(
                user=transfer.sender,
                title=f"Transferência aceita por @{receiver_user.username}",
                message=f"@{receiver_user.username} aceitou sua transferência de R$ {transfer.amount:.2f} e o valor foi creditado na conta.",
                peer_transfer=transfer,
            )

            logger.info("Transferência P2P %s aceita por @%s", transfer.id, receiver_user.username)
            return transfer

    @staticmethod
    def reject_transfer(receiver_user, transfer_id):
        """Destinatário recusa a transferência, estornando o valor para a conta do remetente."""
        try:
            transfer = PeerTransfer.objects.select_related('sender', 'sender_account', 'sender_transaction').get(
                id=transfer_id,
                receiver=receiver_user
            )
        except PeerTransfer.DoesNotExist:
            raise ValueError('Transferência não encontrada.')

        if transfer.status != 'PENDING':
            raise ValueError(f'Esta transferência não está mais pendente (Status: {transfer.status}).')

        with db_transaction.atomic():
            # 1. Reverte o débito na conta do remetente
            if transfer.sender_transaction:
                TransactionService._reverse_balance(transfer.sender_transaction)
                transfer.sender_transaction.description += " (Estornada - Recusada pelo destinatário)"
                transfer.sender_transaction.save()

            # 2. Atualiza status
            transfer.status = 'REJECTED'
            transfer.save()

            # 3. Notifica o remetente
            Notification.objects.create(
                user=transfer.sender,
                title=f"Transferência recusada por @{receiver_user.username}",
                message=f"@{receiver_user.username} recusou a transferência de R$ {transfer.amount:.2f}. O valor foi estornado para sua conta {transfer.sender_account.name}.",
                peer_transfer=transfer,
            )

            logger.info("Transferência P2P %s recusada por @%s", transfer.id, receiver_user.username)
            return transfer

    @staticmethod
    def cancel_transfer(sender_user, transfer_id):
        """Remetente cancela a transferência pendente antes do aceite, estornando o saldo."""
        try:
            transfer = PeerTransfer.objects.select_related('sender', 'sender_account', 'sender_transaction', 'receiver').get(
                id=transfer_id,
                sender=sender_user
            )
        except PeerTransfer.DoesNotExist:
            raise ValueError('Transferência não encontrada.')

        if transfer.status != 'PENDING':
            raise ValueError(f'Esta transferência não pode ser cancelada (Status: {transfer.status}).')

        with db_transaction.atomic():
            if transfer.sender_transaction:
                TransactionService._reverse_balance(transfer.sender_transaction)
                transfer.sender_transaction.description += " (Cancelada pelo remetente)"
                transfer.sender_transaction.save()

            transfer.status = 'CANCELLED'
            transfer.save()

            Notification.objects.create(
                user=transfer.receiver,
                title=f"Transferência cancelada por @{sender_user.username}",
                message=f"A transferência de R$ {transfer.amount:.2f} enviada por @{sender_user.username} foi cancelada.",
                peer_transfer=transfer,
            )

            logger.info("Transferência P2P %s cancelada pelo remetente @%s", transfer.id, sender_user.username)
            return transfer
