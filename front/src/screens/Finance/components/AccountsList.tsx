import { Server, Plus, Wallet, Building, CreditCard, Briefcase } from 'lucide-react';
import { useFinance } from '../FinanceContext';
import { formatBRL } from '../../../utils/format';
import { getIconComponent } from '../../../utils/icons';
import type { AccountType } from '../../../types/finance';

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

  const renderAccountIcon = (iconName: string, type: AccountType) => {
    if (iconName) {
      const Icon = getIconComponent(iconName, Wallet);
      return <Icon size={20} />;
    }
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
          <button onClick={handleOpenData} className="flex items-center gap-1.5 text-sm bg-earth-100 dark:bg-earth-800 hover:bg-earth-200 dark:hover:bg-earth-700 text-earth-700 dark:text-earth-300 px-3 py-1.5 rounded-xl transition-colors cursor-pointer">
            <Server size={16} /> Dados
          </button>
          <button onClick={handleNewAccount} className="flex items-center gap-1.5 text-sm bg-forest-600 hover:bg-forest-700 text-white px-3 py-1.5 rounded-xl transition-colors shadow-sm cursor-pointer">
            <Plus size={16} /> Nova Conta
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {accounts.map(acc => {
          const bal = Number(acc.balance) || 0;
          return (
            <div 
              key={acc.id}
              onClick={() => { setSelectedAccount(acc); setAccountModalOpen(true); }}
              className="bg-white dark:bg-earth-900 p-4 rounded-2xl border border-earth-200 dark:border-earth-800 shadow-sm hover:border-forest-500 cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white" 
                  style={{ background: acc.color }}
                >
                  {renderAccountIcon(acc.icon, acc.type)}
                </div>
                <div>
                  <h4 className="font-semibold text-sm leading-tight">{acc.name}</h4>
                  <span className="text-[11px] text-earth-500 capitalize">{acc.type.toLowerCase()}</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`font-bold text-sm ${bal >= 0 ? 'text-forest-600' : 'text-red-600'}`}>
                  {formatBRL(bal)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
