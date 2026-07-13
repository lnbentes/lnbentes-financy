import { Server, Plus, Wallet, CreditCard, Building, Banknote, TrendingUp, Smartphone, Globe, Home, Briefcase, Star } from 'lucide-react';
import { useFinance } from '../FinanceContext';
import { formatBRL } from '../../../utils/format';

const ACCOUNT_ICONS_MAP: Record<string, any> = {
  'wallet-outline': Wallet,
  'card-outline': CreditCard,
  'business-outline': Building,
  'cash-outline': Banknote,
  'trending-up-outline': TrendingUp,
  'phone-portrait-outline': Smartphone,
  'globe-outline': Globe,
  'home-outline': Home,
  'briefcase-outline': Briefcase,
  'star-outline': Star,
};



export function AccountsList() {
  const { 
    accounts, 
    setAccountModalOpen, 
    setSelectedAccount,
    setDataModalOpen
  } = useFinance();

  const handleNewAccount = () => {
    setSelectedAccount(null);
    setAccountModalOpen(true);
  };

  const handleOpenData = () => {
    setDataModalOpen(true);
  };

  const accountIcon = (iconName: string, type: string) => {
    if (iconName && ACCOUNT_ICONS_MAP[iconName]) {
      const Icon = ACCOUNT_ICONS_MAP[iconName];
      return <Icon size={20} />;
    }
    // Fallback based on type if icon not present
    switch(type) {
      case 'BANK': return <Building size={20} />;
      case 'WALLET': return <Wallet size={20} />;
      case 'CREDIT': return <CreditCard size={20} />;
      case 'INVESTMENT': return <Briefcase size={20} />;
      default: return <Wallet size={20} />;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold">Contas</h3>
        <div className="flex gap-2">
          <button onClick={handleOpenData} className="flex items-center gap-1.5 text-sm bg-earth-100 dark:bg-earth-800 hover:bg-earth-200 dark:hover:bg-earth-700 text-earth-700 dark:text-earth-300 px-3 py-1.5 rounded-xl transition-colors">
            <Server size={16} /> Dados
          </button>
          <button onClick={handleNewAccount} className="flex items-center gap-1.5 text-sm bg-forest-600 hover:bg-forest-700 text-white px-3 py-1.5 rounded-xl transition-colors">
            <Plus size={16} /> Nova
          </button>
        </div>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
        {accounts.length === 0 ? (
          <p className="text-earth-400 text-sm py-4">Nenhuma conta cadastrada.</p>
        ) : (
          accounts.map(acc => (
            <div 
              key={acc.id} 
              onClick={() => {
                setSelectedAccount(acc);
                setAccountModalOpen(true);
              }}
              className="relative min-w-[220px] p-5 rounded-2xl text-white shadow-lg group cursor-pointer hover:-translate-y-1 transition-all duration-300"
              style={{ background: `linear-gradient(135deg, ${acc.color}cc, ${acc.color}66)` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {accountIcon(acc.icon, acc.type)}
                  <p className="text-xs font-medium opacity-80">{acc.type}</p>
                </div>
              </div>
              <h4 className="text-base font-bold mb-2">{acc.name}</h4>
              <p className={`text-xl font-bold ${acc.balance < 0 ? 'text-red-300' : ''}`}>
                {formatBRL(acc.balance)}
              </p>
              {acc.pending_installments_amount > 0 && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <p className="text-[10px] font-medium opacity-80 uppercase tracking-wide mb-0.5">Parcelas</p>
                  <p className="text-sm font-bold">{formatBRL(acc.pending_installments_amount)}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
