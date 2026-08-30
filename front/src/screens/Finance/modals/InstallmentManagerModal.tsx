import { useState, useEffect } from 'react';
import { 
  Zap, 
  Calendar, 
  Tag, 
  Layers, 
  Trash2, 
  AlertCircle
} from 'lucide-react';
import { Modal } from './Modal';
import { financeService } from '../../../services/finance';
import { formatBRL, formatDate } from '../../../utils/format';
import { Logger } from '../../../utils/logger';
import { getIconComponent } from '../../../utils/icons';
import type { InstallmentGroup } from '../../../types/finance';

interface InstallmentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string | null;
  onUpdated: () => void;
}

export function InstallmentManagerModal({
  isOpen,
  onClose,
  groupId,
  onUpdated
}: InstallmentManagerModalProps) {
  const [group, setGroup] = useState<InstallmentGroup | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Antecipação state
  const [anticipateCount, setAnticipateCount] = useState<number>(1);
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [targetDate, setTargetDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const loadGroupDetails = async () => {
    if (!groupId) return;
    try {
      setLoading(true);
      setError(null);
      const groups = await financeService.installments.list();
      const found = groups.find(g => g.group_id === groupId);
      if (found) {
        setGroup(found);
        setAnticipateCount(Math.min(1, found.remaining_count));
      } else {
        setError('Parcelamento não encontrado.');
      }
    } catch (err: unknown) {
      const errObj = err as Error;
      Logger.error('Erro ao buscar detalhes do parcelamento:', errObj);
      setError('Erro ao carregar detalhes do parcelamento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && groupId) {
      loadGroupDetails();
      setSuccessMsg(null);
      setDiscountAmount('0');
      setTargetDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, groupId]);

  const handleAnticipate = async () => {
    if (!groupId || !group) return;
    try {
      setActionLoading(true);
      setError(null);
      const parsedDiscount = parseFloat(discountAmount.replace(',', '.')) || 0;
      await financeService.installments.anticipate(groupId, {
        count: anticipateCount,
        target_date: targetDate,
        discount_amount: parsedDiscount,
      });

      setSuccessMsg(`${anticipateCount} parcela(s) adiantada(s) com sucesso para o mês atual!`);
      await loadGroupDetails();
      onUpdated();
    } catch (err: unknown) {
      const errObj = err as Error;
      Logger.error('Erro ao adiantar parcelas:', errObj);
      setError(errObj.message || 'Erro ao adiantar parcelas.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayoff = async () => {
    if (!groupId || !group) return;
    if (!window.confirm(`Deseja realmente quitar todas as ${group.remaining_count} parcelas restantes desta compra?`)) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      const parsedDiscount = parseFloat(discountAmount.replace(',', '.')) || 0;
      await financeService.installments.payoff(groupId, {
        target_date: targetDate,
        discount_amount: parsedDiscount,
      });

      setSuccessMsg(`Todas as parcelas restantes foram quitadas com sucesso!`);
      await loadGroupDetails();
      onUpdated();
    } catch (err: unknown) {
      const errObj = err as Error;
      Logger.error('Erro ao quitar parcelas:', errObj);
      setError(errObj.message || 'Erro ao quitar parcelas.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!groupId || !group) return;
    if (!window.confirm(`Tem certeza que deseja excluir TODAS as ${group.installment_total} parcelas desta compra? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setActionLoading(true);
      // Pega o id da primeira transação para acionar o delete em cascata
      if (group.transactions.length > 0) {
        await financeService.transactions.delete(group.transactions[0].id, true);
      }
      onUpdated();
      onClose();
    } catch (err: unknown) {
      const errObj = err as Error;
      Logger.error('Erro ao excluir parcelamento:', errObj);
      setError(errObj.message || 'Erro ao excluir parcelamento.');
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const CategoryIcon = group ? getIconComponent(group.category_icon) : Tag;
  const progressPercent = group && group.installment_total > 0 
    ? Math.round((group.paid_count / group.installment_total) * 100) 
    : 0;

  // Cálculo da simulação de valor a pagar na antecipação
  const avgInstallmentAmount = group && group.remaining_count > 0 
    ? (group.remaining_amount / group.remaining_count) 
    : 0;
  const rawAnticipateSum = avgInstallmentAmount * anticipateCount;
  const parsedDiscount = parseFloat(discountAmount.replace(',', '.')) || 0;
  const finalAnticipateSum = Math.max(0, rawAnticipateSum - parsedDiscount);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestão de Compra Parcelada">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 rounded-2xl text-xs flex items-center gap-2 border border-red-200 dark:border-red-900/40">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 rounded-2xl text-xs font-bold flex items-center gap-2 border border-green-200 dark:border-green-900/40">
            <span>✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        {loading || !group ? (
          <div className="py-12 text-center text-earth-400 text-xs">
            Carregando dados do parcelamento...
          </div>
        ) : (
          <>
            {/* Header da Compra */}
            <div className="p-4 rounded-3xl bg-earth-50 dark:bg-earth-800/50 border border-earth-200 dark:border-earth-800 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div 
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs" 
                  style={{ backgroundColor: group.category_color || '#22c55e' }}
                >
                  <CategoryIcon size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-earth-900 dark:text-earth-100 truncate">
                    {group.description}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-earth-500 mt-0.5">
                    <span>{group.account_name}</span>
                    <span>•</span>
                    <span className="font-semibold text-earth-700 dark:text-earth-300">
                      {group.category_name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs text-earth-400 block">Total da Compra</span>
                <span className="font-bold text-sm sm:text-base text-earth-900 dark:text-earth-100">
                  {formatBRL(group.total_amount)}
                </span>
              </div>
            </div>

            {/* Barra de Progresso do Parcelamento */}
            <div className="bg-white dark:bg-earth-900 p-4 rounded-3xl border border-earth-200 dark:border-earth-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-earth-700 dark:text-earth-300 flex items-center gap-1.5">
                  <Layers size={15} className="text-forest-600" />
                  Progresso: {group.paid_count} de {group.installment_total} parcelas
                </span>
                <span className="font-extrabold text-forest-600 dark:text-forest-400">
                  {progressPercent}%
                </span>
              </div>

              <div className="w-full h-3 bg-earth-100 dark:bg-earth-800 rounded-full overflow-hidden p-0.5 border border-earth-200 dark:border-earth-700">
                <div 
                  className="h-full bg-forest-500 rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="p-2.5 rounded-2xl bg-earth-50 dark:bg-earth-800/40 border border-earth-100 dark:border-earth-800">
                  <span className="text-[10px] text-earth-400 block">Já Pago</span>
                  <strong className="text-forest-600 dark:text-forest-400 font-bold text-xs sm:text-sm">
                    {formatBRL(group.paid_amount)}
                  </strong>
                </div>

                <div className="p-2.5 rounded-2xl bg-earth-50 dark:bg-earth-800/40 border border-earth-100 dark:border-earth-800">
                  <span className="text-[10px] text-earth-400 block">Restante Futuro</span>
                  <strong className="text-amber-600 dark:text-amber-400 font-bold text-xs sm:text-sm">
                    {formatBRL(group.remaining_amount)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Seção de Antecipação de Parcelas */}
            {group.remaining_count > 0 ? (
              <div className="bg-white dark:bg-earth-900 p-4 sm:p-5 rounded-3xl border-2 border-forest-500/30 dark:border-forest-500/20 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-forest-100 dark:bg-forest-900/30 text-forest-600 dark:text-forest-400">
                      <Zap size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-earth-900 dark:text-earth-100">
                        Adiantar Parcelas Futuras
                      </h4>
                      <p className="text-[11px] text-earth-500">
                        Pague parcelas futuras agora e reajuste o cronograma
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-forest-100 dark:bg-forest-900/40 text-forest-700 dark:text-forest-300 font-bold text-[10px]">
                    {group.remaining_count} restante(s)
                  </span>
                </div>

                {/* Seleção de quantidade */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300">
                    Quantas parcelas deseja adiantar para este mês?
                  </label>

                  {/* Quick chips de parcelas */}
                  <div className="flex gap-1.5 flex-wrap">
                    {[1, 2, 3, 4, 6].filter(n => n <= group.remaining_count).map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setAnticipateCount(n)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          anticipateCount === n
                            ? 'bg-forest-600 text-white shadow-xs'
                            : 'bg-earth-100 dark:bg-earth-800 text-earth-700 dark:text-earth-300 hover:bg-earth-200'
                        }`}
                      >
                        +{n} {n === 1 ? 'parcela' : 'parcelas'}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAnticipateCount(group.remaining_count)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        anticipateCount === group.remaining_count
                          ? 'bg-forest-600 text-white shadow-xs'
                          : 'bg-forest-50 dark:bg-forest-900/30 text-forest-700 dark:text-forest-300 hover:bg-forest-100'
                      }`}
                    >
                      Todas ({group.remaining_count}x)
                    </button>
                  </div>
                </div>

                {/* Desconto de antecipação opcional */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">
                      Desconto Concedido (R$)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={discountAmount}
                      onChange={e => setDiscountAmount(e.target.value)}
                      placeholder="0,00"
                      className="w-full px-3.5 py-2 rounded-2xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-xs font-bold text-earth-800 dark:text-earth-100 outline-none focus:ring-2 focus:ring-forest-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">
                      Data de Vencimento Alvo
                    </label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={e => setTargetDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-2xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-xs font-bold text-earth-800 dark:text-earth-100 outline-none focus:ring-2 focus:ring-forest-500"
                    />
                  </div>
                </div>

                {/* Simulação de valor e Botão de Ação */}
                <div className="p-3 bg-forest-50/70 dark:bg-forest-950/20 rounded-2xl border border-forest-200 dark:border-forest-900/30 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-earth-500 block">Total a ser adiantado:</span>
                    <strong className="text-forest-700 dark:text-forest-300 font-extrabold text-sm">
                      {formatBRL(finalAnticipateSum)}
                    </strong>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAnticipate}
                      disabled={actionLoading}
                      className="py-2 px-3.5 bg-forest-600 hover:bg-forest-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-forest-600/20 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Zap size={14} />
                      <span>{actionLoading ? 'Processando...' : `Adiantar ${anticipateCount}x`}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePayoff}
                      disabled={actionLoading}
                      className="py-2 px-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                      title="Quitar todas as parcelas restantes de uma vez"
                    >
                      <span>⚡ Quitar Tudo</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-3xl border border-green-200 dark:border-green-900/40 text-center space-y-1">
                <span className="text-xl">🎉</span>
                <h4 className="font-bold text-xs text-green-700 dark:text-green-300">
                  Compra Totalmente Quitada!
                </h4>
                <p className="text-[11px] text-green-600 dark:text-green-400">
                  Todas as {group.installment_total} parcelas foram pagas com sucesso.
                </p>
              </div>
            )}

            {/* Linha do Tempo / Histórico de Todas as Parcelas */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-earth-700 dark:text-earth-300 flex items-center gap-1.5">
                <Calendar size={14} className="text-forest-600" />
                Cronograma Detalhado das Parcelas
              </h4>

              <div className="max-h-56 overflow-y-auto rounded-2xl border border-earth-200 dark:border-earth-800 divide-y divide-earth-100 dark:divide-earth-800 bg-white dark:bg-earth-900">
                {group.transactions.map((tx) => (
                  <div key={tx.id} className="p-3 flex items-center justify-between text-xs hover:bg-earth-50 dark:hover:bg-earth-800/30 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-xl bg-earth-100 dark:bg-earth-800 text-earth-700 dark:text-earth-300 font-bold flex items-center justify-center text-[10px]">
                        {tx.installment_current}x
                      </span>
                      <div>
                        <span className="font-semibold text-earth-800 dark:text-earth-200 block text-xs">
                          Parcela {tx.installment_current} de {tx.installment_total}
                        </span>
                        <span className="text-[10px] text-earth-400">
                          Vencimento: {formatDate(tx.date)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <strong className="font-bold text-earth-900 dark:text-earth-100">
                        {formatBRL(tx.amount)}
                      </strong>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                        tx.is_paid
                          ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300'
                          : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                      }`}>
                        {tx.is_paid ? 'Paga' : 'Futura'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ação de Exclusão do Grupo */}
            <div className="pt-2 border-t border-earth-100 dark:border-earth-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={actionLoading}
                className="py-2 px-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Excluir Compra Completa</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-5 bg-earth-100 dark:bg-earth-800 hover:bg-earth-200 dark:hover:bg-earth-700 text-earth-800 dark:text-earth-200 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
