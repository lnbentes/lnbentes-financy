from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter

from app_core.models import Budget
from app_core.serializers.finance import BudgetSerializer
from app_core.services.budget import get_budget_summary


@extend_schema(tags=['Budgets'])
class BudgetViewSet(viewsets.ModelViewSet):
    """
    Endpoints para gerenciamento de metas e orçamentos mensais por categoria.
    """
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user).select_related('category')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @extend_schema(
        summary="Resumo de progresso dos orçamentos",
        description="Retorna os orçamentos com valor gasto, saldo restante e % atingido no mês/ano.",
        parameters=[
            OpenApiParameter('month', int, description='Mês de referência (1-12)', required=False),
            OpenApiParameter('year', int, description='Ano de referência (ex: 2026)', required=False),
        ]
    )
    @action(detail=False, methods=['get'])
    def summary(self, request):
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        data = get_budget_summary(request.user, month=month, year=year)
        return Response(data, status=status.HTTP_200_OK)
