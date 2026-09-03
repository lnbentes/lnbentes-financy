import logging
from datetime import date, datetime
from django.db import transaction
from app_core.models import RecurringTransaction, Transaction as AppTransaction, Account

logger = logging.getLogger(__name__)


def process_recurring_transactions(user=None, target_date=None):
    """
    Processa transações recorrentes ativas gerando transações automáticas caso ainda não tenham sido geradas no mês atual.
    """
    if target_date is None:
        target_date = date.today()
    elif isinstance(target_date, str):
        target_date = datetime.strptime(target_date, '%Y-%m-%d').date()

    qs = RecurringTransaction.objects.filter(is_active=True)
    if user:
        qs = qs.filter(user=user)

    processed_count = 0
    created_transactions = []

    import calendar

    for item in qs:
        # Se for recorrência anual: só processa se o mês atual for o mês de cobrança configurado
        if item.frequency == 'YEARLY':
            target_month = item.month_of_year or 1
            if target_date.month != target_month:
                continue
            # Verifica se já foi processada neste mesmo ano
            if item.last_processed_date and item.last_processed_date.year == target_date.year:
                continue
        else:
            # Frequência mensal (ou padrão): verifica se já foi processada no mesmo mês e ano
            if item.last_processed_date and item.last_processed_date.year == target_date.year and item.last_processed_date.month == target_date.month:
                continue

        # Ajusta dia do mês para o último dia válido daquele mês se necessário
        last_day = calendar.monthrange(target_date.year, target_date.month)[1]
        day = min(item.day_of_month, last_day)
        tx_date = date(target_date.year, target_date.month, day)

        with transaction.atomic():
            tx = AppTransaction.objects.create(
                user=item.user,
                description=f"[Recorrente] {item.description}",
                amount=item.amount,
                type=item.type,
                method=item.method,
                category=item.category,
                account=item.account,
                date=tx_date,
                balance_applied=True
            )

            # Atualiza saldo da conta
            account = item.account
            if item.type == 'INCOME':
                account.balance += item.amount
            elif item.type == 'EXPENSE':
                account.balance -= item.amount
            account.save()

            item.last_processed_date = target_date
            item.save()

            created_transactions.append(tx)
            processed_count += 1

    logger.info("Processamento de transações recorrentes concluído: %d geradas.", processed_count)
    return {
        'processed_count': processed_count,
        'transactions': [str(t.id) for t in created_transactions]
    }
