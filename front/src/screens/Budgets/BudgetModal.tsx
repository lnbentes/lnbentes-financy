import { useState, useEffect } from 'react';
import { financeService } from '../../services/finance';
import { extractArray } from '../../utils/helpers';
import { Logger } from '../../utils/logger';
import type { Category, BudgetSummary } from '../../types/finance';
import { X, Target } from 'lucide-react';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedBudget: BudgetSummary | null;
  currentMonth: number;
  currentYear: number;
}

export function BudgetModal({
  isOpen,
  onClose,
  onSuccess,
  selectedBudget,
  currentMonth,
  currentYear,
}: BudgetModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [amountLimit, setAmountLimit] = useState('');
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!selectedBudget;

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      if (selectedBudget) {
        setCategoryId(selectedBudget.category_id);
        setAmountLimit(selectedBudget.amount_limit.toString());
        setMonth(selectedBudget.month);
        setYear(selectedBudget.year);
      } else {
        setCategoryId('');
        setAmountLimit('');
        setMonth(currentMonth);
        setYear(currentYear);
      }
      setError('');
    }
  }, [isOpen, selectedBudget, currentMonth, currentYear]);

  const loadCategories = async () => {
    try {
      const res = await financeService.categories.list();
      const list: Category[] = extractArray(res);
      // Filtra apenas categorias de despesa ou ambos
      const expenseCats = list.filter(c => c.type === 'EXPENSE' || c.type === 'BOTH');
      setCategories(expenseCats);
      if (!selectedBudget && expenseCats.length > 0) {
        setCategoryId(expenseCats[0].id);
      }
    } catch (err) {
      Logger.error('Erro ao carregar categorias para o orçamento:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const limit = parseFloat(amountLimit.replace(',', '.'));
    if (isNaN(limit) || limit <= 0) {
      setError('Por favor, informe um limite válido maior que zero.');
      setLoading(false);
      return;
    }

    try {
      if (selectedBudget) {
        await financeService.budgets.update(selectedBudget.id, {
          category: categoryId,
          amount_limit: limit,
          month: Number(month),
          year: Number(year),
        });
      } else {
        await financeService.budgets.create({
          category: categoryId,
          amount_limit: limit,
          month: Number(month),
          year: Number(year),
        });
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errObj = err as Error;
      Logger.error('Erro ao salvar meta de orçamento:', errObj);
      setError(errObj.message || 'Erro ao salvar a meta.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center border-b border-earth-100 dark:border-earth-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-forest-100 dark:bg-forest-900/30 text-forest-600 dark:text-forest-400 flex items-center justify-center">
              <Target size={18} />
            </div>
            <h3 className="font-bold text-base text-earth-900 dark:text-earth-50">
              {isEdit ? 'Editar Meta de Gastos' : 'Nova Meta de Orçamento'}
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
          <div>
            <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">
              Categoria de Despesa
            </label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              required
              disabled={isEdit}
              className="w-full px-4 py-2.5 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none text-sm text-earth-800 dark:text-earth-100 disabled:opacity-60"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">
              Limite Máximo Mensal (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amountLimit}
              onChange={e => setAmountLimit(e.target.value)}
              required
              placeholder="Ex: 800.00"
              className="w-full px-4 py-2.5 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none text-sm text-earth-800 dark:text-earth-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">
                Mês
              </label>
              <select
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
                disabled={isEdit}
                className="w-full px-3 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-xs outline-none focus:ring-2 focus:ring-forest-500 disabled:opacity-60"
              >
                {[
                  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                ].map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">
                Ano
              </label>
              <input
                type="number"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                disabled={isEdit}
                className="w-full px-3 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-xs outline-none focus:ring-2 focus:ring-forest-500 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
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
              {loading ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Criar Meta')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
