import json
import logging
from datetime import date

from django.http import HttpResponse
from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes, inline_serializer

from app_core.serializers import TransactionSerializer
from app_core.services import TransactionService, FinanceService, FinanceDataService

logger = logging.getLogger(__name__)


@extend_schema(tags=['Transactions'])
class TransactionViewSet(viewsets.ModelViewSet):
    """
    Controller para gerenciamento de transações financeiras (receitas, despesas, transferências).

    Caminho Base: /api/transactions/
    Endpoints do CRUD Padrão:
    - GET    /api/transactions/          (Listar e filtrar transações)
    - POST   /api/transactions/          (Criar nova transação com parcelamento opcional)
    - GET    /api/transactions/{id}/     (Obter detalhes de uma transação)
    - PUT    /api/transactions/{id}/     (Atualizar transação)
    - PATCH  /api/transactions/{id}/     (Atualizar parcialmente transação)
    - DELETE /api/transactions/{id}/     (Excluir transação)
    """
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        params = self.request.query_params
        year = params.get('year')
        month = params.get('month')
        search = params.get('search')
        min_amount = params.get('min_amount')
        max_amount = params.get('max_amount')
        tx_type = params.get('type')

        return TransactionService.get_filtered_transactions(
            user=self.request.user,
            year=int(year) if year else None,
            month=int(month) if month else None,
            search=search or None,
            min_amount=float(min_amount) if min_amount else None,
            max_amount=float(max_amount) if max_amount else None,
            tx_type=tx_type or None,
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated = dict(serializer.validated_data)
        installments = int(validated.pop('installments', 1) or 1)

        created = TransactionService.create_with_installments(
            user=request.user,
            data=validated,
            installments=installments,
        )
        result = self.get_serializer(created, many=True)
        return Response(result.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        validated = dict(serializer.validated_data)
        validated.pop('installments', None)  # ignorado em edição
        updated = TransactionService.update_transaction(instance, validated)
        return Response(self.get_serializer(updated).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        TransactionService.delete_transaction(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(
        summary="Resumo mensal financeiro",
        description="Retorna o resumo mensal de receitas, despesas, saldo acumulado e detalhamento por categorias para o mês informado.",
        parameters=[
            OpenApiParameter('year', OpenApiTypes.INT, description="Ano da busca", required=False),
            OpenApiParameter('month', OpenApiTypes.INT, description="Mês da busca", required=False),
        ]
    )
    @action(detail=False, methods=['get'], url_path='summary')
    def monthly_summary(self, request):
        """
        Caminho: /api/transactions/summary/
        """
        today = date.today()
        year = int(request.query_params.get('year', today.year))
        month = int(request.query_params.get('month', today.month))
        summary = FinanceService.get_monthly_summary(request.user, year, month)
        breakdown = FinanceService.get_category_breakdown(request.user, year, month)
        return Response({**summary, 'category_breakdown': breakdown})

    # ── Exportação ────────────────────────────────────────────────────────────

    @extend_schema(
        summary="Exportar dados financeiros",
        description="Exporta as transações, contas e categorias do usuário como um arquivo JSON para backup.",
        parameters=[
            OpenApiParameter('account_ids', OpenApiTypes.STR, description="Lista de IDs de contas separados por vírgula para exportação específica", required=False),
            OpenApiParameter('year', OpenApiTypes.INT, description="Ano das transações", required=False),
            OpenApiParameter('month', OpenApiTypes.INT, description="Mês das transações", required=False),
        ]
    )
    @action(detail=False, methods=['get'], url_path='export')
    def export_data(self, request):
        """
        Caminho: /api/transactions/export/
        """
        params = request.query_params
        raw_ids = params.get('account_ids', '')
        account_ids = [str(i).strip() for i in raw_ids.split(',') if str(i).strip()] or None
        year = int(params['year']) if params.get('year') else None
        month = int(params['month']) if params.get('month') else None

        data = FinanceDataService.export_data(
            user=request.user,
            account_ids=account_ids,
            year=year,
            month=month,
        )
        filename_parts = ['financeiro']
        if year:
            filename_parts.append(str(year))
        if month:
            filename_parts.append(str(month).zfill(2))
        filename = '_'.join(filename_parts) + '.json'

        response = HttpResponse(
            json.dumps(data, ensure_ascii=False, indent=2),
            content_type='application/json',
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    # ── Importação ────────────────────────────────────────────────────────────

    @extend_schema(
        summary="Importar dados financeiros",
        description="Importa dados financeiros a partir de um arquivo JSON (via multipart file) ou JSON body.",
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'file': {
                        'type': 'string',
                        'format': 'binary',
                        'description': 'Arquivo JSON gerado pela exportação'
                    }
                }
            },
            'application/json': OpenApiTypes.OBJECT
        }
    )
    @action(detail=False, methods=['post'], url_path='import')
    def import_data(self, request):
        """
        Caminho: /api/transactions/import/
        """
        # ── Leitura do payload ─────────────────────────────────────────────
        if request.FILES.get('file'):
            try:
                raw = json.loads(request.FILES['file'].read())
            except (json.JSONDecodeError, UnicodeDecodeError) as exc:
                return Response({'error': f'Arquivo JSON inválido: {exc}'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            raw = request.data

        # ── Normalização: array direto → wrapper padrão ────────────────────
        if isinstance(raw, list):
            payload = {'accounts': [], 'categories': [], 'transactions': raw}
        elif isinstance(raw, dict):
            payload = raw
        else:
            return Response(
                {'error': 'Payload inválido. Envie um objeto JSON ou um array de transações.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = FinanceDataService.import_data(user=request.user, payload=payload)
        return Response(result, status=status.HTTP_200_OK)

    # ── Exclusão em lote ──────────────────────────────────────────────────────

    @extend_schema(
        summary="Exclusão em lote",
        description="Exclui transações em lote baseado nos filtros de contas, ano e mês informados no corpo da requisição.",
        request=inline_serializer(
            name='BulkDeleteRequest',
            fields={
                'account_ids': serializers.ListField(child=serializers.CharField(), required=False, help_text="Lista de IDs de contas"),
                'year': serializers.IntegerField(required=False, allow_null=True),
                'month': serializers.IntegerField(required=False, allow_null=True),
            }
        ),
        responses={200: OpenApiTypes.OBJECT}
    )
    @action(detail=False, methods=['delete'], url_path='bulk-delete')
    def bulk_delete(self, request):
        """
        Caminho: /api/transactions/bulk-delete/
        """
        body = request.data
        raw_ids = body.get('account_ids') or []
        account_ids = [str(i).strip() for i in raw_ids if str(i).strip()] or None
        year = int(body['year']) if body.get('year') else None
        month = int(body['month']) if body.get('month') else None

        result = FinanceDataService.delete_bulk(
            user=request.user,
            account_ids=account_ids,
            year=year,
            month=month,
        )
        return Response(result, status=status.HTTP_200_OK)
