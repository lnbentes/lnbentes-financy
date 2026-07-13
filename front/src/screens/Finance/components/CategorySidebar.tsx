import { ShoppingCart, Utensils, Car, Home, Activity, GraduationCap, Shirt, Gamepad2, Plane, Smartphone, Dumbbell, PawPrint, Banknote, TrendingUp, Gift, Wifi, Tv, Tag, Wrench, CreditCard } from 'lucide-react';
import { useMemo } from 'react';
import { useFinance } from '../FinanceContext';
import { formatBRL } from '../../../utils/format';

const CATEGORY_ICONS_MAP: Record<string, any> = {
  'cart-outline': ShoppingCart,
  'restaurant-outline': Utensils,
  'car-outline': Car,
  'home-outline': Home,
  'medical-outline': Activity,
  'school-outline': GraduationCap,
  'shirt-outline': Shirt,
  'game-controller-outline': Gamepad2,
  'airplane-outline': Plane,
  'phone-portrait-outline': Smartphone,
  'barbell-outline': Dumbbell,
  'paw-outline': PawPrint,
  'cash-outline': Banknote,
  'trending-up-outline': TrendingUp,
  'gift-outline': Gift,
  'wifi-outline': Wifi,
  'tv-outline': Tv,
  'pricetag-outline': Tag,
  'build-outline': Wrench,
  'card-outline': CreditCard,
};



export function CategorySidebar() {
  const { 
    summary, categories,
    setCategoryModalOpen, setSelectedCategory 
  } = useFinance();

  const breakdown = useMemo(() => (summary.category_breakdown || []).slice(0, 6), [summary]);
  const maxBreakdownVal = breakdown.length ? breakdown[0].total : 1;

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
            {breakdown.map((cat: any) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex justify-between text-xs text-earth-600 dark:text-earth-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: cat.color }}></span>
                    {cat.name}
                  </span>
                  <span className="font-semibold">{formatBRL(cat.total)}</span>
                </div>
                <div className="w-full h-1.5 bg-earth-100 dark:bg-earth-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${((cat.total / maxBreakdownVal) * 100).toFixed(0)}%`, background: cat.color }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-earth-400 text-sm">Sem despesas no período.</p>
        )}
      </div>

      <div className="bg-white dark:bg-earth-900 p-5 rounded-2xl border border-earth-200 dark:border-earth-800">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-bold">Categorias</h3>
          <button onClick={handleNewCategory} className="text-xs bg-earth-100 dark:bg-earth-800 hover:bg-earth-200 dark:hover:bg-earth-700 px-2.5 py-1.5 rounded-lg transition-colors">
            + Nova
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => {
            const Icon = CATEGORY_ICONS_MAP[c.icon] || Tag;
            return (
              <div 
                key={c.id} 
                onClick={() => {
                  setSelectedCategory(c);
                  setCategoryModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-white cursor-pointer hover:opacity-80 transition-opacity shadow-sm" 
                style={{ background: c.color }}
              >
                <Icon size={14} />
                <span>{c.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
