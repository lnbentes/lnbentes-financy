import { useMemo } from 'react';
import { Tag } from 'lucide-react';
import { useFinance } from '../FinanceContext';
import { formatBRL } from '../../../utils/format';
import { getIconComponent } from '../../../utils/icons';
import type { CategoryBreakdown } from '../../../types/finance';

export function CategorySidebar() {
  const { 
    summary, categories,
    setCategoryModalOpen, setSelectedCategory 
  } = useFinance();

  const breakdown: CategoryBreakdown[] = useMemo(() => (summary.category_breakdown || []).slice(0, 6), [summary]);
  const maxBreakdownVal = breakdown.length ? Math.max(...breakdown.map(b => b.total), 1) : 1;

  const handleNewCategory = () => {
    setSelectedCategory(null);
    setCategoryModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-earth-900 p-5 rounded-2xl border border-earth-200 dark:border-earth-800">
        <h3 className="text-base font-bold mb-4">Gastos por Categoria</h3>
        {breakdown.length > 0 ? (
          <div className="space-y-3">
            {breakdown.map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex justify-between text-xs text-earth-600 dark:text-earth-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: cat.color }}></span>
                    {cat.name}
                  </span>
                  <span className="font-semibold">{formatBRL(cat.total)}</span>
                </div>
                <div className="w-full bg-earth-100 dark:bg-earth-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(cat.total / maxBreakdownVal) * 100}%`,
                      background: cat.color 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-earth-400">Nenhuma despesa registrada este mês.</p>
        )}
      </div>

      <div className="bg-white dark:bg-earth-900 p-5 rounded-2xl border border-earth-200 dark:border-earth-800">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-bold">Minhas Categorias</h3>
          <button 
            onClick={handleNewCategory}
            className="text-xs text-forest-600 dark:text-forest-400 font-bold hover:underline cursor-pointer"
          >
            + Nova
          </button>
        </div>
        
        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
          {categories.map((c) => {
            const Icon = getIconComponent(c.icon, Tag);
            return (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCategory(c);
                  setCategoryModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-earth-200 dark:border-earth-800 hover:border-earth-300 dark:hover:border-earth-700 bg-earth-50 dark:bg-earth-800/40 text-earth-700 dark:text-earth-300 transition-all cursor-pointer"
              >
                <div 
                  className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px]"
                  style={{ background: c.color }}
                >
                  <Icon size={10} />
                </div>
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
