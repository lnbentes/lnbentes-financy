import { useState, useEffect } from 'react';
import { useFinance } from '../FinanceContext';
import { financeService } from '../../../services/finance';
import { Modal } from './Modal';
import { Trash2, Wallet, CreditCard, Building, Banknote, TrendingUp, Smartphone, Globe, Home, Briefcase, Star } from 'lucide-react';

const ACCOUNT_ICONS = [
  { value: 'wallet-outline', label: 'Carteira', Icon: Wallet },
  { value: 'card-outline', label: 'Cartão', Icon: CreditCard },
  { value: 'business-outline', label: 'Banco', Icon: Building },
  { value: 'cash-outline', label: 'Dinheiro', Icon: Banknote },
  { value: 'trending-up-outline', label: 'Investimento', Icon: TrendingUp },
  { value: 'phone-portrait-outline', label: 'Digital', Icon: Smartphone },
  { value: 'globe-outline', label: 'Internacional', Icon: Globe },
  { value: 'home-outline', label: 'Casa', Icon: Home },
  { value: 'briefcase-outline', label: 'Empresa', Icon: Briefcase },
  { value: 'star-outline', label: 'Favorita', Icon: Star },
];

export function AccountModal() {
  const { isAccountModalOpen, setAccountModalOpen, selectedAccount, loadData } = useFinance();
  const [name, setName] = useState('');
  const [type, setType] = useState('BANK');
  const [balance, setBalance] = useState('0');
  const [color, setColor] = useState('#22c55e');
  const [icon, setIcon] = useState(ACCOUNT_ICONS[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!selectedAccount;

  useEffect(() => {
    if (isAccountModalOpen) {
      if (selectedAccount) {
        setName(selectedAccount.name);
        setType(selectedAccount.type);
        setBalance(selectedAccount.balance.toString());
        setColor(selectedAccount.color || '#22c55e');
        setIcon(selectedAccount.icon || ACCOUNT_ICONS[0].value);
      } else {
        setName('');
        setType('BANK');
        setBalance('0');
        setColor('#22c55e');
        setIcon(ACCOUNT_ICONS[0].value);
      }
      setError('');
    }
  }, [isAccountModalOpen, selectedAccount]);

  const handleDelete = async () => {
    if (!window.confirm('Excluir esta conta?')) return;
    try {
      setLoading(true);
      await financeService.accounts.delete(selectedAccount.id);
      await loadData();
      setAccountModalOpen(false);
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

    const data = {
      name,
      type,
      balance: parseFloat(balance.replace(',', '.')),
      color,
      icon
    };

    try {
      if (selectedAccount) {
        await financeService.accounts.update(selectedAccount.id, data);
      } else {
        await financeService.accounts.create(data);
      }
      await loadData();
      setAccountModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar a conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isAccountModalOpen} 
      onClose={() => setAccountModalOpen(false)} 
      title={selectedAccount ? 'Editar Conta' : 'Nova Conta'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Nome da Conta</label>
          <input 
            type="text" 
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none"
            required
            placeholder="Ex: Nubank, Carteira..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Tipo</label>
            <select 
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none"
            >
              <option value="BANK">Conta Corrente</option>
              <option value="WALLET">Carteira</option>
              <option value="CREDIT">Cartão de Crédito</option>
              <option value="INVESTMENT">Investimento</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Saldo Atual (R$)</label>
            <input 
              type="number" 
              step="0.01"
              value={balance}
              onChange={e => setBalance(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none"
              required
            />
          </div>
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
            {ACCOUNT_ICONS.map(ic => {
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
              const SelectedIcon = ACCOUNT_ICONS.find(i => i.value === icon)?.Icon || Wallet;
              return <SelectedIcon size={20} />;
            })()}
          </div>
          <span className="font-semibold text-earth-700 dark:text-earth-300">{name || 'Nome da conta'}</span>
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
            onClick={() => setAccountModalOpen(false)}
            className="flex-1 py-3 bg-earth-100 dark:bg-earth-800 text-earth-700 dark:text-earth-300 rounded-xl font-bold hover:bg-earth-200 dark:hover:bg-earth-700 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="flex-1 py-3 bg-forest-600 text-white rounded-xl font-bold hover:bg-forest-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Criar Conta')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
