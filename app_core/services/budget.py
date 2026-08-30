from datetime import datetime
from decimal import Decimal
from django.db.models import Sum
from app_core.models import Budget, Transaction


def get_budget_summary(user, month=None, year=None):
    """
    Calcula o progresso de todos os orçamentos de um usuário para o mês/ano especificado.
    """
    now = datetime.now()
    month = int(month) if month else now.month
    year = int(year) if year else now.year

    budgets = Budget.objects.filter(user=user, month=month, year=year).select_related('category')

    summary = []
    for b in budgets:
        # Soma os gastos (EXPENSE) do usuário nesta categoria no mês/ano
        spent_aggregate = Transaction.objects.filter(
            user=user,
            category=b.category,
            type='EXPENSE',
            date__year=year,
            date__month=month
        ).aggregate(total=Sum('amount'))

        spent = spent_aggregate['total'] or Decimal('0.00')
        limit = b.amount_limit
        remaining = limit - spent
        percentage = round((spent / limit) * 100, 1) if limit > 0 else Decimal('0.0')

        if percentage > 100:
            status = 'EXCEEDED'
        elif percentage >= 80:
            status = 'WARNING'
        else:
            status = 'OK'

        summary.append({
            'id': str(b.id),
            'category_id': str(b.category.id),
            'category_name': b.category.name,
            'category_icon': b.category.icon,
            'category_color': b.category.color,
            'amount_limit': float(limit),
            'spent_amount': float(spent),
            'remaining_amount': float(remaining),
            'percentage_spent': float(percentage),
            'status': status,
            'month': b.month,
            'year': b.year,
        })

    return summary
