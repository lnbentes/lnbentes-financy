import { useState, useEffect } from 'react';
import { financeService } from '../../services/finance';
import { extractArray } from '../../utils/helpers';
import { Logger } from '../../utils/logger';
import type { Account, Category, RecurringTransaction, TransactionType, PaymentMethod, RecurringFrequency } from '../../types/finance';
import { X, Repeat } from 'lucide-react';

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedRecurring: RecurringTransaction | null;
}

export function RecurringModal({
  isOpen,
  onClose,
  onSuccess,
  selectedRecurring,
}: RecurringModalProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [method, setMethod] = useState<PaymentMethod>('DEBIT');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('MONTHLY');
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!selectedRecurring;

  useEffect(() => {
    if (isOpen) {
      loadDependencies();
      if (selectedRecurring) {
        setDescription(selectedRecurring.description);
        setAmount(selectedRecurring.amount.toString());
        setType(selectedRecurring.type);
        setMethod(selectedRecurring.method);
        setAccountId(selectedRecurring.account);
        setCategoryId(selectedRecurring.category || '');
        setFrequency(selectedRecurring.frequency);
        setDayOfMonth(selectedRecurring.day_of_month);
        setIsActive(selectedRecurring.is_active);
      } else {
        setDescription('');
        setAmount('');
        setType('EXPENSE');
        setMethod('DEBIT');
        setCategoryId('');
        setFrequency('MONTHLY');
        setDayOfMonth(1);
        setIsActive(true);
      }
      setError('');
    }
  }, [isOpen, selectedRecurring]);

  const loadDependencies = async () => {
    try {
      const [accRes, catRes] = await Promise.all([
        financeService.accounts.list(),
        financeService.categories.list(),
      ]);
      const accList: Account[] = extractArray(accRes);
      const catList: Category[] = extractArray(catRes);

      setAccounts(accList);
      setCategories(catList);

      if (!selectedRecurring && accList.length > 0) {
        setAccountId(accList[0].id);
      }
    } catch (err) {
      Logger.error('Erro ao carregar dados auxiliares:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Informe um valor válido maior que zero.');
      setLoading(false);
      return;
    }

    const payload: Partial<RecurringTransaction> = {
      description,
      amount: parsedAmount,
      type,
      method,
      account: accountId,
      category: categoryId || null,
      frequency,
      day_of_month: Number(dayOfMonth),
      is_active: isActive,
    };

    try {
      if (selectedRecurring) {
        await financeService.recurring.update(selectedRecurring.id, payload);
      } else {
        await financeService.recurring.create(payload);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errObj = err as Error;
      Logger.error('Erro ao salvar transação recorrente:', errObj);
      setError(errObj.message || 'Erro ao salvar a assinatura.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-earth-100 dark:border-earth-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Repeat size={18} />
            </div>
            <h3 className="font-bold text-base text-earth-900 dark:text-earth-50">
              {isEdit ? 'Editar Assinatura / Recorrência' : 'Nova Transação Recorrente'}
            </h3>
          </div>
          <button onClick={onClose} className="text-earth-400 hover:text-earth-600 dark:hover:text-earth-200 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 rounded-xl text-xs border border-red-200 dark:border-red-900/50">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Transação */}
          <div className="grid grid-cols-2 gap-2 bg-earth-100 dark:bg-earth-800 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                type === 'EXPENSE'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-earth-600 dark:text-earth-400 hover:text-earth-900'
              }`}
            >
              Despesa Fixa
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                type === 'INCOME'
                  ? 'bg-forest-600 text-white shadow-sm'
                  : 'text-earth-600 dark:text-earth-400 hover:text-earth-900'
              }`}
            >
              Receita Recorrente
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">
              Descrição *
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Netflix, Aluguel, Salário, Internet..."
              className="w-full px-4 py-2.5 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-sm outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-sm outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">
                Dia do Vencimento (1-31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={dayOfMonth}
                onChange={e => setDayOfMonth(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-sm outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">
                Conta de Débito/Crédito *
              </label>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-xs outline-none focus:ring-2 focus:ring-forest-500"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">
                Categoria
              </label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-xs outline-none focus:ring-2 focus:ring-forest-500"
              >
                <option value="">Sem Categoria</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">
                Método de Pagamento
              </label>
              <select
                value={method}
                onChange={e => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2.5 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-xs outline-none focus:ring-2 focus:ring-forest-500"
              >
                <option value="DEBIT">Débito em Conta</option>
                <option value="CREDIT">Cartão de Crédito</option>
                <option value="PIX">Pix / Débito Automático</option>
                <option value="BOLETO">Boleto Bancário</option>
                <option value="CASH">Dinheiro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">
                Frequência
              </label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value as RecurringFrequency)}
                className="w-full px-3 py-2.5 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-xs outline-none focus:ring-2 focus:ring-forest-500"
              >
                <option value="MONTHLY">Mensal</option>
                <option value="WEEKLY">Semanal</option>
                <option value="YEARLY">Anual</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded accent-forest-600 cursor-pointer"
              />
              <span className="text-xs font-semibold text-earth-700 dark:text-earth-300">
                Recorrência Ativa (gerar lançamentos automáticos)
              </span>
            </label>
          </div>

          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-earth-100 dark:bg-earth-800 hover:bg-earth-200 dark:hover:bg-earth-700 text-earth-700 dark:text-earth-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-forest-600 hover:bg-forest-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-forest-600/20"
            >
              {loading ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Criar Recorrência')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
