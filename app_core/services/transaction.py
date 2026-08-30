import uuid
import logging
from datetime import date
from decimal import Decimal

from django.db import transaction as db_transaction
from django.db.models import F

from app_core.models import Category, Account, Transaction

logger = logging.getLogger(__name__)


class TransactionService:
    @staticmethod
    def get_user_transactions(user):
        return Transaction.objects.filter(user=user).select_related('category', 'account')

    @staticmethod
    def get_filtered_transactions(user, year=None, month=None, search=None,
                                   min_amount=None, max_amount=None, tx_type=None):
        qs = Transaction.objects.filter(user=user).select_related(
            'category', 'account', 'to_account'
        )
        if year:
            qs = qs.filter(date__year=year)
        if month:
            qs = qs.filter(date__month=month)
        if search:
            qs = qs.filter(description__icontains=search)
        if min_amount is not None:
            qs = qs.filter(amount__gte=min_amount)
        if max_amount is not None:
            qs = qs.filter(amount__lte=max_amount)
        if tx_type:
            qs = qs.filter(type=tx_type)
        return qs.order_by('-date')

    # ── Gerenciamento de saldo ────────────────────────────────────────────────

    @staticmethod
    def _apply_balance(tx):
        """Aplica o efeito da transação no saldo da(s) conta(s) se ainda não aplicado
        e se a data da transação for menor ou igual a hoje (padrão bancário BR)."""
        today = date.today()
        if tx.balance_applied or tx.date > today:
            return

        with db_transaction.atomic():
            if tx.type == 'INCOME':
                Account.objects.filter(id=tx.account_id).update(
                    balance=F('balance') + tx.amount
                )
            elif tx.type == 'EXPENSE':
                Account.objects.filter(id=tx.account_id).update(
                    balance=F('balance') - tx.amount
                )
            elif tx.type == 'TRANSFER' and tx.to_account_id:
                Account.objects.filter(id=tx.account_id).update(
                    balance=F('balance') - tx.amount
                )
                Account.objects.filter(id=tx.to_account_id).update(
                    balance=F('balance') + tx.amount
                )
            else:
                # Tipo desconhecido ou TRANSFER sem destino — não aplica
                return

            Transaction.objects.filter(id=tx.id).update(balance_applied=True)
            tx.balance_applied = True
            logger.debug('Saldo aplicado: tx=%s tipo=%s valor=%s', tx.id, tx.type, tx.amount)

    @staticmethod
    def _reverse_balance(tx):
        """Reverte o efeito da transação no saldo da(s) conta(s) se foi aplicado."""
        if not tx.balance_applied:
            return

        with db_transaction.atomic():
            if tx.type == 'INCOME':
                Account.objects.filter(id=tx.account_id).update(
                    balance=F('balance') - tx.amount
                )
            elif tx.type == 'EXPENSE':
                Account.objects.filter(id=tx.account_id).update(
                    balance=F('balance') + tx.amount
                )
            elif tx.type == 'TRANSFER' and tx.to_account_id:
                Account.objects.filter(id=tx.account_id).update(
                    balance=F('balance') + tx.amount
                )
                Account.objects.filter(id=tx.to_account_id).update(
                    balance=F('balance') - tx.amount
                )

            Transaction.objects.filter(id=tx.id).update(balance_applied=False)
            tx.balance_applied = False
            logger.debug('Saldo revertido: tx=%s tipo=%s valor=%s', tx.id, tx.type, tx.amount)

    # ── CRUD com controle de saldo ────────────────────────────────────────────

    @staticmethod
    def create_with_installments(user, data, installments=1):
        """Cria uma transação simples (ou N parcelas) e aplica o saldo imediatamente
        apenas nas parcelas cujo mês já chegou (padrão bancário BR)."""
        installments = int(installments or 1)
        tx_type = data.get('type', 'EXPENSE')

        # Transferências não suportam parcelamento
        if tx_type == 'TRANSFER':
            installments = 1
            # Método é opcional para transferências — usa PIX como padrão brasileiro
            data.setdefault('method', 'PIX')

        if installments <= 1:
            transaction = Transaction.objects.create(user=user, **data)
            TransactionService._apply_balance(transaction)
            logger.info('Transação criada: id=%s user=%s', transaction.id, user.id)
            return [transaction]

        total_amount = Decimal(str(data['amount']))
        installment_value = (total_amount / installments).quantize(Decimal('0.01'))
        remainder = total_amount - (installment_value * installments)

        group_id = str(uuid.uuid4())
        base_date = data['date']

        created = []
        for i in range(installments):
            total_months = base_date.month - 1 + i
            y = base_date.year + total_months // 12
            m = total_months % 12 + 1
            try:
                installment_date = base_date.replace(year=y, month=m)
            except ValueError:
                import calendar
                last_day = calendar.monthrange(y, m)[1]
                installment_date = base_date.replace(year=y, month=m, day=last_day)

            amount = installment_value + (remainder if i == 0 else Decimal('0'))
            t = Transaction.objects.create(
                user=user,
                description=data['description'],
                amount=amount,
                type=data['type'],
                method=data.get('method', 'DEBIT'),
                category=data.get('category'),
                account=data.get('account'),
                date=installment_date,
                installment_current=i + 1,
                installment_total=installments,
                installment_id_group=group_id,
            )
            # Aplica ao saldo somente se a parcela for do mês atual ou passado
            TransactionService._apply_balance(t)
            created.append(t)

        logger.info('%d parcelas criadas (grupo=%s) user=%s', installments, group_id, user.id)
        return created

    @staticmethod
    def update_transaction(instance, data):
        """Edita uma transação revertendo o efeito antigo e aplicando o novo."""
        # Reverte o efeito da transação antes de alterar os dados
        TransactionService._reverse_balance(instance)

        for attr, value in data.items():
            setattr(instance, attr, value)
        instance.save()

        # Aplica o novo efeito (somente se data <= hoje)
        TransactionService._apply_balance(instance)
        logger.info('Transação atualizada: id=%s user=%s', instance.id, instance.user_id)
        return instance

    @staticmethod
    def delete_transaction(transaction):
        """Exclui uma transação e reverte o efeito no saldo."""
        TransactionService._reverse_balance(transaction)
        tx_id = transaction.id
        transaction.delete()
        logger.info('Transação excluída: id=%s', tx_id)

    @staticmethod
    def delete_installment_group(group_id):
        """Exclui todas as transações de um grupo de parcelas, revertendo o efeito de cada uma no saldo."""
        transactions = Transaction.objects.filter(installment_id_group=group_id)
        for tx in transactions:
            TransactionService._reverse_balance(tx)
        
        count = transactions.count()
        transactions.delete()
        logger.info('%d transações excluídas do grupo=%s', count, group_id)

    # ── Gestão e Antecipação de Parcelamentos ─────────────────────────────────

    @staticmethod
    def get_installment_groups(user):
        """Retorna uma lista resumida de todas as compras parceladas do usuário."""
        today = date.today()
        groups_qs = (
            Transaction.objects.filter(user=user, installment_id_group__isnull=False)
            .order_by()
            .values_list('installment_id_group', flat=True)
            .distinct()
        )

        result = []
        for group_id in groups_qs:
            txs = list(
                Transaction.objects.filter(user=user, installment_id_group=group_id)
                .select_related('account', 'category')
                .order_by('installment_current')
            )
            if not txs:
                continue

            first_tx = txs[0]
            total_installments = first_tx.installment_total or len(txs)
            
            paid_txs = [t for t in txs if t.date <= today]
            future_txs = [t for t in txs if t.date > today]

            total_amount = sum(t.amount for t in txs)
            paid_amount = sum(t.amount for t in paid_txs)
            remaining_amount = sum(t.amount for t in future_txs)

            first_date = txs[0].date
            last_date = txs[-1].date

            serialized_txs = []
            for t in txs:
                serialized_txs.append({
                    'id': str(t.id),
                    'description': t.description,
                    'amount': float(t.amount),
                    'date': t.date.isoformat(),
                    'installment_current': t.installment_current,
                    'installment_total': t.installment_total,
                    'is_paid': t.date <= today,
                    'balance_applied': t.balance_applied,
                })

            result.append({
                'group_id': group_id,
                'description': first_tx.description,
                'account_id': str(first_tx.account_id) if first_tx.account_id else None,
                'account_name': first_tx.account.name if first_tx.account else 'Sem Conta',
                'account_color': first_tx.account.color if first_tx.account else '#888',
                'category_id': str(first_tx.category_id) if first_tx.category_id else None,
                'category_name': first_tx.category.name if first_tx.category else 'Geral',
                'category_color': first_tx.category.color if first_tx.category else '#22c55e',
                'category_icon': first_tx.category.icon if first_tx.category else 'pricetag-outline',
                'installment_total': total_installments,
                'paid_count': len(paid_txs),
                'remaining_count': len(future_txs),
                'total_amount': float(total_amount),
                'paid_amount': float(paid_amount),
                'remaining_amount': float(remaining_amount),
                'first_date': first_date.isoformat(),
                'last_date': last_date.isoformat(),
                'status': 'PAID' if len(future_txs) == 0 else 'ACTIVE',
                'transactions': serialized_txs,
            })

        # Ordena com os que possuem parcelas pendentes primeiro
        result.sort(key=lambda g: (0 if g['remaining_count'] > 0 else 1, g['first_date']), reverse=False)
        return result

    @staticmethod
    def anticipate_installments(user, group_id, count=1, target_date=None, discount_amount=Decimal('0.00')):
        """
        Adiantar `count` parcelas futuras para `target_date` (padrão: hoje),
        com desconto opcional e reajuste cronológico das parcelas futuras restantes.
        """
        import calendar
        target_date = target_date or date.today()
        count = int(count)
        discount_amount = Decimal(str(discount_amount or 0))

        txs = list(
            Transaction.objects.filter(user=user, installment_id_group=group_id)
            .order_by('installment_current')
        )
        if not txs:
            raise ValueError('Grupo de parcelamento não encontrado.')

        # Identifica parcelas futuras (que ainda não chegaram à target_date)
        future_txs = [t for t in txs if t.date > target_date]
        if not future_txs:
            raise ValueError('Não há parcelas futuras para antecipar neste parcelamento.')

        count = min(count, len(future_txs))
        to_anticipate = future_txs[:count]
        remaining_future = future_txs[count:]

        # Distribui eventual desconto entre as parcelas antecipadas
        discount_per_tx = (discount_amount / count).quantize(Decimal('0.01')) if count > 0 else Decimal('0')
        discount_remainder = discount_amount - (discount_per_tx * count)

        with db_transaction.atomic():
            # 1. Atualiza as parcelas adiantadas para a target_date
            for idx, tx in enumerate(to_anticipate):
                TransactionService._reverse_balance(tx)
                tx.date = target_date

                if discount_amount > 0:
                    item_discount = discount_per_tx + (discount_remainder if idx == 0 else Decimal('0'))
                    new_amount = max(Decimal('0.01'), tx.amount - item_discount)
                    tx.amount = new_amount

                tx.save()
                TransactionService._apply_balance(tx)

            # 2. Reajusta as datas das parcelas futuras restantes sem deixar buracos
            base_month = target_date.month
            base_year = target_date.year
            base_day = target_date.day

            for idx, tx in enumerate(remaining_future):
                TransactionService._reverse_balance(tx)

                total_months = base_month + idx
                y = base_year + total_months // 12
                m = total_months % 12 + 1
                last_day = calendar.monthrange(y, m)[1]
                new_day = min(base_day, last_day)

                tx.date = date(y, m, new_day)
                tx.save()
                TransactionService._apply_balance(tx)

        logger.info(
            'Antecipadas %d parcelas do grupo=%s para %s com desconto=%s por user=%s',
            count, group_id, target_date, discount_amount, user.id
        )
        return {
            'group_id': group_id,
            'anticipated_count': count,
            'target_date': target_date.isoformat(),
            'discount_applied': float(discount_amount),
            'remaining_count': len(remaining_future),
        }

    @staticmethod
    def payoff_installment_group(user, group_id, target_date=None, discount_amount=Decimal('0.00')):
        """Quita todas as parcelas pendentes de um grupo adiantando-as para `target_date`."""
        target_date = target_date or date.today()
        txs = list(
            Transaction.objects.filter(user=user, installment_id_group=group_id)
            .order_by('installment_current')
        )
        if not txs:
            raise ValueError('Grupo de parcelamento não encontrado.')

        future_txs = [t for t in txs if t.date > target_date]
        if not future_txs:
            raise ValueError('Todas as parcelas deste grupo já estão quitadas ou vencidas.')

        return TransactionService.anticipate_installments(
            user=user,
            group_id=group_id,
            count=len(future_txs),
            target_date=target_date,
            discount_amount=discount_amount
        )

