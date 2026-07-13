import { useState, useEffect } from 'react';
import { useFinance } from '../FinanceContext';
import { financeService } from '../../../services/finance';
import { Modal } from './Modal';
import { Trash2 } from 'lucide-react';

export function TransactionModal() {
  const { 
    isTransactionModalOpen, setTransactionModalOpen, 
    selectedTransaction, loadData,
    accounts, categories 
  } = useFinance();
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [method, setMethod] = useState('DEBIT');
  const [date, setDate] = useState('');
  const [account, setAccount] = useState('');
  const [category, setCategory] = useState('');
  const [toAccount, setToAccount] = useState('');
  
  const [isInstallment, setIsInstallment] = useState(false);
  const [installments, setInstallments] = useState('2');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!selectedTransaction;
  const isTransfer = type === 'TRANSFER';

  useEffect(() => {
    if (isTransactionModalOpen) {
      if (selectedTransaction) {
        setDescription(selectedTransaction.description || '');
        setAmount(selectedTransaction.amount?.toString() || '');
        setType(selectedTransaction.type || 'EXPENSE');
        setMethod(selectedTransaction.method || 'DEBIT');
        setDate(selectedTransaction.date || new Date().toISOString().split('T')[0]);
        setAccount(selectedTransaction.account?.toString() || '');
        setCategory(selectedTransaction.category?.toString() || '');
        setToAccount(selectedTransaction.to_account?.toString() || '');
        setIsInstallment(selectedTransaction.installment_total > 1);
        setInstallments(selectedTransaction.installment_total?.toString() || '2');
      } else {
        setDescription('');
        setAmount('');
        setType('EXPENSE');
        setMethod('DEBIT');
        setDate(new Date().toISOString().split('T')[0]);
        setAccount(accounts.length > 0 ? accounts[0].id.toString() : '');
        setCategory('');
        setToAccount('');
        setIsInstallment(false);
        setInstallments('2');
      }
      setError('');
    }
  }, [isTransactionModalOpen, selectedTransaction, accounts]);

  const handleDelete = async () => {
    if (!window.confirm('Excluir esta transação?')) return;
    try {
      setLoading(true);
      await financeService.transactions.delete(selectedTransaction.id);
      await loadData();
      setTransactionModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const data: any = {
      description,
      amount: parseFloat(amount.replace(',', '.')),
      type,
      date,
      account: parseInt(account) || null,
    };

    if (isTransfer) {
      data.installments = 1;
      data.to_account = parseInt(toAccount) || null;
      if (!data.to_account) {
        setError('Selecione a conta destino para a transferência.');
        setLoading(false);
        return;
      }
      if (data.account === data.to_account) {
        setError('A conta de origem e destino não podem ser iguais.');
        setLoading(false);
        return;
      }
    } else {
      data.method = method;
      data.category = parseInt(category) || null;
      if (!isEdit && isInstallment) {
        data.installments = parseInt(installments) || 1;
      } else {
        data.installments = 1;
      }
    }

    try {
      if (isEdit) {
        await financeService.transactions.update(selectedTransaction.id, data);
      } else {
        await financeService.transactions.create(data);
      }
      await loadData();
      setTransactionModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar transação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isTransactionModalOpen} 
      onClose={() => setTransactionModalOpen(false)} 
      title={isEdit ? 'Editar Transação' : 'Nova Transação'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Descrição *</label>
          <input 
            type="text" value={description} onChange={e => setDescription(e.target.value)} required
            className="w-full px-4 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none"
            placeholder="Ex: Mercado, Salário..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Valor (R$) *</label>
            <input 
              type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} required
              className="w-full px-4 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none"
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Tipo *</label>
            <select 
              value={type} onChange={e => setType(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none"
            >
              <option value="EXPENSE">Despesa</option>
              <option value="INCOME">Receita</option>
              <option value="TRANSFER">Transferência</option>
            </select>
          </div>
        </div>

        {!isTransfer && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Método</label>
              <select 
                value={method} onChange={e => setMethod(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none"
              >
                <option value="DEBIT">Débito</option>
                <option value="CREDIT">Crédito</option>
                <option value="CASH">Dinheiro</option>
                <option value="PIX">Pix</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Data *</label>
              <input 
                type="date" value={date} onChange={e => setDate(e.target.value)} required
                className="w-full px-4 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none"
              />
            </div>
          </div>
        )}

        {isTransfer && (
          <div>
            <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Data *</label>
            <input 
              type="date" value={date} onChange={e => setDate(e.target.value)} required
              className="w-full px-4 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none"
            />
          </div>
        )}

        {(!isEdit && !isTransfer) && (
          <div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" checked={isInstallment} onChange={e => setIsInstallment(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
              />
              <span className="text-sm font-medium text-earth-700 dark:text-earth-300">Parcelado</span>
            </label>
            {isInstallment && (
              <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <label className="block text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">Número de parcelas</label>
                <input 
                  type="number" min="2" max="60" value={installments} onChange={e => setInstallments(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-amber-200 dark:border-amber-700 bg-white dark:bg-earth-800 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">{isTransfer ? 'Conta origem' : 'Conta'}</label>
            <select 
              value={account} onChange={e => setAccount(e.target.value)} required
              className="w-full px-4 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none"
            >
              <option value="">Selecione...</option>
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
          </div>
          {!isTransfer && (
            <div>
              <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Categoria</label>
              <select 
                value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none"
              >
                <option value="">Sem categoria</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {isTransfer && (
          <div>
            <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Conta destino *</label>
            <select 
              value={toAccount} onChange={e => setToAccount(e.target.value)} required
              className="w-full px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-700 bg-earth-50 dark:bg-earth-800 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Selecione a conta destino</option>
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
          </div>
        )}

        {(isEdit && isInstallment) && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300">
            Esta é a parcela <strong>{selectedTransaction.installment_current}/{selectedTransaction.installment_total}</strong>. Apenas ela será alterada.
          </div>
        )}

        <div className="flex gap-3 pt-4">
          {isEdit && (
            <button 
              type="button" onClick={handleDelete}
              className="px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button 
            type="button" onClick={() => setTransactionModalOpen(false)}
            className="flex-1 py-3 bg-earth-100 dark:bg-earth-800 text-earth-700 dark:text-earth-300 rounded-xl font-bold hover:bg-earth-200 dark:hover:bg-earth-700 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" disabled={loading}
            className="flex-1 py-3 bg-forest-600 text-white rounded-xl font-bold hover:bg-forest-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
