import { Search, Plus, TrendingUp, TrendingDown, ArrowRightLeft, Trash2, Edit2 } from 'lucide-react';
import { useFinance } from '../FinanceContext';
import { formatBRL, formatDate } from '../../../utils/format';
import { financeService } from '../../../services/finance';

export function TransactionList() {
  const { 
    transactions, search, setSearch, txType, setTxType,
    setTransactionModalOpen, setSelectedTransaction, loadData
  } = useFinance();

  const handleDeleteTransaction = async (id: number) => {
    if (!window.confirm('Excluir esta transação?')) return;
    try {
      await financeService.transactions.delete(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir transação');
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
              <div key={t.id} className="flex items-center justify-between p-4 border-b border-earth-100 dark:border-earth-800 last:border-0 group hover:bg-earth-50 dark:hover:bg-earth-800/50 transition-colors">
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
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditTransaction(t)} className="p-1.5 rounded-lg hover:bg-earth-200 dark:hover:bg-earth-700"><Edit2 size={16} className="text-earth-500" /></button>
                    <button onClick={() => handleDeleteTransaction(t.id)} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"><Trash2 size={16} className="text-red-400" /></button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
