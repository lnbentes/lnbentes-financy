import { useState, useEffect } from 'react';
import { Search, Plus, TrendingUp, TrendingDown, ArrowRightLeft, Trash2, Edit2 } from 'lucide-react';
import { useFinance } from '../FinanceContext';
import { formatBRL, formatDate } from '../../../utils/format';
import { financeService } from '../../../services/finance';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { Modal } from '../modals/Modal';

export function TransactionList() {
  const { 
    transactions, search, setSearch, txType, setTxType,
    setTransactionModalOpen, setSelectedTransaction, loadData
  } = useFinance();

  const [showFab, setShowFab] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSimpleDeleteConfirm, setShowSimpleDeleteConfirm] = useState(false);
  const [selectedTxToDelete, setSelectedTxToDelete] = useState<any>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (!mainEl) return;
    const handleScroll = () => {
      setShowFab(mainEl.scrollTop > 150);
    };
    mainEl.addEventListener('scroll', handleScroll);
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDeleteTransaction = (t: any) => {
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
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir transação');
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

  const handleEditTransaction = (t: any) => {
    setSelectedTransaction(t);
    setTransactionModalOpen(true);
  };

  return (
    <>
      <div className="lg:col-span-2 space-y-3">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h3 className="text-lg font-bold">Transações</h3>
        <button onClick={handleNewTransaction} className="flex items-center gap-1.5 text-sm bg-forest-600 hover:bg-forest-700 text-white px-3 py-1.5 rounded-xl transition-colors">
          <Plus size={16} /> Nova Transação
        </button>
      </div>

      <div className="bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-2xl p-4 space-y-3">
        <div className="flex gap-2 flex-wrap">
          <div className="flex-1 min-w-[180px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por descrição…" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-transparent text-sm focus:ring-2 focus:ring-forest-500 outline-none"
            />
          </div>
          <select 
            value={txType}
            onChange={e => setTxType(e.target.value)}
            className="px-3 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-800 text-sm focus:ring-2 focus:ring-forest-500 outline-none"
          >
            <option value="">Todos os tipos</option>
            <option value="INCOME">Receitas</option>
            <option value="EXPENSE">Despesas</option>
            <option value="TRANSFER">Transferências</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-earth-900 rounded-2xl border border-earth-200 dark:border-earth-800 overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-earth-400">Nenhuma transação neste período</div>
        ) : (
          transactions.map(t => {
            const isTransfer = t.type === 'TRANSFER';
            const sign = t.type === 'INCOME' ? '+' : (isTransfer ? '⇄' : '-');
            const amtClass = t.type === 'INCOME' ? 'text-green-600 dark:text-green-400' : isTransfer ? 'text-blue-500 dark:text-blue-400' : 'text-red-500';
            
            return (
              <div 
                key={t.id} 
                onClick={() => handleEditTransaction(t)}
                className="flex items-center justify-between p-4 border-b border-earth-100 dark:border-earth-800 last:border-0 group hover:bg-earth-50 dark:hover:bg-earth-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0" style={{ backgroundColor: isTransfer ? '#3b82f6' : (t.category_color || '#888') }}>
                    {t.type === 'INCOME' ? <TrendingUp size={20} /> : isTransfer ? <ArrowRightLeft size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-earth-800 dark:text-earth-200 truncate">{t.description}</h4>
                    <p className="text-xs text-earth-500">{formatDate(t.date)} · {isTransfer ? `${t.account_name} → ${t.to_account_name || '?'}` : (t.category_name || 'Geral')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`font-bold ${amtClass}`}>{sign} {formatBRL(t.amount)}</span>
                  <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleEditTransaction(t)} className="p-1.5 rounded-lg hover:bg-earth-200 dark:hover:bg-earth-700"><Edit2 size={16} className="text-earth-500" /></button>
                    <button onClick={() => handleDeleteTransaction(t)} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"><Trash2 size={16} className="text-red-400" /></button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FAB - Floating Action Button for mobile */}
      {showFab && (
        <button 
          onClick={handleNewTransaction}
          className="md:hidden fixed bottom-20 right-6 z-40 p-4 bg-forest-600 hover:bg-forest-700 text-white rounded-full shadow-lg hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
          aria-label="Nova transação"
        >
          <Plus size={24} />
        </button>
      )}
    </div>

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
            <div className="p-3 bg-amber-550/10 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-xl text-sm border border-amber-200/50 dark:border-amber-900/30 max-w-md mx-auto">
              Esta transação faz parte de uma compra parcelada (parcela {selectedTxToDelete.installment_current}/{selectedTxToDelete.installment_total}).
            </div>
            
            <h3 className="text-base font-bold text-earth-800 dark:text-earth-100">Como você deseja prosseguir?</h3>
            
            <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
              <button
                type="button"
                onClick={() => executeDelete(false)}
                disabled={loadingDelete}
                className="py-2.5 px-4 bg-earth-100 hover:bg-earth-200 dark:bg-earth-800 dark:hover:bg-earth-700 text-earth-700 dark:text-earth-200 rounded-xl font-bold text-sm transition-colors cursor-pointer"
              >
                {loadingDelete ? 'Excluindo...' : 'Excluir apenas esta parcela'}
              </button>
              <button
                type="button"
                onClick={() => executeDelete(true)}
                disabled={loadingDelete}
                className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer"
              >
                {loadingDelete ? 'Excluindo...' : 'Excluir todas as parcelas'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedTxToDelete(null);
                }}
                disabled={loadingDelete}
                className="py-2.5 px-4 text-earth-500 hover:text-earth-700 dark:text-earth-400 dark:hover:text-earth-300 font-semibold text-sm transition-colors cursor-pointer"
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
