import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';
import { useFinance } from '../FinanceContext';
import { formatBRL } from '../../../utils/format';

export function SummaryCards() {
  const { summary } = useFinance();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
      {/* Receitas */}
      <div className="bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs flex items-center justify-between sm:block">
        <div>
          <span className="text-[11px] font-semibold text-forest-600 dark:text-forest-400 uppercase tracking-wider block mb-0.5">
            Receitas
          </span>
          <span className="text-lg sm:text-2xl font-bold text-forest-700 dark:text-forest-300 block">
            {formatBRL(summary.income)}
          </span>
        </div>
        <div className="w-8 h-8 rounded-xl bg-forest-100 dark:bg-forest-900/30 text-forest-600 dark:text-forest-400 flex items-center justify-center sm:hidden">
          <ArrowUpRight size={18} />
        </div>
      </div>

      {/* Despesas */}
      <div className="bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs flex items-center justify-between sm:block">
        <div>
          <span className="text-[11px] font-semibold text-red-500 uppercase tracking-wider block mb-0.5">
            Despesas
          </span>
          <span className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400 block">
            {formatBRL(summary.expense)}
          </span>
        </div>
        <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/30 text-red-500 flex items-center justify-center sm:hidden">
          <ArrowDownRight size={18} />
        </div>
      </div>

      {/* Saldo */}
      <div className="bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs flex items-center justify-between sm:block">
        <div>
          <span className="text-[11px] font-semibold text-earth-400 uppercase tracking-wider block mb-0.5">
            Saldo do Mês
          </span>
          <span className={`text-lg sm:text-2xl font-bold block ${summary.balance >= 0 ? 'text-forest-600 dark:text-forest-400' : 'text-red-500'}`}>
            {formatBRL(summary.balance)}
          </span>
        </div>
        <div className="w-8 h-8 rounded-xl bg-earth-100 dark:bg-earth-800 text-earth-600 dark:text-earth-400 flex items-center justify-center sm:hidden">
          <Wallet size={18} />
        </div>
      </div>
    </div>
  );
}
