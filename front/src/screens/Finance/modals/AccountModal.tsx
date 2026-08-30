import { useState, useEffect } from 'react';
import { useFinance } from '../FinanceContext';
import { financeService } from '../../../services/finance';
import { Modal } from './Modal';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { Trash2, Wallet } from 'lucide-react';
import { Logger } from '../../../utils/logger';
import { ACCOUNT_ICONS, getIconComponent } from '../../../utils/icons';
import type { AccountType, Account } from '../../../types/finance';

export function AccountModal() {
  const { isAccountModalOpen, setAccountModalOpen, selectedAccount, loadData } = useFinance();
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('BANK');
  const [balance, setBalance] = useState('0');
  const [color, setColor] = useState('#22c55e');
  const [icon, setIcon] = useState('wallet-outline');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEdit = !!selectedAccount;

  useEffect(() => {
    if (isAccountModalOpen) {
      if (selectedAccount) {
        setName(selectedAccount.name);
        setType(selectedAccount.type);
        setBalance(selectedAccount.balance.toString());
        setColor(selectedAccount.color || '#22c55e');
        setIcon(selectedAccount.icon || 'wallet-outline');
      } else {
        setName('');
        setType('BANK');
        setBalance('0');
        setColor('#22c55e');
        setIcon('wallet-outline');
      }
      setError('');
    }
  }, [isAccountModalOpen, selectedAccount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const parsedBalance = parseFloat(balance.replace(',', '.'));
    if (isNaN(parsedBalance)) {
      setError('Informe um saldo inicial válido');
      setLoading(false);
      return;
    }

    const data: Partial<Account> = {
      name,
      type,
      balance: parsedBalance,
      color,
      icon,
    };

    try {
      if (isEdit && selectedAccount) {
        await financeService.accounts.update(selectedAccount.id, data);
      } else {
        await financeService.accounts.create(data);
      }
      await loadData();
      setAccountModalOpen(false);
    } catch (err: unknown) {
      const errObj = err as Error;
      Logger.error('Erro ao salvar conta:', errObj);
      setError(errObj.message || 'Erro ao salvar conta');
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!selectedAccount) return;
    try {
      setLoading(true);
      await financeService.accounts.delete(selectedAccount.id);
      await loadData();
      setShowDeleteConfirm(false);
      setAccountModalOpen(false);
    } catch (err: unknown) {
      const errObj = err as Error;
      Logger.error('Erro ao excluir conta:', errObj);
      setError(errObj.message || 'Erro ao excluir conta');
    } finally {
      setLoading(false);
    }
  };

  const CurrentIcon = getIconComponent(icon, Wallet);

  return (
    <>
      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        title={isEdit ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 rounded-xl text-xs border border-red-200 dark:border-red-900/50">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">Nome da Conta / Banco *</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Nubank, Itaú, Carteira, Inter..."
              className="w-full px-4 py-2.5 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-sm outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">Tipo de Conta</label>
              <select 
                value={type}
                onChange={e => setType(e.target.value as AccountType)}
                className="w-full px-3 py-2.5 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-xs outline-none focus:ring-2 focus:ring-forest-500"
              >
                <option value="BANK">Conta Corrente</option>
                <option value="WALLET">Carteira Física</option>
                <option value="CREDIT">Cartão de Crédito</option>
                <option value="INVESTMENT">Investimento</option>
                <option value="OTHER">Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">Saldo Atual (R$)</label>
              <input 
                type="number" 
                step="0.01"
                required
                value={balance}
                onChange={e => setBalance(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2.5 rounded-xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-xs outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">Cor do Banco / Cartão</label>
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

          {/* Seletor de Ícones para Contas */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300">
              Ícone da Conta ({ACCOUNT_ICONS.length} opções)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1 bg-earth-50/50 dark:bg-earth-950/30 rounded-2xl border border-earth-200/60 dark:border-earth-800">
              {ACCOUNT_ICONS.map(ic => {
                const active = icon === ic.value;
                return (
                  <button 
                    key={ic.value} 
                    type="button" 
                    onClick={() => setIcon(ic.value)} 
                    title={ic.label}
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

          {/* Preview */}
          <div className="flex items-center gap-3 bg-earth-50 dark:bg-earth-800/50 p-3 rounded-2xl border border-earth-100 dark:border-earth-800">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm" style={{ background: color }}>
              <CurrentIcon size={20} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-earth-400 uppercase font-bold block">Pré-visualização</span>
              <span className="font-bold text-sm text-earth-800 dark:text-earth-200 truncate block">
                {name || 'Nome da conta'}
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {isEdit && (
              <button 
                type="button" 
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3.5 py-2.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                title="Excluir Conta"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button 
              type="button" 
              onClick={() => setAccountModalOpen(false)}
              className="flex-1 py-2.5 bg-earth-100 dark:bg-earth-800 text-earth-700 dark:text-earth-300 rounded-xl text-xs font-bold hover:bg-earth-200 dark:hover:bg-earth-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-2.5 bg-forest-600 text-white rounded-xl text-xs font-bold hover:bg-forest-700 transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-forest-600/20"
            >
              {loading ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Criar Conta')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={executeDelete}
        title="Excluir Conta"
        message={`Tem certeza de que deseja excluir a conta "${selectedAccount?.name}"? Esta ação excluirá todo o histórico vinculado a ela.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
        isLoading={loading}
      />
    </>
  );
}
