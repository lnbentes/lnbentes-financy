import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { FinanceProvider, useFinance } from './FinanceContext';
import { SummaryCards } from './components/SummaryCards';
import { AccountsList } from './components/AccountsList';
import { TransactionList } from './components/TransactionList';
import { CategorySidebar } from './components/CategorySidebar';

import { AccountModal } from './modals/AccountModal';
import { CategoryModal } from './modals/CategoryModal';
import { TransactionModal } from './modals/TransactionModal';
import { DataModal } from './modals/DataModal';

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

function FinanceContent() {
  const { month, setMonth, year, setYear, loading } = useFinance();

  const handlePrevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else { setMonth(month - 1); }
  };

  const handleNextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else { setMonth(month + 1); }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="sticky top-12 md:top-14 z-30 flex flex-wrap items-center gap-2 md:gap-3 bg-white dark:bg-earth-900 p-3 md:p-4 rounded-2xl border border-earth-200 dark:border-earth-800 shadow-sm transition-shadow">
        <button 
          onClick={() => { setMonth(new Date().getMonth() + 1); setYear(new Date().getFullYear()); }}
          className="p-2 rounded-xl text-earth-400 hover:text-forest-600 hover:bg-forest-50 dark:hover:bg-forest-900/20 transition-colors"
          title="Mês Atual"
        >
          <CalendarIcon size={20} />
        </button>

        <div className="flex items-center gap-1">
          <button onClick={handlePrevMonth} className="p-1.5 rounded-lg text-earth-400 hover:text-earth-700 dark:hover:text-earth-200 hover:bg-earth-100 dark:hover:bg-earth-800 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={handleNextMonth} className="p-1.5 rounded-lg text-earth-400 hover:text-earth-700 dark:hover:text-earth-200 hover:bg-earth-100 dark:hover:bg-earth-800 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        <select 
          value={month} 
          onChange={e => setMonth(Number(e.target.value))}
          className="px-3 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-800 text-sm font-medium focus:ring-2 focus:ring-forest-500 outline-none"
        >
          {MONTHS_PT.map((name, i) => (
            <option key={i} value={i + 1}>{name}</option>
          ))}
        </select>

        <select 
          value={year} 
          onChange={e => setYear(Number(e.target.value))}
          className="px-3 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-800 text-sm font-medium focus:ring-2 focus:ring-forest-500 outline-none"
        >
          {YEARS.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        
        {loading && <div className="ml-2 w-4 h-4 rounded-full border-2 border-forest-600 border-t-transparent animate-spin"></div>}
      </div>

      <SummaryCards />
      <AccountsList />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TransactionList />
        <CategorySidebar />
      </div>

      <AccountModal />
      <CategoryModal />
      <TransactionModal />
      <DataModal />
    </div>
  );
}

export function Finance() {
  return (
    <FinanceProvider>
      <FinanceContent />
    </FinanceProvider>
  );
}
