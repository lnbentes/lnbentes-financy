import { useState, useEffect } from 'react';
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ChevronLeft, 
  ChevronRight 
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
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0, category_breakdown: [] as any[] });
  const [monthSummaries, setMonthSummaries] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [year, month]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load accounts for header cards
      const accountsRes = await financeService.accounts.list();
      const accounts = extractArray(accountsRes);
      
      setTotalBalance(accounts.reduce((s: number, a: any) => s + parseFloat(a.balance || 0), 0));

      // Load 5 months summaries
      const offsets = [-2, -1, 0, 1, 2];
      const monthsToFetch = offsets.map(o => getOffsetMonth(year, month, o));
      
      const summaries = await Promise.all(
        monthsToFetch.map(({ year: y, month: m }) => financeService.transactions.summary({ year: y, month: m }))
      );

      const formattedSummaries = summaries.map((s, i) => ({
        ...(s.data || s),
        label: MONTHS_PT[monthsToFetch[i].month - 1],
      }));

      setMonthSummaries(formattedSummaries);
      setSummary(formattedSummaries[2] || { income: 0, expense: 0, balance: 0, category_breakdown: [] });
    } catch (error) {
      console.error('Error loading dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  const isCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth() + 1;

  const barChartData = {
    labels: monthSummaries.map(s => s.label),
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

  return (
    <div className="space-y-6">
      {/* Header and Month Navigation */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold text-forest-900 dark:text-forest-100">
            Bem-vindo, {user?.first_name || user?.username}
          </h2>
          <p className="text-earth-600 dark:text-earth-400">Aqui está o que acontece na sua eco-casa.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button 
            onClick={() => { const d = getOffsetMonth(year, month, -1); setYear(d.year); setMonth(d.month); }}
            className="p-2 rounded-xl border border-earth-200 dark:border-earth-700 hover:bg-earth-100 dark:hover:bg-earth-800 text-earth-600 dark:text-earth-400 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => { setYear(new Date().getFullYear()); setMonth(new Date().getMonth() + 1); }}
            className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
              isCurrentMonth 
                ? 'bg-forest-600 text-white border-forest-600' 
                : 'border-earth-200 dark:border-earth-700 text-earth-600 dark:text-earth-400 hover:bg-earth-100 dark:hover:bg-earth-800'
            }`}
          >
            {MONTHS_FULL[month - 1]} {year}
          </button>
          <button 
            onClick={() => { const d = getOffsetMonth(year, month, 1); setYear(d.year); setMonth(d.month); }}
            className="p-2 rounded-xl border border-earth-200 dark:border-earth-700 hover:bg-earth-100 dark:hover:bg-earth-800 text-earth-600 dark:text-earth-400 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-white dark:bg-earth-900 p-5 rounded-2xl shadow-sm border border-earth-200 dark:border-earth-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-earth-500">Saldo Total</p>
              <h3 className={`text-2xl font-bold mt-1 ${totalBalance >= 0 ? 'text-forest-600' : 'text-red-600'}`}>
                {loading ? '...' : formatBRL(totalBalance)}
              </h3>
            </div>
            <div className="p-2 bg-forest-100 text-forest-600 rounded-lg">
              <Building2 size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-earth-900 p-5 rounded-2xl shadow-sm border border-earth-200 dark:border-earth-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-earth-500">Renda (Mês)</p>
              <h3 className="text-2xl font-bold text-green-600 mt-1">{loading ? '...' : formatBRL(summary.income)}</h3>
            </div>
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-earth-900 p-5 rounded-2xl shadow-sm border border-earth-200 dark:border-earth-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-earth-500">Gastos (Mês)</p>
              <h3 className="text-2xl font-bold text-red-600 mt-1">{loading ? '...' : formatBRL(summary.expense)}</h3>
            </div>
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <TrendingDown size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-earth-900 p-5 rounded-2xl shadow-sm border border-earth-200 dark:border-earth-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-earth-500">Saldo (Mês)</p>
              <h3 className={`text-2xl font-bold mt-1 ${summary.balance >= 0 ? 'text-forest-600' : 'text-red-600'}`}>
                {loading ? '...' : formatBRL(summary.balance)}
              </h3>
            </div>
            <div className="p-2 bg-forest-100 text-forest-600 rounded-lg">
              <Wallet size={24} />
            </div>
          </div>
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
    </div>
  );
}
