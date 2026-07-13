import { useState, useEffect } from 'react';
import { useFinance } from '../FinanceContext';
import { financeService } from '../../../services/finance';
import { Modal } from './Modal';
import { Trash2, ShoppingCart, Utensils, Car, Home, Activity, GraduationCap, Shirt, Gamepad2, Plane, Smartphone, Dumbbell, PawPrint, Banknote, TrendingUp, Gift, Wifi, Tv, Tag, Wrench, CreditCard, HelpCircle } from 'lucide-react';

const CATEGORY_ICONS = [
  { value: 'cart-outline', label: 'Mercado', Icon: ShoppingCart },
  { value: 'restaurant-outline', label: 'Alimentação', Icon: Utensils },
  { value: 'car-outline', label: 'Transporte', Icon: Car },
  { value: 'home-outline', label: 'Moradia', Icon: Home },
  { value: 'medical-outline', label: 'Saúde', Icon: Activity },
  { value: 'school-outline', label: 'Educação', Icon: GraduationCap },
  { value: 'shirt-outline', label: 'Roupas', Icon: Shirt },
  { value: 'game-controller-outline', label: 'Lazer', Icon: Gamepad2 },
  { value: 'airplane-outline', label: 'Viagem', Icon: Plane },
  { value: 'phone-portrait-outline', label: 'Tecnologia', Icon: Smartphone },
  { value: 'barbell-outline', label: 'Academia', Icon: Dumbbell },
  { value: 'paw-outline', label: 'Pet', Icon: PawPrint },
  { value: 'cash-outline', label: 'Salário', Icon: Banknote },
  { value: 'trending-up-outline', label: 'Investimento', Icon: TrendingUp },
  { value: 'gift-outline', label: 'Presente', Icon: Gift },
  { value: 'wifi-outline', label: 'Internet', Icon: Wifi },
  { value: 'tv-outline', label: 'Streaming', Icon: Tv },
  { value: 'pricetag-outline', label: 'Geral', Icon: Tag },
  { value: 'build-outline', label: 'Serviços', Icon: Wrench },
  { value: 'card-outline', label: 'Financeiro', Icon: CreditCard },
];



export function CategoryModal() {
  const { isCategoryModalOpen, setCategoryModalOpen, selectedCategory, loadData } = useFinance();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#888888');
  const [icon, setIcon] = useState(CATEGORY_ICONS[CATEGORY_ICONS.length - 1].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!selectedCategory;

  useEffect(() => {
    if (isCategoryModalOpen) {
      if (selectedCategory) {
        setName(selectedCategory.name);
        setColor(selectedCategory.color || '#888888');
        setIcon(selectedCategory.icon || CATEGORY_ICONS[CATEGORY_ICONS.length - 1].value);
      } else {
        setName('');
        setColor('#888888');
        setIcon(CATEGORY_ICONS[CATEGORY_ICONS.length - 1].value);
      }
      setError('');
    }
  }, [isCategoryModalOpen, selectedCategory]);

  const handleDelete = async () => {
    if (!window.confirm('Excluir esta categoria?')) return;
    try {
      setLoading(true);
      await financeService.categories.delete(selectedCategory.id);
      await loadData();
      setCategoryModalOpen(false);
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

    const data = { name, color, icon };

    try {
      if (selectedCategory) {
        await financeService.categories.update(selectedCategory.id, data);
      } else {
        await financeService.categories.create(data);
      }
      await loadData();
      setCategoryModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar categoria');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isCategoryModalOpen} 
      onClose={() => setCategoryModalOpen(false)} 
      title={selectedCategory ? 'Editar Categoria' : 'Nova Categoria'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Nome</label>
          <input 
            type="text" 
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Cor</label>
          <input 
            type="color" 
            value={color}
            onChange={e => setColor(e.target.value)}
            className="w-full h-12 p-1 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-2">Ícone</label>
          <div className="grid grid-cols-5 gap-1.5 max-h-40 overflow-y-auto pr-1">
            {CATEGORY_ICONS.map(ic => {
              const active = icon === ic.value;
              return (
                <button 
                  key={ic.value} type="button" onClick={() => setIcon(ic.value)} title={ic.label}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-earth-600 dark:text-earth-300
                    ${active ? 'border-forest-500 bg-forest-50 dark:bg-forest-900/30' : 'border-transparent hover:border-earth-300 dark:hover:border-earth-600'}`}
                >
                  <ic.Icon size={20} />
                  <span className="text-[9px] leading-tight text-center">{ic.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 bg-earth-50 dark:bg-earth-800/50 p-4 rounded-xl">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: color }}>
            {(() => {
              const SelectedIcon = CATEGORY_ICONS.find(i => i.value === icon)?.Icon || HelpCircle;
              return <SelectedIcon size={20} />;
            })()}
          </div>
          <span className="font-semibold text-earth-700 dark:text-earth-300">{name || 'Nome da categoria'}</span>
        </div>

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
            type="button" 
            onClick={() => setCategoryModalOpen(false)}
            className="flex-1 py-3 bg-earth-100 dark:bg-earth-800 text-earth-700 dark:text-earth-300 rounded-xl font-bold hover:bg-earth-200 dark:hover:bg-earth-700 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="flex-1 py-3 bg-forest-600 text-white rounded-xl font-bold hover:bg-forest-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Criar Categoria')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
