import uuid
import logging
from datetime import date
from decimal import Decimal

from django.db import transaction as db_transaction

from app_core.models import Category, Account, Transaction
from app_core.services.transaction import TransactionService

logger = logging.getLogger(__name__)


class FinanceDataService:
    """Importação, exportação e exclusão em lote de dados financeiros."""

    # ── Exportação ────────────────────────────────────────────────────────────

    @staticmethod
    def export_data(user, account_ids=None, year=None, month=None) -> dict:
        """
        Exporta contas, categorias e transações do usuário em formato JSON-serializável.

        Filtros:
          - account_ids: lista de IDs de contas (None = todas)
          - year: ano das transações (None = todos)
          - month: mês das transações (None = todos — requer year quando informado)
        """
        # Contas
        acc_qs = Account.objects.filter(user=user)
        if account_ids:
            acc_qs = acc_qs.filter(id__in=account_ids)

        accounts_data = [
            {
                'id': str(a.id),
                'name': a.name,
                'type': a.type,
                'color': a.color,
                'icon': a.icon,
                'balance': float(a.balance),
            }
            for a in acc_qs
        ]
        acc_ids_in_scope = list(acc_qs.values_list('id', flat=True))

        # Categorias referenciadas pelas transações exportadas
        tx_qs = Transaction.objects.filter(user=user, account_id__in=acc_ids_in_scope)
        if year:
            tx_qs = tx_qs.filter(date__year=year)
        if month:
            tx_qs = tx_qs.filter(date__month=month)
        tx_qs = tx_qs.select_related('category', 'account', 'to_account').order_by('date')

        cat_ids = tx_qs.exclude(category__isnull=True).values_list('category_id', flat=True).distinct()
        categories_data = [
            {
                'id': str(c.id),
                'name': c.name,
                'type': c.type,
                'icon': c.icon,
                'color': c.color,
            }
            for c in Category.objects.filter(id__in=cat_ids)
        ]

        # Transações
        transactions_data = [
            {
                'id': str(t.id),
                'description': t.description,
                'amount': float(t.amount),
                'type': t.type,
                'method': t.method,
                'category_id': str(t.category_id) if t.category_id else None,
                'category_name': t.category.name if t.category else None,
                'account_id': str(t.account_id),
                'account_name': t.account.name if t.account else None,
                'to_account_id': str(t.to_account_id) if t.to_account_id else None,
                'to_account_name': t.to_account.name if t.to_account else None,
                'date': t.date.isoformat(),
                'installment_current': t.installment_current,
                'installment_total': t.installment_total,
                'installment_id_group': t.installment_id_group,
                'balance_applied': t.balance_applied,
            }
            for t in tx_qs
        ]

        logger.info(
            'Export: user=%s contas=%d tx=%d year=%s month=%s',
            user.id, len(accounts_data), len(transactions_data), year, month,
        )
        return {
            'export_date': date.today().isoformat(),
            'filter': {
                'account_ids': account_ids,
                'year': year,
                'month': month,
            },
            'accounts': accounts_data,
            'categories': categories_data,
            'transactions': transactions_data,
        }

    # ── Importação ────────────────────────────────────────────────────────────

    @staticmethod
    def import_data(user, payload: dict) -> dict:
        """
        Importa dados a partir de um payload JSON gerado pelo export_data.
        - Contas: criadas somente se não existir conta com mesmo nome para o usuário.
        - Categorias: criadas somente se não existir categoria com mesmo nome para o usuário.
        - Transações: sempre inseridas (sem deduplicação).
        Retorna estatísticas do que foi criado.
        """
        accounts_created = 0
        categories_created = 0
        transactions_created = 0
        errors = []

        with db_transaction.atomic():
            # Mapa de id -> instância
            acc_map_id: dict[str, Account] = {
                str(a.id): a for a in Account.objects.filter(user=user)
            }
            cat_map_id: dict[str, Category] = {
                str(c.id): c for c in Category.objects.filter(user=user)
            }
            
            # Mapa de nome -> instância (fallback)
            acc_map_name: dict[str, Account] = {
                a.name: a for a in Account.objects.filter(user=user)
            }
            cat_map_name: dict[str, Category] = {
                c.name: c for c in Category.objects.filter(user=user)
            }

            # Importar contas
            for acc_data in payload.get('accounts', []):
                acc_id = acc_data.get('id')
                name = acc_data.get('name', '').strip()
                if not name:
                    continue
                
                existing = acc_map_id.get(acc_id) if acc_id else acc_map_name.get(name)
                
                if not existing:
                    new_acc = Account.objects.create(
                        id=acc_id if acc_id else uuid.uuid4(),
                        user=user,
                        name=name,
                        type=acc_data.get('type', 'BANK'),
                        color=acc_data.get('color', '#22c55e'),
                        icon=acc_data.get('icon', 'wallet-outline'),
                        balance=Decimal(str(acc_data.get('balance', '0.00'))),
                    )
                    if acc_id:
                        acc_map_id[acc_id] = new_acc
                    acc_map_name[name] = new_acc
                    accounts_created += 1

            # Importar categorias
            for cat_data in payload.get('categories', []):
                cat_id = cat_data.get('id')
                name = cat_data.get('name', '').strip()
                if not name:
                    continue
                
                existing = cat_map_id.get(cat_id) if cat_id else cat_map_name.get(name)
                
                if not existing:
                    new_cat = Category.objects.create(
                        id=cat_id if cat_id else uuid.uuid4(),
                        user=user,
                        name=name,
                        type=cat_data.get('type', 'BOTH'),
                        icon=cat_data.get('icon', 'pricetag-outline'),
                        color=cat_data.get('color', '#22c55e'),
                    )
                    if cat_id:
                        cat_map_id[cat_id] = new_cat
                    cat_map_name[name] = new_cat
                    categories_created += 1

            # Importar transações
            for tx_data in payload.get('transactions', []):
                try:
                    # Mapeamento de conta origem
                    acc_id = tx_data.get('account_id')
                    acc_name = tx_data.get('account_name')
                    account = acc_map_id.get(acc_id) if acc_id else acc_map_name.get(acc_name)
                    
                    if not account:
                        errors.append(f"Conta '{acc_name or acc_id}' não encontrada — transação ignorada.")
                        continue

                    # Mapeamento de conta destino
                    to_acc_id = tx_data.get('to_account_id')
                    to_acc_name = tx_data.get('to_account_name')
                    to_account = acc_map_id.get(to_acc_id) if to_acc_id else acc_map_name.get(to_acc_name)

                    # Mapeamento de categoria
                    cat_id = tx_data.get('category_id')
                    cat_name = tx_data.get('category_name')
                    category = cat_map_id.get(cat_id) if cat_id else cat_map_name.get(cat_name)

                    tx_id = tx_data.get('id')

                    tx = Transaction.objects.create(
                        id=tx_id if tx_id else uuid.uuid4(),
                        user=user,
                        description=tx_data.get('description', ''),
                        amount=Decimal(str(tx_data.get('amount', '0'))),
                        type=tx_data.get('type', 'EXPENSE'),
                        method=tx_data.get('method', 'CASH'),
                        category=category,
                        account=account,
                        to_account=to_account,
                        date=tx_data.get('date'),
                        installment_current=tx_data.get('installment_current'),
                        installment_total=tx_data.get('installment_total'),
                        installment_id_group=tx_data.get('installment_id_group'),
                        balance_applied=False,
                    )
                    # Aplica saldo conforme regra bancária
                    TransactionService._apply_balance(tx)
                    transactions_created += 1
                except Exception as exc:
                    errors.append(f"Erro ao importar transação: {exc}")

        logger.info(
            'Import: user=%s contas=%d cats=%d tx=%d erros=%d',
            user.id, accounts_created, categories_created, transactions_created, len(errors),
        )
        return {
            'accounts_created': accounts_created,
            'categories_created': categories_created,
            'transactions_created': transactions_created,
            'errors': errors,
        }

    # ── Exclusão em lote ──────────────────────────────────────────────────────

    @staticmethod
    def delete_bulk(user, account_ids=None, year=None, month=None) -> dict:
        """
        Exclui transações (e reverte saldo) conforme filtros.
        Se nem year nem month forem informados, exclui todas as transações do escopo de contas.

        Retorna contagem de transações removidas.
        """
        acc_qs = Account.objects.filter(user=user)
        if account_ids:
            acc_qs = acc_qs.filter(id__in=account_ids)
        acc_ids_in_scope = list(acc_qs.values_list('id', flat=True))

        tx_qs = Transaction.objects.filter(user=user, account_id__in=acc_ids_in_scope)
        if year:
            tx_qs = tx_qs.filter(date__year=year)
        if month:
            tx_qs = tx_qs.filter(date__month=month)

        count = 0
        with db_transaction.atomic():
            for tx in tx_qs.select_related('account', 'to_account'):
                TransactionService._reverse_balance(tx)
                tx.delete()
                count += 1

        logger.info(
            'Delete bulk: user=%s removidos=%d year=%s month=%s contas=%s',
            user.id, count, year, month, account_ids,
        )
        return {'deleted': count}
