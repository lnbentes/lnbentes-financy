import logging
from datetime import date
from decimal import Decimal
from django.db.models import Sum
from app_core.models import Transaction

logger = logging.getLogger(__name__)


class FinanceService:
    """Regras de negócio e relatórios financeiros."""

    @staticmethod
    def get_monthly_summary(user, year: int, month: int) -> dict:
        """Retorna receitas, despesas e saldo líquido do mês para o usuário.
        Transferências são excluídas (não representam ganho nem perda)."""
        qs = Transaction.objects.filter(user=user, date__year=year, date__month=month)
        income = (
            qs.filter(type='INCOME').aggregate(t=Sum('amount'))['t'] or Decimal('0.00')
        )
        expense = (
            qs.filter(type='EXPENSE').aggregate(t=Sum('amount'))['t'] or Decimal('0.00')
        )
        return {
            'income': float(income),
            'expense': float(expense),
            'balance': float(income - expense),
        }

    @staticmethod
    def get_category_breakdown(user, year: int, month: int) -> list:
        """Retorna o total de despesas agrupado por categoria."""
        qs = Transaction.objects.filter(
            user=user, date__year=year, date__month=month, type='EXPENSE'
        ).select_related('category')

        breakdown = {}
        for t in qs:
            key = t.category.name if t.category else 'Sem Categoria'
            if key not in breakdown:
                breakdown[key] = {
                    'name': key,
                    'color': t.category.color if t.category else '#888888',
                    'icon': t.category.icon if t.category else 'help-outline',
                    'total': Decimal('0'),
                }
            breakdown[key]['total'] += t.amount

        result = sorted(breakdown.values(), key=lambda x: x['total'], reverse=True)
        for item in result:
            item['total'] = float(item['total'])
        return result

    @staticmethod
    def get_current_month_summary(user) -> dict:
        today = date.today()
        return FinanceService.get_monthly_summary(user, today.year, today.month)

    @staticmethod
    def get_pending_installments_for_account(account_id: int) -> dict:
        """Retorna o total das parcelas futuras e o número de meses até a última."""
        today = date.today()
        pending_qs = Transaction.objects.filter(
            account_id=account_id,
            installment_id_group__isnull=False,
            date__gt=today,
        )
        total = pending_qs.aggregate(t=Sum('amount'))['t'] or Decimal('0')
        last_date = (
            pending_qs.order_by('-date').values_list('date', flat=True).first()
        )
        if last_date:
            months = (last_date.year - today.year) * 12 + (last_date.month - today.month)
        else:
            months = 0
        return {
            'pending_installments_amount': float(total),
            'pending_installments_months': months,
        }
