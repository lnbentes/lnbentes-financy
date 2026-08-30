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

    @extend_schema(
        summary="Excluir transação",
        description="Exclui uma transação e reverte o efeito no saldo. Se for uma transação parcelada e o parâmetro 'delete_all' for fornecido como 'true', exclui todas as parcelas do grupo.",
        parameters=[
            OpenApiParameter('delete_all', OpenApiTypes.STR, description="Se 'true' e a transação for parcelada, exclui todas as parcelas do mesmo grupo", required=False),
        ]
    )
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        delete_all = request.query_params.get('delete_all', 'false').lower() == 'true'

        if delete_all and instance.installment_id_group:
            TransactionService.delete_installment_group(instance.installment_id_group)
        else:
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

    # ── Gestão e Antecipação de Compras Parceladas ────────────────────────────

    @extend_schema(
        summary="Listar compras parceladas",
        description="Retorna todas as compras parceladas do usuário com status de pagamento, parcelas pagas/pendentes e projeção.",
        responses={200: OpenApiTypes.OBJECT}
    )
    @action(detail=False, methods=['get'], url_path='installments')
    def list_installments(self, request):
        """
        Caminho: /api/transactions/installments/
        """
        data = TransactionService.get_installment_groups(request.user)
        return Response(data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Antecipar parcelas de uma compra parcelada",
        description="Adiantar N parcelas futuras de um parcelamento para a data indicada com desconto opcional e reajuste automático das parcelas restantes.",
        request=inline_serializer(
            name='AnticipateInstallmentsRequest',
            fields={
                'count': serializers.IntegerField(required=False, default=1, min_value=1, help_text="Quantidade de parcelas a adiantar"),
                'target_date': serializers.DateField(required=False, help_text="Data de vencimento desejada para as parcelas adiantadas (padrão: hoje)"),
                'discount_amount': serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0.0, help_text="Valor total do desconto concedido"),
            }
        ),
        responses={200: OpenApiTypes.OBJECT}
    )
    @action(detail=False, methods=['post'], url_path=r'installments/(?P<group_id>[^/.]+)/anticipate')
    def anticipate_installments(self, request, group_id=None):
        """
        Caminho: /api/transactions/installments/{group_id}/anticipate/
        """
        count = request.data.get('count', 1)
        target_date_str = request.data.get('target_date')
        discount_amount = request.data.get('discount_amount', 0.0)

        target_date = None
        if target_date_str:
            try:
                target_date = date.fromisoformat(str(target_date_str))
            except ValueError:
                return Response({'error': 'Formato de data inválido. Use AAAA-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = TransactionService.anticipate_installments(
                user=request.user,
                group_id=group_id,
                count=count,
                target_date=target_date,
                discount_amount=discount_amount
            )
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as err:
            return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Quitar compra parcelada",
        description="Adiantar todas as parcelas futuras restantes para a data de quitação com desconto opcional.",
        request=inline_serializer(
            name='PayoffInstallmentsRequest',
            fields={
                'target_date': serializers.DateField(required=False, help_text="Data de quitação desejada (padrão: hoje)"),
                'discount_amount': serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0.0, help_text="Valor total do desconto"),
            }
        ),
        responses={200: OpenApiTypes.OBJECT}
    )
    @action(detail=False, methods=['post'], url_path=r'installments/(?P<group_id>[^/.]+)/payoff')
    def payoff_installments(self, request, group_id=None):
        """
        Caminho: /api/transactions/installments/{group_id}/payoff/
        """
        target_date_str = request.data.get('target_date')
        discount_amount = request.data.get('discount_amount', 0.0)

        target_date = None
        if target_date_str:
            try:
                target_date = date.fromisoformat(str(target_date_str))
            except ValueError:
                return Response({'error': 'Formato de data inválido. Use AAAA-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = TransactionService.payoff_installment_group(
                user=request.user,
                group_id=group_id,
                target_date=target_date,
                discount_amount=discount_amount
            )
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as err:
            return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)

