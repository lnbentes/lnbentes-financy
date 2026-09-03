import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ChevronLeft, 
  ChevronRight,
  Target,
  Repeat,
  ArrowRight
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import { financeService } from '../services/finance';
import { formatBRL } from '../utils/format';
import { extractArray, getOffsetMonth } from '../utils/helpers';
import { Logger } from '../utils/logger';
import { InstallmentGanttChart } from '../components/dashboard/InstallmentGanttChart';
import type { Account, MonthlySummary, BudgetSummary, RecurringTransaction } from '../types/finance';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement
);

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MONTHS_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export function Dashboard() {
  const { user } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  
  const [totalBalance, setTotalBalance] = useState(0);
  const [summary, setSummary] = useState<MonthlySummary>({ income: 0, expense: 0, balance: 0, category_breakdown: [] });
  const [monthSummaries, setMonthSummaries] = useState<MonthlySummary[]>([]);
  const [budgets, setBudgets] = useState<BudgetSummary[]>([]);
  const [recurrings, setRecurrings] = useState<RecurringTransaction[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Load accounts for total balance
      const accountsRes = await financeService.accounts.list();
      const accounts: Account[] = extractArray(accountsRes);
      setTotalBalance(accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0));

      // 2. Load 5 months summaries
      const offsets = [-2, -1, 0, 1, 2];
      const monthsToFetch = offsets.map(o => getOffsetMonth(year, month, o));
      
      const summaries = await Promise.all(
        monthsToFetch.map(({ year: y, month: m }) => financeService.transactions.summary({ year: y, month: m }))
      );

      const formattedSummaries: MonthlySummary[] = summaries.map((s, i) => ({
        ...s,
        label: MONTHS_PT[monthsToFetch[i].month - 1],
      }));

      setMonthSummaries(formattedSummaries);
      setSummary(formattedSummaries[2] || { income: 0, expense: 0, balance: 0, category_breakdown: [] });

      // 3. Load Budgets & Recurring for widgets
      const [budgetsRes, recRes] = await Promise.all([
        financeService.budgets.summary({ month, year }),
        financeService.recurring.list(),
      ]);
      setBudgets(extractArray(budgetsRes));
      setRecurrings(extractArray(recRes));
    } catch (error: unknown) {
      Logger.error('Erro ao carregar dados do dashboard', error);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth() + 1;

  const barChartData = {
    labels: monthSummaries.map(s => s.label || ''),
    datasets: [
      {
        label: 'Receitas',
        data: monthSummaries.map(s => s.income),
        backgroundColor: '#22c55e',
        borderRadius: 8,
      },
      {
        label: 'Despesas',
        data: monthSummaries.map(s => s.expense),
        backgroundColor: '#ef4444',
        borderRadius: 8,
      },
    ],
  };

  const breakdown = summary.category_breakdown || [];
  const doughnutData = {
    labels: breakdown.map(b => b.name),
    datasets: [{
      data: breakdown.map(b => b.total),
      backgroundColor: breakdown.map(b => b.color || '#888888'),
      borderWidth: 0,
    }],
  };

  const activeRecurrings = recurrings.filter(r => r.is_active);
  const totalRecurringExpense = activeRecurrings
    .filter(r => r.type === 'EXPENSE')
    .reduce((acc, r) => acc + Number(r.amount), 0);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header and Month Navigation */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold text-forest-900 dark:text-forest-100 font-serif">
            Bem-vindo, {user?.first_name || user?.username}
          </h2>
          <p className="text-earth-600 dark:text-earth-400">Aqui está o seu painel de controle financeiro.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button 
            onClick={() => { const d = getOffsetMonth(year, month, -1); setYear(d.year); setMonth(d.month); }}
            className="p-2 rounded-xl border border-earth-200 dark:border-earth-700 hover:bg-earth-100 dark:hover:bg-earth-800 text-earth-600 dark:text-earth-400 transition-colors cursor-pointer"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => { setYear(new Date().getFullYear()); setMonth(new Date().getMonth() + 1); }}
            className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${
              isCurrentMonth 
                ? 'bg-forest-600 text-white border-forest-600' 
                : 'border-earth-200 dark:border-earth-700 text-earth-600 dark:text-earth-400 hover:bg-earth-100 dark:hover:bg-earth-800'
            }`}
          >
            {MONTHS_FULL[month - 1]} {year}
          </button>
          <button 
            onClick={() => { const d = getOffsetMonth(year, month, 1); setYear(d.year); setMonth(d.month); }}
            className="p-2 rounded-xl border border-earth-200 dark:border-earth-700 hover:bg-earth-100 dark:hover:bg-earth-800 text-earth-600 dark:text-earth-400 transition-colors cursor-pointer"
            aria-label="Próximo mês"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-earth-900 p-3 sm:p-5 rounded-2xl shadow-sm border border-earth-200 dark:border-earth-800">
          <div className="flex justify-between items-start gap-2 min-w-0">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-earth-500 truncate">Saldo Total</p>
              <h3 className={`text-xl sm:text-2xl font-bold mt-1 truncate ${totalBalance >= 0 ? 'text-forest-600' : 'text-red-600'}`}>
                {loading ? '...' : formatBRL(totalBalance)}
              </h3>
            </div>
            <div className="p-2 bg-forest-100 text-forest-600 rounded-lg shrink-0">
              <Building2 size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-earth-900 p-3 sm:p-5 rounded-2xl shadow-sm border border-earth-200 dark:border-earth-800">
          <div className="flex justify-between items-start gap-2 min-w-0">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-earth-500 truncate">Renda (Mês)</p>
              <h3 className="text-xl sm:text-2xl font-bold text-green-600 mt-1 truncate">{loading ? '...' : formatBRL(summary.income)}</h3>
            </div>
            <div className="p-2 bg-green-100 text-green-600 rounded-lg shrink-0">
              <TrendingUp size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-earth-900 p-3 sm:p-5 rounded-2xl shadow-sm border border-earth-200 dark:border-earth-800">
          <div className="flex justify-between items-start gap-2 min-w-0">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-earth-500 truncate">Gastos (Mês)</p>
              <h3 className="text-xl sm:text-2xl font-bold text-red-600 mt-1 truncate">{loading ? '...' : formatBRL(summary.expense)}</h3>
            </div>
            <div className="p-2 bg-red-100 text-red-600 rounded-lg shrink-0">
              <TrendingDown size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-earth-900 p-3 sm:p-5 rounded-2xl shadow-sm border border-earth-200 dark:border-earth-800">
          <div className="flex justify-between items-start gap-2 min-w-0">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-earth-500 truncate">Saldo (Mês)</p>
              <h3 className={`text-xl sm:text-2xl font-bold mt-1 truncate ${summary.balance >= 0 ? 'text-forest-600' : 'text-red-600'}`}>
                {loading ? '...' : formatBRL(summary.balance)}
              </h3>
            </div>
            <div className="p-2 bg-forest-100 text-forest-600 rounded-lg shrink-0">
              <Wallet size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Widgets: Metas & Recorrências */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget Metas */}
        <div className="bg-white dark:bg-earth-900 p-5 rounded-3xl shadow-sm border border-earth-200 dark:border-earth-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-forest-100 dark:bg-forest-900/30 text-forest-600 dark:text-forest-400 flex items-center justify-center">
                <Target size={18} />
              </div>
              <h3 className="font-bold text-base text-earth-900 dark:text-earth-100">
                Metas do Mês
              </h3>
            </div>
            <Link to="/budgets" className="text-xs font-semibold text-forest-600 dark:text-forest-400 hover:underline flex items-center gap-1">
              Ver todas <ArrowRight size={14} />
            </Link>
          </div>

          {budgets.length === 0 ? (
            <div className="p-6 text-center text-xs text-earth-400">
              Nenhuma meta cadastrada para este mês.{' '}
              <Link to="/budgets" className="text-forest-600 font-bold hover:underline">Criar meta</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {budgets.slice(0, 3).map(b => (
                <div key={b.id} className="p-3 rounded-xl bg-earth-50/60 dark:bg-earth-800/40 border border-earth-100 dark:border-earth-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-earth-800 dark:text-earth-200">{b.category_name}</span>
                    <span className={b.status === 'EXCEEDED' ? 'text-red-500' : b.status === 'WARNING' ? 'text-amber-500' : 'text-forest-600'}>
                      {formatBRL(b.spent_amount)} / {formatBRL(b.amount_limit)}
                    </span>
                  </div>
                  <div className="w-full bg-earth-200 dark:bg-earth-700 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${b.status === 'EXCEEDED' ? 'bg-red-500' : b.status === 'WARNING' ? 'bg-amber-500' : 'bg-forest-500'}`}
                      style={{ width: `${Math.min(b.percentage_spent, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Widget Recorrências */}
        <div className="bg-white dark:bg-earth-900 p-5 rounded-3xl shadow-sm border border-earth-200 dark:border-earth-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Repeat size={18} />
              </div>
              <div>
                <h3 className="font-bold text-base text-earth-900 dark:text-earth-100">
                  Despesas Fixas & Assinaturas
                </h3>
                <span className="text-[11px] text-earth-400">Previsto no mês: {formatBRL(totalRecurringExpense)}</span>
              </div>
            </div>
            <Link to="/recurring" className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1">
              Gerenciar <ArrowRight size={14} />
            </Link>
          </div>

          {activeRecurrings.length === 0 ? (
            <div className="p-6 text-center text-xs text-earth-400">
              Nenhuma assinatura ou despesa fixa ativa.{' '}
              <Link to="/recurring" className="text-purple-600 font-bold hover:underline">Cadastrar</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {activeRecurrings.slice(0, 3).map(rec => (
                <div key={rec.id} className="flex items-center justify-between p-3 rounded-xl bg-earth-50/60 dark:bg-earth-800/40 border border-earth-100 dark:border-earth-800 text-xs">
                  <div>
                    <div className="font-bold text-earth-900 dark:text-earth-100">{rec.description}</div>
                    <div className="text-[11px] text-earth-500">
                      {rec.frequency === 'YEARLY' && rec.month_of_year
                        ? `Vencimento todo dia ${rec.day_of_month} de ${MONTHS_PT[rec.month_of_year - 1]}`
                        : `Vencimento todo dia ${rec.day_of_month}`}
                    </div>
                  </div>
                  <strong className={rec.type === 'INCOME' ? 'text-forest-600' : 'text-red-500'}>
                    {formatBRL(rec.amount)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-earth-900 p-4 md:p-6 rounded-2xl shadow-sm border border-earth-200 dark:border-earth-800 h-64 md:h-80">
          <h3 className="text-base md:text-lg font-semibold text-earth-800 dark:text-earth-100 mb-3 md:mb-4">
            Fluxo de Caixa
          </h3>
          <div className="h-48 md:h-64">
            {!loading && <Bar data={barChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />}
          </div>
        </div>
        <div className="bg-white dark:bg-earth-900 p-4 md:p-6 rounded-2xl shadow-sm border border-earth-200 dark:border-earth-800 h-64 md:h-80 flex flex-col">
          <h3 className="text-base md:text-lg font-semibold text-earth-800 dark:text-earth-100 mb-3 md:mb-4">
            Despesas por Categoria
          </h3>
          <div className="flex-1 min-h-0 relative">
            {!loading && breakdown.length > 0 ? (
              <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} />
            ) : !loading ? (
              <div className="absolute inset-0 flex items-center justify-center text-earth-400 text-sm">
                Sem despesas neste mês.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Gráfico de Gantt de Compras Parceladas */}
      <InstallmentGanttChart />
    </div>
  );
}
