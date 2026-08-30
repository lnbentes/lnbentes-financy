import { useState } from 'react';
import { Search, Plus, TrendingUp, ArrowRightLeft, Trash2, Edit2, X, Zap } from 'lucide-react';
import { useFinance } from '../FinanceContext';
import { formatBRL, formatDate } from '../../../utils/format';
import { financeService } from '../../../services/finance';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { Modal } from '../modals/Modal';
import { InstallmentManagerModal } from '../modals/InstallmentManagerModal';
import { Logger } from '../../../utils/logger';
import { getIconComponent } from '../../../utils/icons';
import type { Transaction } from '../../../types/finance';

const TYPE_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'EXPENSE', label: 'Despesas' },
  { value: 'INCOME', label: 'Receitas' },
  { value: 'TRANSFER', label: 'Transferências' },
];

export function TransactionList() {
  const { 
    transactions, search, setSearch, txType, setTxType,
    setTransactionModalOpen, setSelectedTransaction, loadData
  } = useFinance();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSimpleDeleteConfirm, setShowSimpleDeleteConfirm] = useState(false);
  const [selectedTxToDelete, setSelectedTxToDelete] = useState<Transaction | null>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // Modal de Parcelamento
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);

  const handleOpenInstallmentManager = (groupId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedGroupId(groupId);
    setIsInstallmentModalOpen(true);
  };

  const handleDeleteTransaction = (t: Transaction, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedTxToDelete(t);
    if (t.installment_id_group) {
      setShowDeleteConfirm(true);
    } else {
      setShowSimpleDeleteConfirm(true);
    }
  };

  const executeDelete = async (deleteAll = false) => {
    if (!selectedTxToDelete) return;
    try {
      setLoadingDelete(true);
      await financeService.transactions.delete(selectedTxToDelete.id, deleteAll);
      await loadData();
    } catch (err: unknown) {
      const errObj = err as Error;
      Logger.error('Erro ao excluir transação:', errObj);
      alert(errObj.message || 'Erro ao excluir transação');
    } finally {
      setLoadingDelete(false);
      setShowDeleteConfirm(false);
      setShowSimpleDeleteConfirm(false);
      setSelectedTxToDelete(null);
    }
  };

  const handleNewTransaction = () => {
    setSelectedTransaction(null);
    setTransactionModalOpen(true);
  };

  const handleEditTransaction = (t: Transaction) => {
    setSelectedTransaction(t);
    setTransactionModalOpen(true);
  };

  return (
    <>
      <div className="lg:col-span-2 space-y-3 pb-24 md:pb-6">
        {/* Header da Seção */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-earth-900 dark:text-earth-100">
              Lançamentos
            </h3>
            <span className="text-xs text-earth-400 font-medium">
              {transactions.length} registro(s) encontrado(s)
            </span>
          </div>
          <button 
            onClick={handleNewTransaction} 
            className="flex items-center gap-1.5 text-xs sm:text-sm bg-forest-600 hover:bg-forest-700 text-white px-3.5 py-2 rounded-2xl transition-all shadow-md shadow-forest-600/20 font-bold cursor-pointer shrink-0"
          >
            <Plus size={16} /> 
            <span>Nova Transação</span>
          </button>
        </div>

        {/* Barra de Filtros & Busca Mobile-First */}
        <div className="bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-3xl p-3 sm:p-4 space-y-2.5 shadow-xs">
          {/* Input de Busca */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-earth-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por descrição..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 rounded-2xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-xs text-earth-800 dark:text-earth-100 outline-none focus:ring-2 focus:ring-forest-500"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth-600 dark:hover:text-earth-200 p-1 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filtros em Chips Horizontais (Touch Scrollable) */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {TYPE_FILTERS.map(f => {
              const active = txType === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setTxType(f.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    active
                      ? 'bg-forest-600 text-white shadow-xs'
                      : 'bg-earth-100 dark:bg-earth-800 text-earth-600 dark:text-earth-400 hover:bg-earth-200 dark:hover:bg-earth-700'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de Transações */}
        <div className="bg-white dark:bg-earth-900 rounded-3xl border border-earth-200 dark:border-earth-800 overflow-hidden shadow-xs divide-y divide-earth-100 dark:divide-earth-800/80">
          {transactions.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-earth-100 dark:bg-earth-800 text-earth-400 flex items-center justify-center mx-auto text-xl">
                💳
              </div>
              <p className="text-xs font-bold text-earth-700 dark:text-earth-300">Nenhuma transação encontrada</p>
              <p className="text-[11px] text-earth-400">Tente ajustar a busca ou adicionar um novo lançamento.</p>
            </div>
          ) : (
            transactions.map(t => {
              const isTransfer = t.type === 'TRANSFER';
              const isIncome = t.type === 'INCOME';
              const sign = isIncome ? '+' : (isTransfer ? '⇄' : '-');
              const amtClass = isIncome 
                ? 'text-forest-600 dark:text-forest-400' 
                : isTransfer 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-red-500';
              
              const CategoryIcon = getIconComponent(t.category_icon);

              return (
                <div 
                  key={t.id} 
                  onClick={() => handleEditTransaction(t)}
                  className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-earth-50 dark:hover:bg-earth-800/40 transition-colors cursor-pointer active:scale-[0.99] group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs" 
                      style={{ backgroundColor: isTransfer ? '#3b82f6' : (t.category_color || '#10b981') }}
                    >
                      {isTransfer ? <ArrowRightLeft size={18} /> : isIncome ? <TrendingUp size={18} /> : <CategoryIcon size={18} />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-earth-900 dark:text-earth-100 truncate">
                        {t.description}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-earth-500 mt-0.5">
                        <span>{formatDate(t.date)}</span>
                        <span>•</span>
                        <span className="truncate max-w-[120px]">
                          {isTransfer ? `${t.account_name} ➔ ${t.to_account_name || '?'}` : t.account_name}
                        </span>
                        {t.installment_total && t.installment_total > 1 && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenInstallmentManager(t.installment_id_group!, e)}
                            className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Gerenciar parcelas e antecipação"
                          >
                            <Zap size={10} className="text-amber-600 dark:text-amber-400" />
                            <span>{t.installment_current}/{t.installment_total}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className={`font-bold text-xs sm:text-sm ${amtClass}`}>
                      {sign} {formatBRL(t.amount)}
                    </span>
                    <div className="hidden sm:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      {t.installment_id_group && (
                        <button 
                          onClick={(e) => handleOpenInstallmentManager(t.installment_id_group!, e)} 
                          className="p-1.5 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 cursor-pointer" 
                          title="Gerenciar Parcelamento"
                        >
                          <Zap size={15} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleEditTransaction(t)} 
                        className="p-1.5 rounded-xl hover:bg-earth-200 dark:hover:bg-earth-700 text-earth-500 cursor-pointer" 
                        title="Editar"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteTransaction(t, e)} 
                        className="p-1.5 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 cursor-pointer" 
                        title="Excluir"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Floating Action Button (Mobile FAB) fixo na área de alcance do polegar */}
        <button 
          onClick={handleNewTransaction}
          className="md:hidden fixed bottom-20 right-5 z-40 p-4 bg-forest-600 hover:bg-forest-700 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-forest-600/30"
          aria-label="Nova transação"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Modal de Gestão e Antecipação de Parcelamento */}
      {isInstallmentModalOpen && selectedGroupId && (
        <InstallmentManagerModal
          isOpen={isInstallmentModalOpen}
          onClose={() => {
            setIsInstallmentModalOpen(false);
            setSelectedGroupId(null);
          }}
          groupId={selectedGroupId}
          onUpdated={loadData}
        />
      )}

      {/* Modal de Exclusão Simples */}
      <ConfirmModal
        isOpen={showSimpleDeleteConfirm}
        onClose={() => {
          setShowSimpleDeleteConfirm(false);
          setSelectedTxToDelete(null);
        }}
        onConfirm={() => executeDelete(false)}
        title="Excluir Transação"
        message={`Tem certeza de que deseja excluir a transação "${selectedTxToDelete?.description}"? Esta ação não poderá ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
        isLoading={loadingDelete}
      />

      {/* Modal de Exclusão Parcelada */}
      {showDeleteConfirm && selectedTxToDelete && (
        <Modal 
          isOpen={showDeleteConfirm} 
          onClose={() => {
            setShowDeleteConfirm(false);
            setSelectedTxToDelete(null);
          }} 
          title="Excluir Transação Parcelada"
        >
          <div className="text-center py-4 space-y-4 animate-in fade-in duration-200">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 rounded-2xl text-xs border border-amber-200 dark:border-amber-900/40 max-w-md mx-auto">
              Esta transação faz parte de uma compra parcelada (parcela {selectedTxToDelete.installment_current}/{selectedTxToDelete.installment_total}).
            </div>
            
            <h3 className="text-sm font-bold text-earth-800 dark:text-earth-100">Como você deseja prosseguir?</h3>
            
            <div className="flex flex-col gap-2 max-w-xs mx-auto pt-2">
              <button
                type="button"
                onClick={() => executeDelete(false)}
                disabled={loadingDelete}
                className="py-3 px-4 bg-earth-100 hover:bg-earth-200 dark:bg-earth-800 dark:hover:bg-earth-700 text-earth-800 dark:text-earth-200 rounded-2xl font-bold text-xs transition-colors cursor-pointer"
              >
                {loadingDelete ? 'Excluindo...' : 'Excluir apenas esta parcela'}
              </button>
              <button
                type="button"
                onClick={() => executeDelete(true)}
                disabled={loadingDelete}
                className="py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-xs transition-colors cursor-pointer shadow-md shadow-red-600/20"
              >
                {loadingDelete ? 'Excluindo...' : 'Excluir todas as parcelas'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loadingDelete}
                className="py-2.5 px-4 text-earth-500 hover:text-earth-700 dark:text-earth-400 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

