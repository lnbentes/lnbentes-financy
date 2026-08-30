import { useState, useEffect, useCallback } from 'react';
import { 
  Repeat, 
  Plus, 
  Zap, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Building2, 
  ArrowDownRight, 
  ArrowUpRight 
} from 'lucide-react';
import { financeService } from '../../services/finance';
import { formatBRL } from '../../utils/format';
import { extractArray } from '../../utils/helpers';
import { Logger } from '../../utils/logger';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { RecurringModal } from './RecurringModal';
import type { RecurringTransaction } from '../../types/finance';

export function Recurring() {
  const [recurrings, setRecurrings] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecurring, setSelectedRecurring] = useState<RecurringTransaction | null>(null);
  const [recurringToDelete, setRecurringToDelete] = useState<RecurringTransaction | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processMessage, setProcessMessage] = useState('');

  const loadRecurrings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await financeService.recurring.list();
      setRecurrings(extractArray(res));
    } catch (err) {
      Logger.error('Erro ao carregar transações recorrentes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecurrings();
  }, [loadRecurrings]);

  const handleOpenCreate = () => {
    setSelectedRecurring(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: RecurringTransaction) => {
    setSelectedRecurring(rec);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (rec: RecurringTransaction) => {
    try {
      await financeService.recurring.update(rec.id, {
        is_active: !rec.is_active,
      });
      await loadRecurrings();
    } catch (err) {
      Logger.error('Erro ao alternar status da recorrência:', err);
    }
  };

  const executeDelete = async () => {
    if (!recurringToDelete) return;
    setDeleteLoading(true);
    try {
      await financeService.recurring.delete(recurringToDelete.id);
      await loadRecurrings();
    } catch (err) {
      Logger.error('Erro ao excluir recorrência:', err);
    } finally {
      setDeleteLoading(false);
      setRecurringToDelete(null);
    }
  };

  const handleProcessPending = async () => {
    setProcessing(true);
    setProcessMessage('');
    try {
      const res = await financeService.recurring.processPending();
      if (res.processed_count > 0) {
        setProcessMessage(`✅ Sucesso! ${res.processed_count} transação(ões) gerada(s) no seu extrato.`);
      } else {
        setProcessMessage('ℹ️ Todas as recorrências ativas já foram lançadas para este mês.');
      }
      await loadRecurrings();
      setTimeout(() => setProcessMessage(''), 5000);
    } catch (err: unknown) {
      const errObj = err as Error;
      Logger.error('Erro ao processar transações recorrentes:', errObj);
      setProcessMessage(`❌ Erro: ${errObj.message || 'Falha ao processar'}`);
    } finally {
      setProcessing(false);
    }
  };

  // Cálculos Consolidados
  const activeList = recurrings.filter(r => r.is_active);
  const totalExpenseMonthly = activeList
    .filter(r => r.type === 'EXPENSE')
    .reduce((acc, r) => acc + Number(r.amount), 0);
  const totalIncomeMonthly = activeList
    .filter(r => r.type === 'INCOME')
    .reduce((acc, r) => acc + Number(r.amount), 0);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-earth-900 dark:text-earth-50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Repeat size={22} />
            </div>
            Recorrências & Assinaturas
          </h1>
          <p className="text-xs sm:text-sm text-earth-500 mt-1">
            Gerencie despesas fixas, salários e assinaturas com lançamentos automáticos no extrato.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleProcessPending}
            disabled={processing}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Lança as recorrências do mês que ainda não foram aplicadas"
          >
            <Zap size={16} />
            <span>{processing ? 'Processando...' : 'Lançar Pendentes'}</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-forest-600 hover:bg-forest-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-forest-600/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>Nova Recorrência</span>
          </button>
        </div>
      </div>

      {processMessage && (
        <div className="p-4 rounded-2xl bg-earth-50 dark:bg-earth-900 border border-earth-200 dark:border-earth-800 text-xs font-semibold text-earth-800 dark:text-earth-100 animate-in fade-in slide-in-from-top-2 duration-300">
          {processMessage}
        </div>
      )}

      {/* KPI Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-3xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-earth-400 uppercase tracking-wider">Despesas Fixas / Mês</span>
          <div className="text-2xl font-bold text-red-500">{formatBRL(totalExpenseMonthly)}</div>
          <div className="text-[11px] text-earth-500">Comprometido todo mês</div>
        </div>

        <div className="bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-3xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-earth-400 uppercase tracking-wider">Receitas Fixas / Mês</span>
          <div className="text-2xl font-bold text-forest-600 dark:text-forest-400">{formatBRL(totalIncomeMonthly)}</div>
          <div className="text-[11px] text-earth-500">Salários e entradas regulares</div>
        </div>

        <div className="bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-3xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-earth-400 uppercase tracking-wider">Total de Assinaturas</span>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{activeList.length} ativas</div>
          <div className="text-[11px] text-earth-500">{recurrings.length - activeList.length} pausadas</div>
        </div>
      </div>

      {/* Tabela / Lista de Recorrências */}
      <div className="bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-3xl shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-earth-100 dark:border-earth-800 pb-3">
          <h2 className="font-bold text-base text-earth-900 dark:text-earth-100 flex items-center gap-2">
            <span>📋</span> Todas as Assinaturas & Lançamentos Fixos
          </h2>
          <span className="text-xs text-earth-400 font-medium">{recurrings.length} cadastrada(s)</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-earth-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-600 mx-auto mb-3"></div>
            <span>Carregando recorrências...</span>
          </div>
        ) : recurrings.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-900/20 text-purple-500 flex items-center justify-center mx-auto text-2xl">
              🔄
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-earth-800 dark:text-earth-200">Nenhuma recorrência cadastrada</h3>
              <p className="text-xs text-earth-400 max-w-sm mx-auto">
                Adicione suas contas fixas (aluguel, condomínio, internet, streamings) para que sejam lançadas automaticamente.
              </p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="px-5 py-2.5 bg-forest-600 hover:bg-forest-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-forest-600/20 cursor-pointer"
            >
              Cadastrar Primeira Recorrência
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recurrings.map(rec => {
              const isIncome = rec.type === 'INCOME';

              return (
                <div
                  key={rec.id}
                  className={`p-5 rounded-2xl border transition-all space-y-3 ${
                    rec.is_active
                      ? 'bg-earth-50/50 dark:bg-earth-800/40 border-earth-200 dark:border-earth-800'
                      : 'bg-earth-100/40 dark:bg-earth-900/30 border-dashed border-earth-300 dark:border-earth-700 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm ${
                          isIncome ? 'bg-forest-600' : 'bg-red-500'
                        }`}
                      >
                        {isIncome ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-earth-900 dark:text-earth-100">{rec.description}</h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-earth-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> Dia {rec.day_of_month}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Building2 size={12} /> {rec.account_name}
                          </span>
                          {rec.category_name && (
                            <>
                              <span>•</span>
                              <span>{rec.category_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`font-bold text-base ${isIncome ? 'text-forest-600 dark:text-forest-400' : 'text-red-500'}`}>
                        {formatBRL(rec.amount)}
                      </div>
                      <span className="text-[10px] text-earth-400 block uppercase tracking-wider">
                        {rec.frequency === 'MONTHLY' ? 'Mensal' : rec.frequency === 'WEEKLY' ? 'Semanal' : 'Anual'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-earth-200/50 dark:border-earth-700/50 text-xs">
                    <button
                      onClick={() => handleToggleActive(rec)}
                      className={`flex items-center gap-1 font-semibold transition-colors cursor-pointer ${
                        rec.is_active ? 'text-forest-600 dark:text-forest-400 hover:underline' : 'text-earth-400 hover:text-earth-600'
                      }`}
                    >
                      {rec.is_active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      <span>{rec.is_active ? 'Ativa' : 'Pausada'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(rec)}
                        className="p-1.5 hover:bg-white dark:hover:bg-earth-800 rounded-lg text-earth-500 hover:text-earth-700 dark:hover:text-earth-200 transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => setRecurringToDelete(rec)}
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Criar/Editar */}
      <RecurringModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadRecurrings}
        selectedRecurring={selectedRecurring}
      />

      {/* Confirm Excluir */}
      <ConfirmModal
        isOpen={!!recurringToDelete}
        onClose={() => setRecurringToDelete(null)}
        onConfirm={executeDelete}
        title="Excluir Recorrência"
        message={`Tem certeza de que deseja excluir a assinatura "${recurringToDelete?.description}"?`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
}
