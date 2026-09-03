import { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  CheckCircle2, 
  TrendingUp,
  Tag
} from 'lucide-react';
import { financeService } from '../../services/finance';
import { formatBRL } from '../../utils/format';
import { extractArray } from '../../utils/helpers';
import { Logger } from '../../utils/logger';
import { getIconComponent } from '../../utils/icons';
import { InstallmentManagerModal } from '../../screens/Finance/modals/InstallmentManagerModal';
import type { InstallmentGroup, InstallmentItem } from '../../types/finance';

const MONTHS_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const MONTHS_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function InstallmentGanttChart() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-indexed
  
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [installments, setInstallments] = useState<InstallmentGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState<boolean>(false);

  const loadInstallments = async () => {
    try {
      setLoading(true);
      const res = await financeService.installments.list();
      setInstallments(extractArray(res));
    } catch (err) {
      Logger.error('Erro ao carregar compras parceladas para o Gantt:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstallments();
  }, []);

  // Filtra compras parceladas que possuem pelo menos uma parcela no ano selecionado
  const filteredPurchases = useMemo(() => {
    return installments.filter(group => {
      return group.transactions.some(tx => {
        const txYear = new Date(tx.date + 'T00:00:00').getFullYear();
        return txYear === selectedYear;
      });
    });
  }, [installments, selectedYear]);

  // Calcula os totais mensais no ano selecionado (12 meses)
  const monthlyTotals = useMemo(() => {
    const totals = Array(12).fill(0);
    const countPerMonth = Array(12).fill(0);

    filteredPurchases.forEach(group => {
      group.transactions.forEach(tx => {
        const d = new Date(tx.date + 'T00:00:00');
        if (d.getFullYear() === selectedYear) {
          const m = d.getMonth(); // 0-11
          totals[m] += Number(tx.amount);
          countPerMonth[m] += 1;
        }
      });
    });

    return { totals, countPerMonth };
  }, [filteredPurchases, selectedYear]);

  // Estatísticas anuais
  const totalYearAmount = useMemo(() => {
    return monthlyTotals.totals.reduce((acc, v) => acc + v, 0);
  }, [monthlyTotals]);

  const maxMonthValue = useMemo(() => {
    return Math.max(...monthlyTotals.totals, 0);
  }, [monthlyTotals]);

  const peakMonthIndex = useMemo(() => {
    if (maxMonthValue === 0) return -1;
    return monthlyTotals.totals.indexOf(maxMonthValue);
  }, [monthlyTotals, maxMonthValue]);

  const handleOpenManager = (groupId: string) => {
    setSelectedGroupId(groupId);
    setIsManagerModalOpen(true);
  };

  return (
    <div className="bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-3xl p-4 sm:p-6 shadow-sm space-y-5">
      {/* Header com Título e Navegação de Ano */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-earth-100 dark:border-earth-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Layers size={22} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-earth-900 dark:text-earth-50 flex items-center gap-2">
              Cronograma de Parcelamentos
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/30">
                Gantt
              </span>
            </h3>
            <p className="text-xs text-earth-500 mt-0.5">
              Visualização temporal de todas as compras parceladas e impacto mensal no ano de {selectedYear}.
            </p>
          </div>
        </div>

        {/* Controles de Navegação de Ano */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-earth-100 dark:bg-earth-800/60 p-1 rounded-2xl border border-earth-200 dark:border-earth-700">
          <button
            onClick={() => setSelectedYear(y => y - 1)}
            className="p-2 rounded-xl hover:bg-white dark:hover:bg-earth-700 text-earth-600 dark:text-earth-300 transition-colors cursor-pointer"
            title="Ano anterior"
            aria-label="Ano anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={() => setSelectedYear(currentYear)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedYear === currentYear
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-earth-700 dark:text-earth-200 hover:bg-white dark:hover:bg-earth-700'
            }`}
          >
            {selectedYear} {selectedYear === currentYear && '(Atual)'}
          </button>

          <button
            onClick={() => setSelectedYear(y => y + 1)}
            className="p-2 rounded-xl hover:bg-white dark:hover:bg-earth-700 text-earth-600 dark:text-earth-300 transition-colors cursor-pointer"
            title="Próximo ano"
            aria-label="Próximo ano"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* KPI Cards de Resumo Anual */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-earth-50/60 dark:bg-earth-800/40 border border-earth-100 dark:border-earth-800">
          <span className="text-[11px] font-semibold text-earth-400 block uppercase tracking-wider">
            Comprometido em {selectedYear}
          </span>
          <div className="text-base sm:text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
            {formatBRL(totalYearAmount)}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-earth-50/60 dark:bg-earth-800/40 border border-earth-100 dark:border-earth-800">
          <span className="text-[11px] font-semibold text-earth-400 block uppercase tracking-wider">
            Compras Ativas no Ano
          </span>
          <div className="text-base sm:text-lg font-extrabold text-earth-900 dark:text-earth-100 mt-0.5">
            {filteredPurchases.length} compra(s)
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-earth-50/60 dark:bg-earth-800/40 border border-earth-100 dark:border-earth-800">
          <span className="text-[11px] font-semibold text-earth-400 block uppercase tracking-wider">
            Média Mensal
          </span>
          <div className="text-base sm:text-lg font-extrabold text-earth-700 dark:text-earth-200 mt-0.5">
            {formatBRL(totalYearAmount / 12)}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-earth-50/60 dark:bg-earth-800/40 border border-earth-100 dark:border-earth-800">
          <span className="text-[11px] font-semibold text-earth-400 block uppercase tracking-wider">
            Mês com Maior Peso
          </span>
          <div className="text-base sm:text-lg font-extrabold text-purple-600 dark:text-purple-400 mt-0.5 truncate">
            {peakMonthIndex >= 0 ? `${MONTHS_FULL[peakMonthIndex]} (${formatBRL(maxMonthValue)})` : 'Nenhum'}
          </div>
        </div>
      </div>

      {/* Gráfico de Gantt / Tabela Cronológica */}
      {loading ? (
        <div className="py-16 text-center text-earth-400 text-xs space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
          <span>Carregando cronograma anual...</span>
        </div>
      ) : filteredPurchases.length === 0 ? (
        <div className="py-14 text-center space-y-3 bg-earth-50/40 dark:bg-earth-800/20 rounded-3xl border border-dashed border-earth-200 dark:border-earth-800 p-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center mx-auto text-xl">
            📅
          </div>
          <div>
            <h4 className="font-bold text-sm text-earth-800 dark:text-earth-200">
              Nenhum parcelamento com vencimento em {selectedYear}
            </h4>
            <p className="text-xs text-earth-400 max-w-md mx-auto mt-1">
              Todas as parcelas deste período já foram quitadas ou pertencem a outros anos. Use os botões acima para navegar entre os anos.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto no-scrollbar rounded-2xl border border-earth-200 dark:border-earth-800 bg-white dark:bg-earth-900 shadow-xs">
          <div className="min-w-[950px]">
            {/* Header das Colunas (Meses do Ano) */}
            <div className="grid grid-cols-16 bg-earth-100/70 dark:bg-earth-800/70 border-b border-earth-200 dark:border-earth-800 text-xs font-bold text-earth-600 dark:text-earth-300 py-3 px-3">
              {/* Coluna de Descrição da Compra (ocupa 4 colunas) */}
              <div className="col-span-4 flex items-center gap-1.5 pl-2">
                <span>Compra / Detalhes</span>
              </div>

              {/* 12 Colunas dos Meses (cada uma ocupa 1 coluna) */}
              {MONTHS_SHORT.map((m, idx) => {
                const isCurrent = selectedYear === currentYear && (idx + 1) === currentMonth;
                return (
                  <div 
                    key={m} 
                    className={`col-span-1 text-center py-0.5 rounded-lg transition-colors ${
                      isCurrent 
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold border border-amber-500/40' 
                        : ''
                    }`}
                  >
                    <span>{m}</span>
                    {isCurrent && (
                      <span className="block text-[9px] text-amber-600 dark:text-amber-400 font-normal -mt-0.5">
                        Hoje
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Linhas do Gráfico de Gantt (Compras Parceladas) */}
            <div className="divide-y divide-earth-100 dark:divide-earth-800/70">
              {filteredPurchases.map(group => {
                const CategoryIcon = group.category_icon ? getIconComponent(group.category_icon) : Tag;
                const isPaidAll = group.status === 'PAID';

                // Mapeia as transações deste grupo que caem no ano selecionado
                const txByMonth: { [monthIdx: number]: InstallmentItem } = {};
                group.transactions.forEach(tx => {
                  const d = new Date(tx.date + 'T00:00:00');
                  if (d.getFullYear() === selectedYear) {
                    txByMonth[d.getMonth()] = tx;
                  }
                });

                // Determina o intervalo do Gantt no ano selecionado
                const monthsPresent = Object.keys(txByMonth).map(Number);
                const firstMonthInYear = monthsPresent.length > 0 ? Math.min(...monthsPresent) : -1;
                const lastMonthInYear = monthsPresent.length > 0 ? Math.max(...monthsPresent) : -1;

                return (
                  <div
                    key={group.group_id}
                    onClick={() => handleOpenManager(group.group_id)}
                    className="grid grid-cols-16 items-center py-3.5 px-3 hover:bg-earth-50/80 dark:hover:bg-earth-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Coluna 1 a 4: Info da Compra */}
                    <div className="col-span-4 pr-3 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs" 
                          style={{ backgroundColor: group.category_color || '#f59e0b' }}
                        >
                          <CategoryIcon size={15} />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-earth-900 dark:text-earth-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {group.description}
                          </h5>
                          <div className="flex items-center gap-1.5 text-[11px] text-earth-400 mt-0.5 truncate">
                            <span className="truncate">{group.account_name}</span>
                            <span>•</span>
                            <span className="font-semibold text-earth-700 dark:text-earth-300">
                              {group.installment_total}x de {formatBRL(group.total_amount / group.installment_total)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Colunas 5 a 16: Linha do Tempo (12 Meses) */}
                    {Array.from({ length: 12 }).map((_, monthIdx) => {
                      const tx = txByMonth[monthIdx];
                      const isInRange = firstMonthInYear !== -1 && monthIdx >= firstMonthInYear && monthIdx <= lastMonthInYear;
                      const isCurrent = selectedYear === currentYear && (monthIdx + 1) === currentMonth;

                      return (
                        <div 
                          key={monthIdx} 
                          className={`col-span-1 h-12 flex items-center justify-center relative ${
                            isCurrent ? 'bg-amber-500/5 dark:bg-amber-500/10' : ''
                          }`}
                        >
                          {/* Barra contínua de conexão estilo Gantt */}
                          {isInRange && (
                            <div 
                              className={`absolute h-2.5 top-1/2 -translate-y-1/2 z-0 opacity-40 transition-all ${
                                isPaidAll ? 'bg-emerald-400 dark:bg-emerald-600' : 'bg-amber-400 dark:bg-amber-500'
                              } ${
                                monthIdx === firstMonthInYear ? 'left-1/2 rounded-l-full' : 'left-0'
                              } ${
                                monthIdx === lastMonthInYear ? 'right-1/2 rounded-r-full' : 'right-0'
                              }`}
                            />
                          )}

                          {/* Badge da Parcela naquele mês */}
                          {tx ? (
                            <div
                              className={`relative z-10 w-full mx-1 py-1 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all transform group-hover:scale-105 shadow-xs ${
                                tx.is_paid
                                  ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                                  : 'bg-amber-500 text-white shadow-amber-500/20'
                              }`}
                              title={`Parcela ${tx.installment_current}/${tx.installment_total} - ${formatBRL(tx.amount)} (${tx.is_paid ? 'Paga' : 'Pendente'})`}
                            >
                              <div className="flex items-center gap-0.5 text-[10px] font-extrabold leading-none">
                                {tx.is_paid && <CheckCircle2 size={10} className="shrink-0" />}
                                <span>{tx.installment_current}x</span>
                              </div>
                              <span className="text-[9px] font-semibold opacity-90 leading-none mt-0.5">
                                {formatBRL(tx.amount).replace('R$', '').trim()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-earth-300 dark:text-earth-700">•</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Linha de Totais Mensais no Rodapé da Tabela */}
            <div className="grid grid-cols-16 bg-earth-50 dark:bg-earth-800/80 border-t-2 border-earth-200 dark:border-earth-700 py-3 px-3 text-xs font-bold items-center">
              <div className="col-span-4 pl-2 flex items-center gap-2">
                <TrendingUp size={16} className="text-amber-600" />
                <span className="text-earth-800 dark:text-earth-100">
                  Total Mensal em {selectedYear}:
                </span>
              </div>

              {monthlyTotals.totals.map((amt, idx) => {
                const isCurrent = selectedYear === currentYear && (idx + 1) === currentMonth;
                return (
                  <div 
                    key={idx} 
                    className={`col-span-1 text-center font-extrabold ${
                      amt > 0 
                        ? (isCurrent ? 'text-amber-600 dark:text-amber-400 underline decoration-2' : 'text-earth-800 dark:text-earth-100') 
                        : 'text-earth-400 dark:text-earth-600 font-normal'
                    }`}
                  >
                    {amt > 0 ? (
                      <div>
                        <div className="text-[10px] leading-tight font-extrabold">
                          {formatBRL(amt).replace('R$', '').trim()}
                        </div>
                        <span className="text-[8px] font-normal text-earth-400 block leading-none">
                          {monthlyTotals.countPerMonth[idx]}x
                        </span>
                      </div>
                    ) : (
                      '—'
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gestão e Antecipação de Parcelamento */}
      {isManagerModalOpen && selectedGroupId && (
        <InstallmentManagerModal
          isOpen={isManagerModalOpen}
          onClose={() => {
            setIsManagerModalOpen(false);
            setSelectedGroupId(null);
          }}
          groupId={selectedGroupId}
          onUpdated={loadInstallments}
        />
      )}
    </div>
  );
}
