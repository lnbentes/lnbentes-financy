import { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  Moon, 
  Sun, 
  Bell, 
  Check, 
  UserPlus, 
  Info, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ArrowRightLeft,
  Wallet
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';
import type { NotificationData } from '../../services/notificationService';
import { registrationService } from '../../services/registrationService';
import { peerTransferService } from '../../services/peerTransferService';
import { accountsService } from '../../services/finance/accounts';
import type { Account } from '../../types/finance';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | number | null>(null);
  
  // Contas do usuário para escolha no recebimento de transferência
  const [userAccounts, setUserAccounts] = useState<Account[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<Record<string, string>>({});

  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await notificationService.list();
      setNotifications(data);
    } catch (err) {
      console.error('Erro ao buscar notificações:', err);
    }
  };

  const fetchAccounts = async () => {
    if (!user) return;
    try {
      const accs = await accountsService.list();
      setUserAccounts(accs);
      if (accs.length > 0) {
        setSelectedAccounts(prev => {
          const updated = { ...prev };
          notifications.forEach(n => {
            if (n.peer_transfer && !updated[n.peer_transfer]) {
              updated[n.peer_transfer] = accs[0].id;
            }
          });
          return updated;
        });
      }
    } catch (err) {
      console.error('Erro ao buscar contas:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchAccounts();
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleApprove = async (reqId: number) => {
    setActionLoadingId(reqId);
    try {
      await registrationService.approveRequest(reqId);
      await fetchNotifications();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao aprovar cadastro.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (reqId: number) => {
    setActionLoadingId(reqId);
    try {
      await registrationService.rejectRequest(reqId);
      await fetchNotifications();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao rejeitar cadastro.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAcceptTransfer = async (transferId: string) => {
    const accId = selectedAccounts[transferId] || (userAccounts.length > 0 ? userAccounts[0].id : '');
    if (!accId) {
      alert('Por favor, selecione uma conta de destino para receber a transferência.');
      return;
    }

    setActionLoadingId(transferId);
    try {
      await peerTransferService.accept(transferId, accId);
      await fetchNotifications();
      // Recarrega a página ou avisa para atualizar saldo
      window.dispatchEvent(new Event('finance-updated'));
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao aceitar transferência.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectTransfer = async (transferId: string) => {
    if (!window.confirm('Tem certeza de que deseja recusar esta transferência? O valor será estornado ao remetente.')) {
      return;
    }

    setActionLoadingId(transferId);
    try {
      await peerTransferService.reject(transferId);
      await fetchNotifications();
      window.dispatchEvent(new Event('finance-updated'));
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao recusar transferência.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRead = async (notificationId: number) => {
    try {
      await notificationService.read(notificationId);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReadAll = async () => {
    try {
      await notificationService.readAll();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="flex justify-between items-center mb-6 sticky top-0 bg-earth-50 dark:bg-earth-950 pt-4 md:pt-8 pb-2 z-40 gap-2 sm:gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-xl text-earth-700 dark:text-earth-200 hover:bg-earth-100 dark:hover:bg-earth-800 transition-colors shrink-0 cursor-pointer" 
          aria-label="Abrir menu"
        >
          <Menu size={24} />
        </button>
        <span className="md:hidden font-bold font-serif text-base text-forest-700 dark:text-forest-300 truncate">
          Finanças
        </span>
        <h2 className="hidden md:block text-xl font-bold capitalize text-earth-800 dark:text-earth-100 truncate">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-0.5 sm:gap-3 shrink-0">
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full text-forest-600 dark:text-forest-300 hover:bg-forest-100 dark:hover:bg-forest-900 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Dropdown de Notificações */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen);
              if (!isDropdownOpen) {
                fetchNotifications();
                fetchAccounts();
              }
            }}
            className="p-2 relative rounded-full text-forest-600 dark:text-forest-300 hover:bg-forest-100 dark:hover:bg-forest-900 transition-colors cursor-pointer"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-5 duration-200">
              <div className="flex items-center justify-between p-4 border-b border-earth-100 dark:border-earth-800 bg-earth-50/50 dark:bg-earth-950/20">
                <span className="font-bold text-sm text-earth-800 dark:text-earth-100">Notificações</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleReadAll}
                    className="text-xs font-semibold text-forest-600 dark:text-forest-400 hover:text-forest-700 dark:hover:text-forest-300 transition-colors cursor-pointer"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto divide-y divide-earth-100 dark:divide-earth-800 scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-earth-400 dark:text-earth-500">
                    <Bell size={32} className="mx-auto mb-2 opacity-40 text-earth-300 dark:text-earth-600" />
                    <p className="text-sm font-medium">Nenhuma notificação</p>
                    <p className="text-xs mt-0.5">Tudo limpo por aqui!</p>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const isRegRequest = notification.registration_request !== null;
                    const regDetail = notification.registration_request_detail;
                    const isRegPending = regDetail?.status === 'PENDING';

                    const isPeerTransfer = notification.peer_transfer !== null;
                    const peerDetail = notification.peer_transfer_detail;
                    const isPeerPending = peerDetail?.status === 'PENDING';
                    const isReceiver = peerDetail?.receiver === user?.id;

                    return (
                      <div 
                        key={notification.id} 
                        className={`p-4 transition-colors ${notification.is_read ? 'bg-white dark:bg-earth-900 opacity-80' : 'bg-forest-50/30 dark:bg-forest-950/10'}`}
                      >
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                            isPeerTransfer 
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                              : isRegRequest 
                              ? 'bg-forest-100 dark:bg-forest-900/30 text-forest-700 dark:text-forest-400' 
                              : 'bg-earth-100 dark:bg-earth-800 text-earth-600 dark:text-earth-400'
                          }`}>
                            {isPeerTransfer ? <ArrowRightLeft size={16} /> : isRegRequest ? <UserPlus size={16} /> : <Info size={16} />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="text-xs font-bold text-earth-800 dark:text-earth-100 truncate">
                                {notification.title}
                              </h4>
                              {!notification.is_read && !isRegPending && !isPeerPending && (
                                <button 
                                  onClick={() => handleRead(notification.id)}
                                  title="Marcar como lida"
                                  className="text-earth-400 hover:text-forest-600 dark:hover:text-forest-400 p-0.5 rounded transition-colors cursor-pointer"
                                >
                                  <Check size={14} />
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-earth-600 dark:text-earth-400 mt-1 break-words leading-relaxed">
                              {notification.message}
                            </p>
                            
                            {/* Ações interativas para Transferência P2P Recebida */}
                            {isPeerTransfer && isPeerPending && isReceiver && (
                              <div className="mt-3 p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-2xl space-y-2.5">
                                <div>
                                  <label className="block text-[10px] font-bold text-blue-900 dark:text-blue-300 mb-1 flex items-center gap-1">
                                    <Wallet size={12} /> Escolha a conta para depositar:
                                  </label>
                                  <select
                                    value={selectedAccounts[notification.peer_transfer!] || (userAccounts[0]?.id || '')}
                                    onChange={(e) => setSelectedAccounts(prev => ({
                                      ...prev,
                                      [notification.peer_transfer!]: e.target.value
                                    }))}
                                    className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-earth-900 text-earth-800 dark:text-earth-200 outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    {userAccounts.map(acc => (
                                      <option key={acc.id} value={acc.id}>
                                        {acc.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="flex gap-2 pt-0.5">
                                  <button
                                    onClick={() => handleAcceptTransfer(notification.peer_transfer!)}
                                    disabled={actionLoadingId !== null}
                                    className="flex-1 py-2 px-3 bg-forest-600 hover:bg-forest-700 disabled:opacity-50 text-white rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                  >
                                    {actionLoadingId === notification.peer_transfer ? (
                                      <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                      <CheckCircle2 size={13} />
                                    )}
                                    <span>Aceitar e Creditar</span>
                                  </button>

                                  <button
                                    onClick={() => handleRejectTransfer(notification.peer_transfer!)}
                                    disabled={actionLoadingId !== null}
                                    className="py-2 px-3 bg-red-100 hover:bg-red-200 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 disabled:opacity-50 rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    {actionLoadingId === notification.peer_transfer ? (
                                      <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                      <XCircle size={13} />
                                    )}
                                    <span>Recusar</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Status de Transferência já resolvida */}
                            {isPeerTransfer && !isPeerPending && peerDetail && (
                              <div className="mt-2 flex items-center gap-1 text-[10px] font-bold">
                                {peerDetail.status === 'ACCEPTED' ? (
                                  <span className="text-forest-600 dark:text-forest-400 flex items-center gap-0.5">
                                    <CheckCircle2 size={11} /> Transferência Aceita
                                  </span>
                                ) : peerDetail.status === 'REJECTED' ? (
                                  <span className="text-red-500 flex items-center gap-0.5">
                                    <XCircle size={11} /> Transferência Recusada
                                  </span>
                                ) : (
                                  <span className="text-earth-400 flex items-center gap-0.5">
                                    Cancelada
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Se for solicitação de cadastro pendente, mostra botões para admins */}
                            {isRegRequest && isRegPending && user?.is_staff && (
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => handleApprove(notification.registration_request!)}
                                  disabled={actionLoadingId !== null}
                                  className="flex-1 py-1.5 px-3 bg-forest-600 hover:bg-forest-700 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  {actionLoadingId === notification.registration_request ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <CheckCircle2 size={12} />
                                  )}
                                  Aprovar
                                </button>
                                <button
                                  onClick={() => handleReject(notification.registration_request!)}
                                  disabled={actionLoadingId !== null}
                                  className="flex-1 py-1.5 px-3 bg-red-550 hover:bg-red-650 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  {actionLoadingId === notification.registration_request ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <XCircle size={12} />
                                  )}
                                  Rejeitar
                                </button>
                              </div>
                            )}

                            {isRegRequest && !isRegPending && regDetail && (
                              <div className="mt-2 flex items-center gap-1 text-[10px] font-bold">
                                {regDetail.status === 'APPROVED' ? (
                                  <span className="text-forest-600 dark:text-forest-400 flex items-center gap-0.5">
                                    <CheckCircle2 size={10} /> Aprovado
                                  </span>
                                ) : (
                                  <span className="text-red-500 flex items-center gap-0.5">
                                    <XCircle size={10} /> Rejeitado
                                  </span>
                                )}
                              </div>
                            )}

                            <span className="block text-[9px] text-earth-400 dark:text-earth-500 mt-2">
                              {new Date(notification.created_at).toLocaleString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 border-l pl-1 sm:pl-4 border-earth-300 dark:border-earth-700">
          <button className="flex items-center gap-2 focus:outline-none cursor-pointer">
            <span className="hidden sm:inline text-sm font-medium text-earth-700 dark:text-earth-200 max-w-[80px] truncate">
              {user?.first_name || user?.username || 'User'}
            </span>
            <div className="w-8 h-8 rounded-full border border-forest-200 shrink-0 bg-forest-100 dark:bg-forest-800 flex items-center justify-center text-forest-600 dark:text-forest-300 font-bold text-xs uppercase">
              {user?.username?.charAt(0) || 'U'}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
