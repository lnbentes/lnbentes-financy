import { useState, useEffect } from 'react';
import { useFinance } from '../FinanceContext';
import { financeService } from '../../../services/finance';
import { Modal } from './Modal';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { Trash2, Search, HelpCircle } from 'lucide-react';
import { Logger } from '../../../utils/logger';
import { CATEGORY_ICONS, getIconComponent } from '../../../utils/icons';
import type { CategoryType, Category } from '../../../types/finance';

export function CategoryModal() {
  const { isCategoryModalOpen, setCategoryModalOpen, selectedCategory, loadData } = useFinance();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#22c55e');
  const [icon, setIcon] = useState('cart-outline');
  const [type, setType] = useState<CategoryType>('EXPENSE');
  const [iconFilter, setIconFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEdit = !!selectedCategory;

  useEffect(() => {
    if (isCategoryModalOpen) {
      if (selectedCategory) {
        setName(selectedCategory.name);
        setColor(selectedCategory.color || '#22c55e');
        setIcon(selectedCategory.icon || 'cart-outline');
        setType(selectedCategory.type);
      } else {
        setName('');
        setColor('#22c55e');
        setIcon('cart-outline');
        setType('EXPENSE');
      }
      setIconFilter('');
      setError('');
    }
  }, [isCategoryModalOpen, selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const data: Partial<Category> = { name, color, icon, type };

    try {
      if (isEdit && selectedCategory) {
        await financeService.categories.update(selectedCategory.id, data);
      } else {
        await financeService.categories.create(data);
      }
      await loadData();
      setCategoryModalOpen(false);
    } catch (err: unknown) {
      const errObj = err as Error;
      Logger.error('Erro ao salvar categoria:', errObj);
      setError(errObj.message || 'Erro ao salvar categoria');
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!selectedCategory) return;
    try {
      setLoading(true);
      await financeService.categories.delete(selectedCategory.id);
      await loadData();
      setShowDeleteConfirm(false);
      setCategoryModalOpen(false);
    } catch (err: unknown) {
      const errObj = err as Error;
      Logger.error('Erro ao excluir categoria:', errObj);
      setError(errObj.message || 'Erro ao excluir categoria');
    } finally {
      setLoading(false);
    }
  };

  const filteredIcons = CATEGORY_ICONS.filter(ic => 
    ic.label.toLowerCase().includes(iconFilter.toLowerCase()) ||
    (ic.category && ic.category.toLowerCase().includes(iconFilter.toLowerCase()))
  );

  const CurrentIcon = getIconComponent(icon, HelpCircle);

  return (
    <>
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title={isEdit ? 'Editar Categoria' : 'Nova Categoria'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 rounded-xl text-xs border border-red-200 dark:border-red-900/50">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">Nome da Categoria *</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Supermercado, Farmácia, Lazer..."
              className="w-full px-4 py-2.5 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-sm outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">Tipo de Aplicação</label>
              <select 
                value={type}
                onChange={e => setType(e.target.value as CategoryType)}
                className="w-full px-3 py-2.5 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-xs outline-none focus:ring-2 focus:ring-forest-500"
              >
                <option value="EXPENSE">Despesa</option>
                <option value="INCOME">Receita</option>
                <option value="BOTH">Ambos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">Cor de Destaque</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-10 h-10 p-0.5 rounded-xl border border-earth-200 dark:border-earth-700 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-xs font-mono font-bold uppercase"
                />
              </div>
            </div>
          </div>

          {/* Seletor de Ícones com Busca */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300">
                Selecione um Ícone ({CATEGORY_ICONS.length} disponíveis)
              </label>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
              <input
                type="text"
                value={iconFilter}
                onChange={e => setIconFilter(e.target.value)}
                placeholder="Buscar ícone (ex: comida, carro, viagem, pet, saude)..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-xs outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-48 overflow-y-auto p-1 bg-earth-50/50 dark:bg-earth-950/30 rounded-2xl border border-earth-200/60 dark:border-earth-800">
              {filteredIcons.map(ic => {
                const active = icon === ic.value;
                return (
                  <button 
                    key={ic.value} 
                    type="button" 
                    onClick={() => setIcon(ic.value)} 
                    title={`${ic.label} (${ic.category || 'Geral'})`}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all text-earth-700 dark:text-earth-300 min-w-0 cursor-pointer
                      ${active ? 'border-forest-500 bg-forest-50 dark:bg-forest-900/30 font-bold text-forest-600 dark:text-forest-400 shadow-xs' : 'border-transparent hover:bg-earth-100 dark:hover:bg-earth-800'}`}
                  >
                    <ic.Icon size={20} className="shrink-0" />
                    <span className="text-[9px] leading-tight text-center truncate w-full" title={ic.label}>{ic.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pré-visualização da Categoria */}
          <div className="flex items-center gap-3 bg-earth-50 dark:bg-earth-800/50 p-3 rounded-2xl border border-earth-100 dark:border-earth-800">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm" style={{ background: color }}>
              <CurrentIcon size={20} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-earth-400 uppercase font-bold block">Pré-visualização</span>
              <span className="font-bold text-sm text-earth-800 dark:text-earth-200 truncate block">
                {name || 'Nome da categoria'}
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {isEdit && (
              <button 
                type="button" 
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3.5 py-2.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                title="Excluir Categoria"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button 
              type="button" 
              onClick={() => setCategoryModalOpen(false)}
              className="flex-1 py-2.5 bg-earth-100 dark:bg-earth-800 text-earth-700 dark:text-earth-300 rounded-xl text-xs font-bold hover:bg-earth-200 dark:hover:bg-earth-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-2.5 bg-forest-600 text-white rounded-xl text-xs font-bold hover:bg-forest-700 transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-forest-600/20"
            >
              {loading ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Criar Categoria')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={executeDelete}
        title="Excluir Categoria"
        message={`Tem certeza de que deseja excluir a categoria "${selectedCategory?.name}"? Esta ação não poderá ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
        isLoading={loading}
      />
    </>
  );
}
