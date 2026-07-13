import { useFinance } from '../FinanceContext';
import { formatBRL } from '../../../utils/format';



export function SummaryCards() {
  const { summary } = useFinance();

  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4">
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-5 rounded-2xl">
        <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Receitas do Mês</p>
        <p className="text-xl font-bold text-green-700 dark:text-green-300">{formatBRL(summary.income)}</p>
      </div>
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-5 rounded-2xl">
        <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Despesas do Mês</p>
        <p className="text-xl font-bold text-red-700 dark:text-red-300">{formatBRL(summary.expense)}</p>
      </div>
      <div className="bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 p-5 rounded-2xl">
        <p className="text-xs text-earth-500 font-medium mb-1">Saldo do Mês</p>
        <p className={`text-xl font-bold ${summary.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
          {formatBRL(summary.balance)}
        </p>
      </div>
    </div>
  );
}
