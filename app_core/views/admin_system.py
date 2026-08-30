import os
import json
import logging
from datetime import datetime
from pathlib import Path
from django.conf import settings
from django.db import connection
from django.http import HttpResponse
from django.contrib.auth.models import User
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from app_core.models import (
    Account, Category, Transaction, RegistrationRequest, Notification,
    Budget, RecurringTransaction
)

logger = logging.getLogger(__name__)


@extend_schema(
    tags=['Admin System'],
    summary="Estatísticas gerais do sistema",
    description="Retorna métricas administrativas sobre usuários, registros, banco de dados e integridade.",
    responses={200: dict}
)
@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def system_stats(request):
    """
    Retorna métricas de tabelas, tamanho do banco SQLite e integridade.
    """
    db_path = settings.DATABASES['default'].get('NAME')
    db_size_bytes = 0
    if db_path and os.path.exists(db_path):
        db_size_bytes = os.path.getsize(db_path)

    stats = {
        'timestamp': datetime.now().isoformat(),
        'users': {
            'total': User.objects.count(),
            'active': User.objects.filter(is_active=True).count(),
            'inactive': User.objects.filter(is_active=False).count(),
            'admins': User.objects.filter(is_staff=True).count(),
        },
        'registration_requests': {
            'pending': RegistrationRequest.objects.filter(status='PENDING').count(),
            'approved': RegistrationRequest.objects.filter(status='APPROVED').count(),
            'rejected': RegistrationRequest.objects.filter(status='REJECTED').count(),
            'total': RegistrationRequest.objects.count(),
        },
        'finance': {
            'accounts': Account.objects.count(),
            'categories': Category.objects.count(),
            'transactions': Transaction.objects.count(),
            'budgets': Budget.objects.count(),
            'recurring': RecurringTransaction.objects.count(),
        },
        'notifications': {
            'total': Notification.objects.count(),
            'unread': Notification.objects.filter(is_read=False).count(),
        },
        'database': {
            'engine': settings.DATABASES['default']['ENGINE'].split('.')[-1],
            'path': str(db_path),
            'size_bytes': db_size_bytes,
            'size_mb': round(db_size_bytes / (1024 * 1024), 2),
        }
    }
    return Response(stats, status=status.HTTP_200_OK)


@extend_schema(
    tags=['Admin System'],
    summary="Manutenção do Banco de Dados",
    description="Executa otimização (VACUUM) e verificação de integridade no banco de dados SQLite.",
    responses={200: dict}
)
@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def db_maintenance(request):
    """
    Executa VACUUM e PRAGMA integrity_check no SQLite.
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("PRAGMA integrity_check;")
            integrity_result = cursor.fetchall()
            cursor.execute("VACUUM;")

        logger.info("Manutenção do banco de dados executada com sucesso por %s", request.user.username)
        return Response({
            'success': True,
            'message': 'Otimização VACUUM e verificação de integridade concluídas com sucesso.',
            'integrity_check': integrity_result
        }, status=status.HTTP_200_OK)
    except Exception as exc:
        logger.error("Erro ao executar manutenção no banco de dados: %s", exc)
        return Response({
            'success': False,
            'error': str(exc)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    tags=['Admin System'],
    summary="Backup completo do banco de dados em JSON",
    description="Gera e faz o download de um arquivo JSON estruturado contendo todos os dados do sistema.",
    responses={200: dict}
)
@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def db_backup(request):
    """
    Gera um backup completo em JSON de todas as entidades do sistema.
    """
    try:
        users = list(User.objects.values('id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'is_active', 'date_joined'))
        for u in users:
            if u.get('date_joined'):
                u['date_joined'] = u['date_joined'].isoformat()

        accounts = [
            {
                'id': str(a.id),
                'user_id': a.user_id,
                'name': a.name,
                'type': a.type,
                'color': a.color,
                'icon': a.icon,
                'balance': float(a.balance),
            }
            for a in Account.objects.all()
        ]

        categories = [
            {
                'id': str(c.id),
                'user_id': c.user_id,
                'name': c.name,
                'type': c.type,
                'color': c.color,
                'icon': c.icon,
            }
            for c in Category.objects.all()
        ]

        transactions = [
            {
                'id': str(t.id),
                'user_id': t.user_id,
                'description': t.description,
                'amount': float(t.amount),
                'type': t.type,
                'method': t.method,
                'category_id': str(t.category_id) if t.category_id else None,
                'account_id': str(t.account_id),
                'to_account_id': str(t.to_account_id) if t.to_account_id else None,
                'date': t.date.isoformat(),
                'installment_current': t.installment_current,
                'installment_total': t.installment_total,
                'installment_id_group': t.installment_id_group,
                'balance_applied': t.balance_applied,
            }
            for t in Transaction.objects.all()
        ]

        registration_requests = list(RegistrationRequest.objects.values('id', 'username', 'email', 'first_name', 'last_name', 'status', 'created_at', 'updated_at'))
        for r in registration_requests:
            if r.get('created_at'):
                r['created_at'] = r['created_at'].isoformat()
            if r.get('updated_at'):
                r['updated_at'] = r['updated_at'].isoformat()

        notifications = list(Notification.objects.values('id', 'user_id', 'title', 'message', 'is_read', 'registration_request_id', 'created_at'))
        for n in notifications:
            if n.get('created_at'):
                n['created_at'] = n['created_at'].isoformat()

        budgets = [
            {
                'id': str(b.id),
                'user_id': b.user_id,
                'category_id': str(b.category_id),
                'amount_limit': float(b.amount_limit),
                'month': b.month,
                'year': b.year,
            }
            for b in Budget.objects.all()
        ]

        recurring = [
            {
                'id': str(rec.id),
                'user_id': rec.user_id,
                'description': rec.description,
                'amount': float(rec.amount),
                'type': rec.type,
                'method': rec.method,
                'category_id': str(rec.category_id) if rec.category_id else None,
                'account_id': str(rec.account_id),
                'frequency': rec.frequency,
                'day_of_month': rec.day_of_month,
                'is_active': rec.is_active,
                'last_processed_date': rec.last_processed_date.isoformat() if rec.last_processed_date else None,
            }
            for rec in RecurringTransaction.objects.all()
        ]

        backup_payload = {
            'generated_at': datetime.now().isoformat(),
            'generated_by': request.user.username,
            'version': '1.1',
            'data': {
                'users': users,
                'accounts': accounts,
                'categories': categories,
                'transactions': transactions,
                'budgets': budgets,
                'recurring_transactions': recurring,
                'registration_requests': registration_requests,
                'notifications': notifications,
            }
        }

        filename = f"backup_sistema_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        response = HttpResponse(
            json.dumps(backup_payload, ensure_ascii=False, indent=2),
            content_type='application/json'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        logger.info("Backup do sistema gerado com sucesso pelo admin %s", request.user.username)
        return response
    except Exception as exc:
        logger.error("Erro ao gerar backup do banco de dados: %s", exc)
        return Response({'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    tags=['Admin System'],
    summary="Dashboard Financeiro Familiar Consolidado",
    description="Retorna indicadores consolidados de toda a família, gráficos de evolução de fluxo de caixa, despesas por categoria e métricas por membro.",
    responses={200: dict}
)
@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def family_finance_stats(request):
    """
    Retorna métricas financeiras consolidadas de todos os membros da família.
    """
    now = datetime.now()
    try:
        year = int(request.query_params.get('year', now.year))
        month = int(request.query_params.get('month', now.month))
    except (ValueError, TypeError):
        year = now.year
        month = now.month

    # 1. Patrimônio Líquido Consolidado da Família
    total_net_worth = Account.objects.aggregate(
        total=connection.ops.models.Sum('balance') if hasattr(connection.ops, 'models') else None
    ) if False else None

    from django.db.models import Sum, Count, Q
    from decimal import Decimal

    accounts_agg = Account.objects.aggregate(
        total_balance=Sum('balance'),
        total_accounts=Count('id')
    )
    total_balance = float(accounts_agg['total_balance'] or 0)
    total_accounts = accounts_agg['total_accounts'] or 0

    # 2. Receitas e Despesas do Mês Atual/Selecionado da Família
    month_txs = Transaction.objects.filter(date__year=year, date__month=month)
    
    income_agg = month_txs.filter(type='INCOME').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
    expense_agg = month_txs.filter(type='EXPENSE').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
    
    family_income = float(income_agg)
    family_expense = float(expense_agg)
    family_net_savings = family_income - family_expense
    savings_rate = round((family_net_savings / family_income * 100), 1) if family_income > 0 else 0.0

    # 3. Despesas Familiares por Categoria
    category_expenses = (
        month_txs.filter(type='EXPENSE')
        .values('category__id', 'category__name', 'category__color', 'category__icon')
        .annotate(total_amount=Sum('amount'), count=Count('id'))
        .order_by('-total_amount')
    )
    categories_data = []
    for c in category_expenses:
        cat_amount = float(c['total_amount'] or 0)
        percentage = round((cat_amount / family_expense * 100), 1) if family_expense > 0 else 0.0
        categories_data.append({
            'category_id': str(c['category__id']) if c['category__id'] else None,
            'name': c['category__name'] or 'Sem Categoria',
            'color': c['category__color'] or '#94a3b8',
            'icon': c['category__icon'] or 'Tag',
            'total_amount': cat_amount,
            'count': c['count'],
            'percentage': percentage,
        })

    # 4. Métricas Individuais por Membro da Família
    users = User.objects.filter(is_active=True).order_by('first_name', 'username')
    members_data = []
    for u in users:
        u_accounts = Account.objects.filter(user=u)
        u_balance = float(u_accounts.aggregate(total=Sum('balance'))['total'] or 0)
        
        u_month_txs = Transaction.objects.filter(user=u, date__year=year, date__month=month)
        u_income = float(u_month_txs.filter(type='INCOME').aggregate(total=Sum('amount'))['total'] or 0)
        u_expense = float(u_month_txs.filter(type='EXPENSE').aggregate(total=Sum('amount'))['total'] or 0)
        u_expense_share = round((u_expense / family_expense * 100), 1) if family_expense > 0 else 0.0

        full_name = f"{u.first_name} {u.last_name}".strip()
        members_data.append({
            'user_id': u.id,
            'username': u.username,
            'name': full_name or u.username,
            'is_staff': u.is_staff,
            'accounts_count': u_accounts.count(),
            'total_balance': u_balance,
            'income': u_income,
            'expense': u_expense,
            'net_savings': u_income - u_expense,
            'expense_share_percentage': u_expense_share,
        })

    # 5. Evolução dos Últimos 6 Meses (Fluxo de Caixa Familiar)
    import calendar
    from datetime import date

    history_months = []
    # Gera os 6 meses terminando no mês/ano selecionado
    curr_y = year
    curr_m = month
    months_keys = []
    for _ in range(6):
        months_keys.append((curr_y, curr_m))
        curr_m -= 1
        if curr_m == 0:
            curr_m = 12
            curr_y -= 1
    months_keys.reverse()

    for y_hist, m_hist in months_keys:
        hist_txs = Transaction.objects.filter(date__year=y_hist, date__month=m_hist)
        h_income = float(hist_txs.filter(type='INCOME').aggregate(total=Sum('amount'))['total'] or 0)
        h_expense = float(hist_txs.filter(type='EXPENSE').aggregate(total=Sum('amount'))['total'] or 0)
        month_name = calendar.month_abbr[m_hist].capitalize()
        history_months.append({
            'year': y_hist,
            'month': m_hist,
            'label': f"{month_name}/{str(y_hist)[2:]}",
            'income': h_income,
            'expense': h_expense,
            'balance': h_income - h_expense,
        })

    # 6. Compras Parceladas Ativas da Família
    today = date.today()
    pending_installments = Transaction.objects.filter(
        installment_total__gt=1,
        date__gt=today
    ).aggregate(total_future=Sum('amount'), count_future=Count('id'))

    total_future_installments = float(pending_installments['total_future'] or 0)
    count_future_installments = pending_installments['count_future'] or 0

    return Response({
        'period': {
            'year': year,
            'month': month,
        },
        'kpis': {
            'total_net_worth': total_balance,
            'total_accounts': total_accounts,
            'family_income': family_income,
            'family_expense': family_expense,
            'family_net_savings': family_net_savings,
            'savings_rate': savings_rate,
            'total_future_installments': total_future_installments,
            'count_future_installments': count_future_installments,
        },
        'categories': categories_data,
        'members': members_data,
        'monthly_history': history_months,
    }, status=status.HTTP_200_OK)

