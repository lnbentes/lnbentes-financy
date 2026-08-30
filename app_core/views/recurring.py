from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from app_core.models import RecurringTransaction
from app_core.serializers.finance import RecurringTransactionSerializer
from app_core.services.recurring import process_recurring_transactions


@extend_schema(tags=['Recurring Transactions'])
class RecurringTransactionViewSet(viewsets.ModelViewSet):
    """
    Endpoints para gerenciamento de transações recorrentes e assinaturas.
    """
    serializer_class = RecurringTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return RecurringTransaction.objects.filter(user=self.request.user).select_related('account', 'category')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @extend_schema(
        summary="Processar transações recorrentes pendentes",
        description="Gera automaticamente as transações no extrato para o mês vigente.",
    )
    @action(detail=False, methods=['post'], url_path='process-pending')
    def process_pending(self, request):
        target_date = request.data.get('target_date')
        result = process_recurring_transactions(user=request.user, target_date=target_date)
        return Response(result, status=status.HTTP_200_OK)
