import { useState, useEffect, useCallback } from 'react';
import { 
  Target, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Edit2, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle 
} from 'lucide-react';
import { financeService } from '../../services/finance';
import { formatBRL } from '../../utils/format';
import { extractArray } from '../../utils/helpers';
import { Logger } from '../../utils/logger';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { BudgetModal } from './BudgetModal';
import { getIconComponent } from '../../utils/icons';
import type { BudgetSummary } from '../../types/finance';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function Budgets() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [budgets, setBudgets] = useState<BudgetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<BudgetSummary | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<BudgetSummary | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await financeService.budgets.summary({ month, year });
      setBudgets(extractArray(res));
    } catch (err) {
      Logger.error('Erro ao carregar metas de orçamento:', err);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  const handleOpenCreate = () => {
    setSelectedBudget(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: BudgetSummary) => {
    setSelectedBudget(b);
    setIsModalOpen(true);
  };

  const executeDelete = async () => {
    if (!budgetToDelete) return;
    setDeleteLoading(true);
    try {
      await financeService.budgets.delete(budgetToDelete.id);
      await loadBudgets();
    } catch (err) {
      Logger.error('Erro ao excluir orçamento:', err);
    } finally {
      setDeleteLoading(false);
      setBudgetToDelete(null);
    }
  };

  // Cálculos Consolidados do Mês
  const totalBudgeted = budgets.reduce((acc, b) => acc + b.amount_limit, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent_amount, 0);
  const totalRemaining = totalBudgeted - totalSpent;
  const overallPercentage = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-earth-900 dark:text-earth-50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-forest-100 dark:bg-forest-900/30 text-forest-600 dark:text-forest-400 flex items-center justify-center">
              <Target size={22} />
            </div>
            Metas & Orçamentos
          </h1>
          <p className="text-xs sm:text-sm text-earth-500 mt-1">
            Defina limites de despesas por categoria e acompanhe seus gastos em tempo real.
          </p>
        </div>

        {/* Mês Seletor & Botão Nova Meta */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-2xl p-1 shadow-sm">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-earth-100 dark:hover:bg-earth-800 rounded-xl text-earth-600 dark:text-earth-400 cursor-pointer transition-colors"
              title="Mês anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs font-bold px-3 min-w-[130px] text-center text-earth-800 dark:text-earth-100">
              {MONTHS[month - 1]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-earth-100 dark:hover:bg-earth-800 rounded-xl text-earth-600 dark:text-earth-400 cursor-pointer transition-colors"
              title="Próximo mês"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-forest-600 hover:bg-forest-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-forest-600/20 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>Nova Meta</span>
          </button>
        </div>
      </div>

      {/* KPI Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-3xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-earth-400 uppercase tracking-wider">Total Orçado</span>
          <div className="text-2xl font-bold text-earth-900 dark:text-earth-50">{formatBRL(totalBudgeted)}</div>
          <div className="text-[11px] text-earth-500">{budgets.length} categoria(s) com meta</div>
        </div>

        <div className="bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-3xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-earth-400 uppercase tracking-wider">Gasto Realizado</span>
          <div className="text-2xl font-bold text-red-500 dark:text-red-400">{formatBRL(totalSpent)}</div>
          <div className="text-[11px] text-earth-500">Despesas no mês</div>
        </div>

        <div className="bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-3xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-earth-400 uppercase tracking-wider">Saldo Restante</span>
          <div className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-forest-600 dark:text-forest-400' : 'text-red-600'}`}>
            {formatBRL(totalRemaining)}
          </div>
          <div className="text-[11px] text-earth-500">Disponível no teto</div>
        </div>

        <div className="bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-3xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-earth-400 uppercase tracking-wider">Uso do Orçamento</span>
          <div className={`text-2xl font-bold ${overallPercentage > 100 ? 'text-red-500' : overallPercentage >= 80 ? 'text-amber-500' : 'text-forest-500'}`}>
            {overallPercentage}%
          </div>
          <div className="w-full bg-earth-100 dark:bg-earth-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallPercentage > 100 ? 'bg-red-500' : overallPercentage >= 80 ? 'bg-amber-500' : 'bg-forest-500'
              }`}
              style={{ width: `${Math.min(overallPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Lista de Metas por Categoria */}
      <div className="bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-3xl shadow-sm overflow-hidden p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-earth-100 dark:border-earth-800 pb-4">
          <h2 className="font-bold text-base text-earth-900 dark:text-earth-100 flex items-center gap-2">
            <span>📊</span> Acompanhamento por Categoria
          </h2>
          <span className="text-xs text-earth-400">
            {MONTHS[month - 1]} de {year}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-earth-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-600 mx-auto mb-3"></div>
            <span>Carregando orçamentos...</span>
          </div>
        ) : budgets.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-forest-50 dark:bg-forest-900/20 text-forest-500 flex items-center justify-center mx-auto text-2xl">
              🎯
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-earth-800 dark:text-earth-200">Nenhuma meta estipulada para este mês</h3>
              <p className="text-xs text-earth-400 max-w-sm mx-auto">
                Crie orçamentos para manter suas despesas sob controle e receber alertas visuais quando estiver perto do limite.
              </p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="px-5 py-2.5 bg-forest-600 hover:bg-forest-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-forest-600/20 cursor-pointer"
            >
              Criar Primeira Meta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map(b => {
              const isExceeded = b.status === 'EXCEEDED';
              const isWarning = b.status === 'WARNING';

              return (
                <div
                  key={b.id}
                  className={`p-5 rounded-2xl border transition-all space-y-4 ${
                    isExceeded
                      ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'
                      : isWarning
                      ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                      : 'bg-earth-50/50 dark:bg-earth-800/40 border-earth-200 dark:border-earth-800'
                  }`}
                >
                  {/* Cabeçalho da Meta */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
                        style={{ backgroundColor: b.category_color || '#22c55e' }}
                      >
                        {(() => {
                          const IconComp = getIconComponent(b.category_icon, HelpCircle);
                          return <IconComp size={20} />;
                        })()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-earth-900 dark:text-earth-100">{b.category_name}</h4>
                        <div className="flex items-center gap-2 text-xs text-earth-500 mt-0.5">
                          <span>Limite: <strong>{formatBRL(b.amount_limit)}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="p-2 hover:bg-white dark:hover:bg-earth-800 rounded-xl text-earth-500 hover:text-earth-700 dark:hover:text-earth-200 transition-colors cursor-pointer"
                        title="Editar Meta"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setBudgetToDelete(b)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                        title="Excluir Meta"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-earth-600 dark:text-earth-400">
                        Gasto: <strong className="text-earth-900 dark:text-earth-100">{formatBRL(b.spent_amount)}</strong>
                      </span>
                      <span className={isExceeded ? 'text-red-600 font-bold' : isWarning ? 'text-amber-600 font-bold' : 'text-forest-600 dark:text-forest-400'}>
                        {b.percentage_spent}%
                      </span>
                    </div>

                    <div className="w-full bg-earth-200 dark:bg-earth-700 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isExceeded ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-forest-500'
                        }`}
                        style={{ width: `${Math.min(b.percentage_spent, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Status e Saldo Restante */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-earth-200/40 dark:border-earth-700/40">
                    <div className="flex items-center gap-1.5">
                      {isExceeded ? (
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-bold">
                          <AlertTriangle size={14} /> Limite Ultrapassado
                        </span>
                      ) : isWarning ? (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                          <AlertTriangle size={14} /> Perto do Limite
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-forest-600 dark:text-forest-400 font-bold">
                          <CheckCircle2 size={14} /> Dentro da Meta
                        </span>
                      )}
                    </div>
                    <span className="text-earth-500">
                      {b.remaining_amount >= 0 ? `Restam ${formatBRL(b.remaining_amount)}` : `Estourou ${formatBRL(Math.abs(b.remaining_amount))}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Criar/Editar */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadBudgets}
        selectedBudget={selectedBudget}
        currentMonth={month}
        currentYear={year}
      />

      {/* Confirm Excluir */}
      <ConfirmModal
        isOpen={!!budgetToDelete}
        onClose={() => setBudgetToDelete(null)}
        onConfirm={executeDelete}
        title="Excluir Meta de Orçamento"
        message={`Deseja remover a meta para "${budgetToDelete?.category_name}" do mês de ${MONTHS[month - 1]}?`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
}
