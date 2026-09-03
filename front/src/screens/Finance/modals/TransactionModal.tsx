import { useState, useEffect } from 'react';
import { useFinance } from '../FinanceContext';
import { financeService } from '../../../services/finance';
import { peerTransferService } from '../../../services/peerTransferService';
import { Modal } from './Modal';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { InstallmentManagerModal } from './InstallmentManagerModal';
import { 
  Trash2, 
  ArrowDownRight, 
  ArrowUpRight, 
  ArrowRightLeft, 
  CreditCard, 
  Building2, 
  Banknote, 
  Zap, 
  Layers,
  Users
} from 'lucide-react';
import { Logger } from '../../../utils/logger';
import { formatBRL } from '../../../utils/format';
import type { PaymentMethod, Transaction, TransactionType } from '../../../types/finance';
import type { User } from '../../../types/auth';

const PAYMENT_METHODS: { value: PaymentMethod; label: string; Icon: typeof CreditCard }[] = [
  { value: 'PIX', label: 'Pix', Icon: Zap },
  { value: 'CREDIT', label: 'Crédito', Icon: CreditCard },
  { value: 'DEBIT', label: 'Débito', Icon: Building2 },
  { value: 'CASH', label: 'Dinheiro', Icon: Banknote },
];

const QUICK_INSTALLMENTS = ['2', '3', '4', '6', '10', '12'];

export function TransactionModal() {
  const { 
    isTransactionModalOpen, 
    setTransactionModalOpen, 
    selectedTransaction, 
    accounts, 
    categories, 
    loadData 
  } = useFinance();
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [method, setMethod] = useState<PaymentMethod>('DEBIT');
  const [date, setDate] = useState('');
  const [account, setAccount] = useState('');
  const [category, setCategory] = useState('');
  const [toAccount, setToAccount] = useState('');
  
  // Transferência P2P
  const [transferMode, setTransferMode] = useState<'LOCAL' | 'P2P'>('LOCAL');
  const [recipients, setRecipients] = useState<User[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState<number | ''>('');
  
  const [isInstallment, setIsInstallment] = useState(false);
  const [installments, setInstallments] = useState('2');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSimpleDeleteConfirm, setShowSimpleDeleteConfirm] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<Partial<Transaction> | null>(null);
  const [isInstallmentManagerOpen, setIsInstallmentManagerOpen] = useState(false);

  const isEdit = !!selectedTransaction;
  const isTransfer = type === 'TRANSFER';

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  useEffect(() => {
    if (isTransactionModalOpen) {
      if (selectedTransaction) {
        setDescription(selectedTransaction.description || '');
        setAmount(selectedTransaction.amount?.toString() || '');
        setType(selectedTransaction.type || 'EXPENSE');
        setMethod(selectedTransaction.method || 'DEBIT');
        setDate(selectedTransaction.purchase_date || selectedTransaction.date || todayStr);
        setAccount(selectedTransaction.account || '');
        setCategory(selectedTransaction.category || '');
        setToAccount(selectedTransaction.to_account || '');
        setIsInstallment(Boolean(selectedTransaction.installment_total && selectedTransaction.installment_total > 1));
        setInstallments(selectedTransaction.installment_total?.toString() || '2');
      } else {
        setDescription('');
        setAmount('');
        setType('EXPENSE');
        setMethod('DEBIT');
        setDate(todayStr);
        setAccount(accounts.length > 0 ? accounts[0].id : '');
        setCategory(categories.length > 0 ? categories[0].id : '');
        setToAccount(accounts.length > 1 ? accounts[1].id : '');
        setIsInstallment(false);
        setInstallments('2');
      }
      setError('');
      setShowDeleteConfirm(false);
      setShowSimpleDeleteConfirm(false);
      setShowUpdateConfirm(false);
      setPendingPayload(null);
    }
  }, [isTransactionModalOpen, selectedTransaction, accounts, categories, todayStr]);

  useEffect(() => {
    if (isTransactionModalOpen && isTransfer && transferMode === 'P2P') {
      peerTransferService.recipients()
        .then(users => {
          setRecipients(users);
          if (users.length > 0 && !selectedRecipientId) {
            setSelectedRecipientId(users[0].id);
          }
        })
        .catch(err => Logger.error('Erro ao carregar destinatários:', err));
    }
  }, [isTransactionModalOpen, isTransfer, transferMode]);

  const handleDelete = () => {
    if (selectedTransaction?.installment_id_group) {
      setShowDeleteConfirm(true);
    } else {
      setShowSimpleDeleteConfirm(true);
    }
  };

  const executeDelete = async (deleteAll = false) => {
    if (!selectedTransaction) return;
    try {
      setLoading(true);
      await financeService.transactions.delete(selectedTransaction.id, deleteAll);
      await loadData();
      setTransactionModalOpen(false);
    } catch (err: unknown) {
      const errObj = err as Error;
      Logger.error('Erro ao excluir transação:', errObj);
      setError(errObj.message || 'Erro ao excluir');
      setShowDeleteConfirm(false);
      setShowSimpleDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const parsedAmount = parseFloat(amount.toString().replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Por favor, informe um valor válido maior que zero.');
      setLoading(false);
      return;
    }

    if (!account) {
      setError('Por favor, selecione uma conta.');
      setLoading(false);
      return;
    }

    // Fluxo de Transferência P2P para outro usuário
    if (isTransfer && transferMode === 'P2P') {
      if (!selectedRecipientId) {
        setError('Por favor, selecione o usuário destinatário da transferência.');
        setLoading(false);
        return;
      }

      try {
        await peerTransferService.send({
          sender_account: account,
          receiver_id: Number(selectedRecipientId),
          amount: parsedAmount,
          description: description.trim(),
          date,
        });
        await loadData();
        setTransactionModalOpen(false);
      } catch (err: unknown) {
        const errObj = err as Error;
        Logger.error('Erro ao enviar transferência P2P:', errObj);
        setError(errObj.message || 'Erro ao enviar transferência.');
      } finally {
        setLoading(false);
      }
      return;
    }

    const payload: Partial<Transaction> & { installments?: number } = {
      description: description.trim() || (isTransfer ? 'Transferência' : type === 'INCOME' ? 'Receita' : 'Despesa'),
      amount: parsedAmount,
      type,
      date,
      account,
    };

    if (isTransfer) {
      payload.installments = 1;
      payload.method = 'PIX';
      payload.to_account = toAccount || null;
      if (!payload.to_account) {
        setError('Selecione a conta destino para a transferência.');
        setLoading(false);
        return;
      }
      if (payload.account === payload.to_account) {
        setError('A conta de origem e destino não podem ser iguais.');
        setLoading(false);
        return;
      }
    } else {
      payload.method = method;
      payload.category = category || null;
      if (!isEdit && isInstallment) {
        payload.installments = parseInt(installments, 10) || 1;
      } else {
        payload.installments = 1;
      }
    }

    if (isEdit && selectedTransaction?.installment_id_group) {
      setPendingPayload(payload);
      setShowUpdateConfirm(true);
      setLoading(false);
      return;
    }

    await executeSave(false, payload);
  };

  const executeSave = async (updateAll = false, explicitPayload?: Partial<Transaction> & { installments?: number }) => {
    const dataToSend = explicitPayload || pendingPayload;
    if (!dataToSend) return;

    try {
      setLoading(true);
      if (isEdit && selectedTransaction) {
        await financeService.transactions.update(selectedTransaction.id, dataToSend, updateAll);
      } else {
        await financeService.transactions.create(dataToSend);
      }
      await loadData();
      setTransactionModalOpen(false);
      setShowUpdateConfirm(false);
      setPendingPayload(null);
    } catch (err: unknown) {
      const errObj = err as Error;
      Logger.error('Erro ao salvar transação:', errObj);
      setError(errObj.message || 'Erro ao salvar transação');
      setShowUpdateConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  // Cálculo de parcelas
  const parsedNumAmount = parseFloat(amount.replace(',', '.')) || 0;
  const numInstallments = parseInt(installments, 10) || 1;
  const installmentValue = parsedNumAmount > 0 && numInstallments > 1 ? parsedNumAmount / numInstallments : 0;

  // Renderizar modal de confirmação de edição de parcelamento
  if (showUpdateConfirm && selectedTransaction) {
    return (
      <Modal 
        isOpen={isTransactionModalOpen} 
        onClose={() => setShowUpdateConfirm(false)} 
        title="Editar Compra Parcelada"
      >
        <div className="text-center py-4 space-y-4 animate-in fade-in duration-200">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 rounded-2xl text-xs border border-blue-200 dark:border-blue-900/40 max-w-md mx-auto">
            Esta transação faz parte de um parcelamento (parcela {selectedTransaction.installment_current}/{selectedTransaction.installment_total}).
          </div>
          
          <h3 className="text-sm font-bold text-earth-800 dark:text-earth-100">
            Como você deseja aplicar estas alterações?
          </h3>
          <p className="text-xs text-earth-500 max-w-xs mx-auto">
            Você pode alterar apenas esta parcela individualmente ou sincronizar o valor e deslocar as datas de todas as parcelas deste grupo.
          </p>
          
          <div className="flex flex-col gap-2 max-w-xs mx-auto pt-2">
            <button
              type="button"
              onClick={() => executeSave(false)}
              disabled={loading}
              className="py-3 px-4 bg-earth-100 hover:bg-earth-200 dark:bg-earth-800 dark:hover:bg-earth-700 text-earth-800 dark:text-earth-200 rounded-2xl font-bold text-xs transition-colors cursor-pointer"
            >
              {loading ? 'Salvando...' : 'Salvar apenas nesta parcela'}
            </button>
            <button
              type="button"
              onClick={() => executeSave(true)}
              disabled={loading}
              className="py-3 px-4 bg-forest-600 hover:bg-forest-700 text-white rounded-2xl font-bold text-xs transition-colors cursor-pointer shadow-md shadow-forest-600/20"
            >
              {loading ? 'Salvando...' : 'Aplicar a todas as parcelas'}
            </button>
            <button
              type="button"
              onClick={() => setShowUpdateConfirm(false)}
              disabled={loading}
              className="py-2.5 px-4 text-earth-500 hover:text-earth-700 dark:text-earth-400 font-semibold text-xs transition-colors cursor-pointer"
            >
              Voltar
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // Renderizar modal de exclusão de parcelamento
  if (showDeleteConfirm && selectedTransaction) {
    return (
      <Modal 
        isOpen={isTransactionModalOpen} 
        onClose={() => setTransactionModalOpen(false)} 
        title="Excluir Transação Parcelada"
      >
        <div className="text-center py-4 space-y-4 animate-in fade-in duration-200">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 rounded-2xl text-xs border border-amber-200 dark:border-amber-900/40 max-w-md mx-auto">
            Esta transação faz parte de uma compra parcelada (parcela {selectedTransaction.installment_current}/{selectedTransaction.installment_total}).
          </div>
          
          <h3 className="text-sm font-bold text-earth-800 dark:text-earth-100">Como você deseja prosseguir?</h3>
          
          <div className="flex flex-col gap-2 max-w-xs mx-auto pt-2">
            <button
              type="button"
              onClick={() => executeDelete(false)}
              disabled={loading}
              className="py-3 px-4 bg-earth-100 hover:bg-earth-200 dark:bg-earth-800 dark:hover:bg-earth-700 text-earth-800 dark:text-earth-200 rounded-2xl font-bold text-xs transition-colors cursor-pointer"
            >
              {loading ? 'Excluindo...' : 'Excluir apenas esta parcela'}
            </button>
            <button
              type="button"
              onClick={() => executeDelete(true)}
              disabled={loading}
              className="py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-xs transition-colors cursor-pointer shadow-md shadow-red-600/20"
            >
              {loading ? 'Excluindo...' : 'Excluir todas as parcelas'}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={loading}
              className="py-2.5 px-4 text-earth-500 hover:text-earth-700 dark:text-earth-400 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <>
      <Modal 
        isOpen={isTransactionModalOpen} 
        onClose={() => setTransactionModalOpen(false)} 
        title={isEdit ? 'Editar Lançamento' : 'Novo Lançamento'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 rounded-2xl text-xs border border-red-200 dark:border-red-900/50">
              {error}
            </div>
          )}

          {/* 1. SELETOR DE TIPO (Segmented Controls Touch-Friendly) */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-earth-100 dark:bg-earth-800/80 rounded-2xl">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                type === 'EXPENSE'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-earth-600 dark:text-earth-400 hover:text-earth-900 dark:hover:text-earth-200'
              }`}
            >
              <ArrowDownRight size={16} />
              <span>Despesa</span>
            </button>

            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                type === 'INCOME'
                  ? 'bg-forest-600 text-white shadow-sm'
                  : 'text-earth-600 dark:text-earth-400 hover:text-earth-900 dark:hover:text-earth-200'
              }`}
            >
              <ArrowUpRight size={16} />
              <span>Receita</span>
            </button>

            <button
              type="button"
              onClick={() => setType('TRANSFER')}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                type === 'TRANSFER'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-earth-600 dark:text-earth-400 hover:text-earth-900 dark:hover:text-earth-200'
              }`}
            >
              <ArrowRightLeft size={15} />
              <span>Transferir</span>
            </button>
          </div>

          {/* 2. HERO INPUT DE VALOR (Grande, Centralizado e Focado em Mobile) */}
          <div className="bg-earth-50 dark:bg-earth-800/40 p-4 rounded-3xl border border-earth-200 dark:border-earth-800 text-center space-y-1">
            <span className="text-[11px] font-semibold text-earth-500 uppercase tracking-wider block">
              Valor da Transação
            </span>
            <div className="flex items-center justify-center gap-1">
              <span className={`text-2xl font-bold ${
                type === 'EXPENSE' ? 'text-red-500' : type === 'INCOME' ? 'text-forest-600 dark:text-forest-400' : 'text-blue-600 dark:text-blue-400'
              }`}>
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0,00"
                className={`w-44 text-3xl font-bold bg-transparent text-center outline-none tracking-tight ${
                  type === 'EXPENSE' ? 'text-red-500 placeholder-red-300' : type === 'INCOME' ? 'text-forest-600 dark:text-forest-400 placeholder-forest-300' : 'text-blue-600 dark:text-blue-400 placeholder-blue-300'
                }`}
                autoFocus={!isEdit}
              />
            </div>
          </div>

          {/* 3. DESCRIÇÃO */}
          <div>
            <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">
              Descrição / O que foi? *
            </label>
            <input 
              type="text" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              required
              placeholder="Ex: Mercado Semanal, Salário, Restaurante..."
              className="w-full px-4 py-3 rounded-2xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-sm outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>

          {/* 4. MÉTODO DE PAGAMENTO (Pills Touch) */}
          {!isTransfer && (
            <div>
              <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1.5">
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PAYMENT_METHODS.map(m => {
                  const active = method === m.value;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMethod(m.value)}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                        active
                          ? 'border-forest-500 bg-forest-50 dark:bg-forest-900/30 text-forest-700 dark:text-forest-300 shadow-xs'
                          : 'border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-earth-600 dark:text-earth-400 hover:border-earth-300'
                      }`}
                    >
                      <m.Icon size={15} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. DATA (Com atalhos Hoje / Ontem) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300">
                {method === 'CREDIT' && !isTransfer ? 'Data da Compra *' : 'Data do Lançamento *'}
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setDate(todayStr)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                    date === todayStr ? 'bg-forest-600 text-white' : 'bg-earth-100 dark:bg-earth-800 text-earth-600 dark:text-earth-400'
                  }`}
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => setDate(yesterdayStr)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                    date === yesterdayStr ? 'bg-forest-600 text-white' : 'bg-earth-100 dark:bg-earth-800 text-earth-600 dark:text-earth-400'
                  }`}
                >
                  Ontem
                </button>
              </div>
            </div>
            <div className="relative">
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                required
                className="w-full px-4 py-2.5 rounded-2xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-xs font-medium outline-none focus:ring-2 focus:ring-forest-500 cursor-pointer"
              />
            </div>
            {method === 'CREDIT' && !isTransfer && (
              <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-1.5 flex items-center gap-1 font-medium bg-purple-50/60 dark:bg-purple-950/30 p-2 rounded-xl border border-purple-200 dark:border-purple-900/40">
                <CreditCard size={13} className="shrink-0 text-purple-600 dark:text-purple-400" />
                <span>Cobrança computada na fatura do mês seguinte (mês +1).</span>
              </p>
            )}
          </div>

          {/* Seletor de Modalidade de Transferência (Entre Contas vs Outro Usuário) */}
          {isTransfer && !isEdit && (
            <div className="bg-earth-100/70 dark:bg-earth-800/60 p-1 rounded-2xl flex gap-1">
              <button
                type="button"
                onClick={() => setTransferMode('LOCAL')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  transferMode === 'LOCAL'
                    ? 'bg-white dark:bg-earth-700 text-forest-700 dark:text-forest-300 shadow-xs'
                    : 'text-earth-600 dark:text-earth-400 hover:text-earth-800'
                }`}
              >
                <ArrowRightLeft size={14} />
                <span>Entre Minhas Contas</span>
              </button>
              <button
                type="button"
                onClick={() => setTransferMode('P2P')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  transferMode === 'P2P'
                    ? 'bg-white dark:bg-earth-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-earth-600 dark:text-earth-400 hover:text-earth-800'
                }`}
              >
                <Users size={14} />
                <span>Para Outro Usuário (P2P)</span>
              </button>
            </div>
          )}

          {/* 6. CONTA E DESTINO / CATEGORIA */}
          {isTransfer && transferMode === 'P2P' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Minha Conta de Origem */}
                <div>
                  <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">
                    Minha Conta (Origem) *
                  </label>
                  <select 
                    value={account} 
                    onChange={e => setAccount(e.target.value)} 
                    required
                    className="w-full px-3 py-2.5 rounded-2xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-xs outline-none focus:ring-2 focus:ring-forest-500 cursor-pointer"
                  >
                    <option value="">Selecione uma conta...</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({formatBRL(acc.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Usuário Destinatário */}
                <div>
                  <label className="block text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                    Usuário Destinatário *
                  </label>
                  <select 
                    value={selectedRecipientId} 
                    onChange={e => setSelectedRecipientId(Number(e.target.value))} 
                    required
                    className="w-full px-3 py-2.5 rounded-2xl border border-blue-200 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">Selecione um usuário...</option>
                    {recipients.map(u => (
                      <option key={u.id} value={u.id}>
                        @{u.username} {u.first_name ? `(${u.first_name} ${u.last_name || ''})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-2xl text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
                <Users size={16} className="shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <span>O valor será debitado de sua conta e o destinatário receberá uma notificação para escolher em qual de suas contas deseja creditar o valor.</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Conta Origem */}
              <div>
                <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">
                  {isTransfer ? 'Conta de Origem *' : 'Conta Bancária *'}
                </label>
                <select 
                  value={account} 
                  onChange={e => setAccount(e.target.value)} 
                  required
                  className="w-full px-3 py-2.5 rounded-2xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-xs outline-none focus:ring-2 focus:ring-forest-500 cursor-pointer"
                >
                  <option value="">Selecione uma conta...</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatBRL(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Se Transferência: Conta Destino. Se Normal: Categoria */}
              {isTransfer ? (
                <div>
                  <label className="block text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                    Conta de Destino *
                  </label>
                  <select 
                    value={toAccount} 
                    onChange={e => setToAccount(e.target.value)} 
                    required
                    className="w-full px-3 py-2.5 rounded-2xl border border-blue-200 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 text-xs outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">Selecione a conta destino...</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">
                    Categoria
                  </label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-xs outline-none focus:ring-2 focus:ring-forest-500 cursor-pointer"
                  >
                    <option value="">Sem Categoria</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* 7. PARCELAMENTO (Despesas não-transferência) */}
          {!isEdit && !isTransfer && type === 'EXPENSE' && (
            <div className="p-3.5 bg-earth-50 dark:bg-earth-800/40 rounded-2xl border border-earth-200 dark:border-earth-800 space-y-3">
              <label className="flex items-center justify-between cursor-pointer select-none">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-amber-500" />
                  <span className="text-xs font-bold text-earth-800 dark:text-earth-200">
                    Compra Parcelada
                  </span>
                </div>
                <input 
                  type="checkbox" 
                  checked={isInstallment} 
                  onChange={e => setIsInstallment(e.target.checked)}
                  className="w-5 h-5 rounded accent-amber-500 cursor-pointer"
                />
              </label>

              {isInstallment && (
                <div className="space-y-2 pt-2 border-t border-earth-200/60 dark:border-earth-700/60 animate-in fade-in duration-200">
                  <span className="text-[11px] text-earth-500 block">Número de parcelas:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_INSTALLMENTS.map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setInstallments(n)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          installments === n
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-white dark:bg-earth-800 border border-earth-200 dark:border-earth-700 text-earth-700 dark:text-earth-300'
                        }`}
                      >
                        {n}x
                      </button>
                    ))}
                    <input
                      type="number"
                      min="2"
                      max="72"
                      value={installments}
                      onChange={e => setInstallments(e.target.value)}
                      className="w-16 px-2 py-1.5 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-800 text-xs font-bold text-center outline-none"
                      placeholder="Outro"
                    />
                  </div>

                  {numInstallments > 1 && parsedNumAmount > 0 && (
                    <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 pt-1">
                      Serão geradas <strong>{numInstallments} parcelas</strong> de <strong>{formatBRL(installmentValue)}</strong> cada.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Banner de Edição de Parcela */}
          {isEdit && isInstallment && selectedTransaction && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-3.5 flex items-center justify-between gap-2">
              <div className="text-xs text-amber-800 dark:text-amber-300">
                <span>Esta é a parcela <strong>{selectedTransaction.installment_current}/{selectedTransaction.installment_total}</strong>.</span>
              </div>
              {selectedTransaction.installment_id_group && (
                <button
                  type="button"
                  onClick={() => setIsInstallmentManagerOpen(true)}
                  className="py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Zap size={12} />
                  <span>Antecipar / Quitar</span>
                </button>
              )}
            </div>
          )}

          {/* 8. BOTÕES DE AÇÃO (Grandes e Acessíveis para Touch) */}
          <div className="flex gap-2 pt-2">
            {isEdit && (
              <button 
                type="button" 
                onClick={handleDelete}
                className="px-4 py-3 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-2xl font-bold hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                title="Excluir Transação"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button 
              type="button" 
              onClick={() => setTransactionModalOpen(false)}
              className="flex-1 py-3 bg-earth-100 dark:bg-earth-800 text-earth-700 dark:text-earth-300 rounded-2xl font-bold text-xs hover:bg-earth-200 dark:hover:bg-earth-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-3 bg-forest-600 text-white rounded-2xl font-bold text-xs hover:bg-forest-700 transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-forest-600/20"
            >
              {loading ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Concluir Lançamento')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={showSimpleDeleteConfirm}
        onClose={() => setShowSimpleDeleteConfirm(false)}
        onConfirm={async () => {
          setShowSimpleDeleteConfirm(false);
          await executeDelete(false);
        }}
        title="Excluir Transação"
        message={`Tem certeza de que deseja excluir a transação "${selectedTransaction?.description}"? Esta ação não poderá ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
        isLoading={loading}
      />

      {isInstallmentManagerOpen && selectedTransaction?.installment_id_group && (
        <InstallmentManagerModal
          isOpen={isInstallmentManagerOpen}
          onClose={() => setIsInstallmentManagerOpen(false)}
          groupId={selectedTransaction.installment_id_group}
          onUpdated={() => {
            loadData();
            setTransactionModalOpen(false);
          }}
        />
      )}
    </>
  );
}
