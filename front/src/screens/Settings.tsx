import { useState, useEffect } from 'react';
import { 
  Palette, 
  Check, 
  Sparkles, 
  Lock, 
  Bell, 
  Eye, 
  EyeOff, 
  Download, 
  RefreshCw, 
  Shield, 
  Moon, 
  Sun, 
  CheckCircle2,
  Sliders,
  Database,
  Pipette,
  UserCheck,
  Mail,
  Edit3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { financeService } from '../services/finance';
import { userService } from '../services/userService';
import { Logger } from '../utils/logger';

const PALETTE_DETAILS = [
  { id: 'forest', name: 'Verde Floresta (Eco)', mainColor: '#22c55e', colors: ['#f0fdf4', '#22c55e', '#15803d'] },
  { id: 'emerald', name: 'Verde Esmeralda', mainColor: '#10b981', colors: ['#ecfdf5', '#10b981', '#047857'] },
  { id: 'ocean', name: 'Azul Real (M3)', mainColor: '#3b82f6', colors: ['#eff6ff', '#3b82f6', '#1d4ed8'] },
  { id: 'sky', name: 'Azul Celeste', mainColor: '#0ea5e9', colors: ['#f0f9ff', '#0ea5e9', '#0369a1'] },
  { id: 'indigo', name: 'Indigo Noturno', mainColor: '#6366f1', colors: ['#eef2ff', '#6366f1', '#4338ca'] },
  { id: 'lavender', name: 'Roxo Neon (Violet)', mainColor: '#a855f7', colors: ['#faf5ff', '#a855f7', '#7e22ce'] },
  { id: 'rose', name: 'Rosa Choque (Sakura)', mainColor: '#ec4899', colors: ['#fdf2f8', '#ec4899', '#be185d'] },
  { id: 'ruby', name: 'Vermelho Rubi', mainColor: '#e11d48', colors: ['#fff1f2', '#e11d48', '#9f1239'] },
  { id: 'tangerine', name: 'Laranja Sunset', mainColor: '#f97316', colors: ['#fff7ed', '#f97316', '#c2410c'] },
  { id: 'amber', name: 'Dourado / Âmbar', mainColor: '#f59e0b', colors: ['#fffbeb', '#f59e0b', '#b45309'] },
  { id: 'teal', name: 'Azul-Petróleo (Teal)', mainColor: '#14b8a6', colors: ['#f0fdfa', '#14b8a6', '#0f766e'] },
  { id: 'cyan', name: 'Ciano Elétrico', mainColor: '#06b6d4', colors: ['#ecfeff', '#06b6d4', '#0e7490'] },
];

export function Settings() {
  const { user, setUser } = useAuth();
  const { theme, toggleTheme, palette, customHex, changePalette } = useTheme();

  // Estados de preferências
  const [hideBalances, setHideBalances] = useState(() => {
    return localStorage.getItem('hide_balances') === 'true';
  });
  const [notifyBudget, setNotifyBudget] = useState(() => {
    return localStorage.getItem('notify_budget') !== 'false';
  });
  const [notifyRecurring, setNotifyRecurring] = useState(() => {
    return localStorage.getItem('notify_recurring') !== 'false';
  });

  // Cor personalizada
  const [pickerColor, setPickerColor] = useState(customHex || '#22c55e');

  // Modal de alterar dados do perfil (Nome e E-mail)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal de alterar senha
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Status de feedback
  const [cacheCleared, setCacheCleared] = useState(false);
  const [storageUsage, setStorageUsage] = useState<string>('Calculando...');

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    try {
      let totalBytes = 0;
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          totalBytes += (localStorage[key].length + key.length) * 2;
        }
      }
      setStorageUsage(`${(totalBytes / 1024).toFixed(2)} KB`);
    } catch {
      setStorageUsage('Indisponível');
    }
  }, []);

  const handleToggleHideBalances = () => {
    const newVal = !hideBalances;
    setHideBalances(newVal);
    localStorage.setItem('hide_balances', newVal.toString());
  };

  const handleToggleNotifyBudget = () => {
    const newVal = !notifyBudget;
    setNotifyBudget(newVal);
    localStorage.setItem('notify_budget', newVal.toString());
  };

  const handleToggleNotifyRecurring = () => {
    const newVal = !notifyRecurring;
    setNotifyRecurring(newVal);
    localStorage.setItem('notify_recurring', newVal.toString());
  };

  const handleClearCache = () => {
    try {
      const themeVal = localStorage.getItem('theme');
      const paletteVal = localStorage.getItem('palette');
      const customHexVal = localStorage.getItem('custom_hex');
      localStorage.clear();
      if (themeVal) localStorage.setItem('theme', themeVal);
      if (paletteVal) localStorage.setItem('palette', paletteVal);
      if (customHexVal) localStorage.setItem('custom_hex', customHexVal);
      
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 4000);
    } catch (err) {
      Logger.error('Erro ao limpar cache local:', err);
    }
  };

  const handleExportData = () => {
    window.open(financeService.transactions.export({}), '_blank');
  };

  const handleApplyCustomColor = (colorHex: string) => {
    setPickerColor(colorHex);
    changePalette('custom', colorHex);
  };

  const handleOpenProfileModal = () => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
      setProfileMsg(null);
      setIsProfileModalOpen(true);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setProfileLoading(true);
    setProfileMsg(null);

    try {
      const updated = await userService.updateProfile(user.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
      });

      setUser({
        ...user,
        first_name: updated.first_name,
        last_name: updated.last_name,
        email: updated.email,
      });

      setProfileMsg({ text: 'Perfil atualizado com sucesso!', type: 'success' });
      setTimeout(() => {
        setIsProfileModalOpen(false);
        setProfileMsg(null);
      }, 1500);
    } catch (err: unknown) {
      const errObj = err as Error;
      Logger.error('Erro ao atualizar perfil:', errObj);
      setProfileMsg({ text: errObj.message || 'Erro ao atualizar dados.', type: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 8) {
      setPasswordMsg({ text: 'A nova senha deve ter no mínimo 8 caracteres.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'As senhas informadas não coincidem.', type: 'error' });
      return;
    }

    if (!user) return;

    setPasswordLoading(true);
    try {
      await userService.changePassword(user.id, newPassword);
      setPasswordMsg({ text: 'Senha alterada com sucesso!', type: 'success' });
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordMsg(null);
      }, 1800);
    } catch (err: unknown) {
      const errObj = err as Error;
      setPasswordMsg({ text: errObj.message || 'Erro ao alterar a senha.', type: 'error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || 'Usuário';

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-earth-900 dark:text-earth-50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-forest-100 dark:bg-forest-900/30 text-forest-600 dark:text-forest-400 flex items-center justify-center">
              <Sliders size={22} />
            </div>
            Configurações da Conta
          </h1>
          <p className="text-xs sm:text-sm text-earth-500 mt-1">
            Gerencie seus dados pessoais, e-mail, senha, privacidade e aparência.
          </p>
        </div>
      </header>

      {/* Grid Principal: Perfil, Notificações e Dados */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CARD 1: PERFIL DO USUÁRIO */}
        <div className="bg-white dark:bg-earth-900 p-6 rounded-3xl border border-earth-200 dark:border-earth-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-forest-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-forest-600/20 shrink-0">
                {user?.first_name ? user.first_name[0].toUpperCase() : (user?.username ? user.username[0].toUpperCase() : 'U')}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base text-earth-900 dark:text-earth-100 truncate">
                  {displayName}
                </h3>
                <p className="text-xs text-earth-500 font-mono">@{user?.username}</p>
              </div>
            </div>

            <button
              onClick={handleOpenProfileModal}
              className="p-2 hover:bg-forest-50 dark:hover:bg-forest-900/20 text-forest-600 dark:text-forest-400 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Editar Perfil"
            >
              <Edit3 size={18} />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-earth-50 dark:bg-earth-800/60 border border-earth-100 dark:border-earth-800">
              <span className="text-earth-500 flex items-center gap-1.5">
                <Mail size={13} /> E-mail:
              </span>
              <strong className="text-earth-800 dark:text-earth-200 truncate max-w-[160px]">
                {user?.email || 'Não informado'}
              </strong>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-earth-50 dark:bg-earth-800/60 border border-earth-100 dark:border-earth-800">
              <span className="text-earth-500 flex items-center gap-1.5">
                <UserCheck size={13} /> Nível:
              </span>
              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${user?.is_superuser ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : user?.is_staff ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-earth-200 text-earth-700 dark:bg-earth-700 dark:text-earth-200'}`}>
                {user?.is_superuser ? 'Super Administrador' : (user?.is_staff ? 'Administrador' : 'Usuário Padrão')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleOpenProfileModal}
              className="py-2.5 px-3 bg-forest-50 dark:bg-forest-900/20 hover:bg-forest-100 dark:hover:bg-forest-900/40 text-forest-700 dark:text-forest-300 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Edit3 size={14} />
              <span>Editar Perfil</span>
            </button>

            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="py-2.5 px-3 bg-earth-100 dark:bg-earth-800 hover:bg-earth-200 dark:hover:bg-earth-700 text-earth-800 dark:text-earth-200 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Lock size={14} />
              <span>Mudar Senha</span>
            </button>
          </div>
        </div>

        {/* CARD 2: PRIVACIDADE & NOTIFICAÇÕES */}
        <div className="bg-white dark:bg-earth-900 p-6 rounded-3xl border border-earth-200 dark:border-earth-800 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-forest-100 text-forest-600 rounded-2xl dark:bg-forest-900/20 dark:text-forest-300">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-earth-900 dark:text-earth-100">Privacidade & Alertas</h3>
              <p className="text-xs text-earth-500">Controles visuais e lembretes</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {/* Modo Privacidade */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-earth-50 dark:bg-earth-800/60 border border-earth-100 dark:border-earth-800">
              <div className="space-y-0.5 pr-2">
                <div className="font-bold flex items-center gap-1.5 text-earth-800 dark:text-earth-200">
                  {hideBalances ? <EyeOff size={14} className="text-amber-500" /> : <Eye size={14} className="text-forest-600" />}
                  <span>Ocultar Saldos (Modo Discreto)</span>
                </div>
                <p className="text-[11px] text-earth-500">Esconde valores nas telas principais</p>
              </div>
              <input
                type="checkbox"
                checked={hideBalances}
                onChange={handleToggleHideBalances}
                className="w-5 h-5 rounded accent-forest-600 cursor-pointer shrink-0"
              />
            </div>

            {/* Alerta de Orçamento */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-earth-50 dark:bg-earth-800/60 border border-earth-100 dark:border-earth-800">
              <div className="space-y-0.5 pr-2">
                <div className="font-bold text-earth-800 dark:text-earth-200">Alertas de Metas de Gastos</div>
                <p className="text-[11px] text-earth-500">Avisar ao ultrapassar 80% do teto</p>
              </div>
              <input
                type="checkbox"
                checked={notifyBudget}
                onChange={handleToggleNotifyBudget}
                className="w-5 h-5 rounded accent-forest-600 cursor-pointer shrink-0"
              />
            </div>

            {/* Alerta de Recorrências */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-earth-50 dark:bg-earth-800/60 border border-earth-100 dark:border-earth-800">
              <div className="space-y-0.5 pr-2">
                <div className="font-bold text-earth-800 dark:text-earth-200">Lembrete de Contas Fixas</div>
                <p className="text-[11px] text-earth-500">Notificar sobre vencimento de assinaturas</p>
              </div>
              <input
                type="checkbox"
                checked={notifyRecurring}
                onChange={handleToggleNotifyRecurring}
                className="w-5 h-5 rounded accent-forest-600 cursor-pointer shrink-0"
              />
            </div>
          </div>
        </div>

        {/* CARD 3: DADOS & PORTAL ADMIN */}
        <div className="bg-white dark:bg-earth-900 p-6 rounded-3xl border border-earth-200 dark:border-earth-800 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-2xl dark:bg-blue-900/20 dark:text-blue-300">
              <Database size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-earth-900 dark:text-earth-100">Dados & Sistema</h3>
              <p className="text-xs text-earth-500">Backups e gerenciamento</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <button
              onClick={handleExportData}
              className="w-full py-2.5 px-4 bg-earth-50 dark:bg-earth-800/60 hover:bg-earth-100 dark:hover:bg-earth-800 border border-earth-200 dark:border-earth-800 text-earth-800 dark:text-earth-200 rounded-2xl font-bold transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Download size={16} className="text-forest-600" />
                <span>Exportar Meus Dados (JSON)</span>
              </div>
              <span className="text-[10px] text-earth-400">Download</span>
            </button>

            <button
              onClick={handleClearCache}
              className="w-full py-2.5 px-4 bg-earth-50 dark:bg-earth-800/60 hover:bg-earth-100 dark:hover:bg-earth-800 border border-earth-200 dark:border-earth-800 text-earth-800 dark:text-earth-200 rounded-2xl font-bold transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <RefreshCw size={16} className="text-amber-500" />
                <span>Limpar Cache do Navegador</span>
              </div>
              <span className="text-[10px] text-earth-400">{storageUsage}</span>
            </button>

            {cacheCleared && (
              <div className="p-2.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 rounded-xl text-center font-bold text-[11px] flex items-center justify-center gap-1.5">
                <CheckCircle2 size={14} />
                <span>Cache limpo com sucesso!</span>
              </div>
            )}
          </div>

          {user?.is_staff && (
            <div className="pt-2 border-t border-earth-100 dark:border-earth-800">
              <a
                href="/portal-admin/"
                className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2"
              >
                <Shield size={16} />
                <span>Acessar Portal Administrativo</span>
              </a>
            </div>
          )}
        </div>

      </div>

      {/* ── SEÇÃO 2: PALETA DE CORES & MODO ESCURO ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Seletor de Paleta */}
        <div className="lg:col-span-2 bg-white dark:bg-earth-900 p-6 rounded-3xl border border-earth-200 dark:border-earth-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-earth-100 dark:border-earth-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-forest-100 text-forest-600 rounded-2xl dark:bg-forest-900/20 dark:text-forest-300">
                <Palette size={22} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-earth-900 dark:text-earth-100">Paleta de Cores do Sistema</h3>
                <p className="text-xs text-earth-500">Escolha uma das paletas oficiais ou personalize com sua cor favorita.</p>
              </div>
            </div>

            {/* Alternador Claro / Escuro */}
            <button
              onClick={toggleTheme}
              className="px-4 py-2 bg-earth-100 dark:bg-earth-800 hover:bg-earth-200 dark:hover:bg-earth-700 text-earth-800 dark:text-earth-200 rounded-2xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shrink-0"
            >
              {theme === 'dark' ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} className="text-blue-500" />}
              <span>Modo {theme === 'dark' ? 'Claro' : 'Ultra Escuro'}</span>
            </button>
          </div>

          {/* Grid de 12 Paletas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {PALETTE_DETAILS.map(p => {
              const active = palette === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => changePalette(p.id)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    active 
                      ? 'border-forest-500 bg-forest-50/50 dark:bg-forest-900/20 shadow-sm' 
                      : 'border-earth-200 dark:border-earth-800 hover:border-earth-300 dark:hover:border-earth-700 bg-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] shrink-0" style={{ background: p.mainColor }}>
                      {active && <Check size={10} />}
                    </span>
                    <span className="font-bold text-xs text-earth-800 dark:text-earth-200 truncate">{p.name}</span>
                  </div>
                  
                  <div className="flex gap-1 shrink-0">
                    {p.colors.map((c, i) => (
                      <span 
                        key={i} 
                        className="w-3 h-3 rounded-full border border-earth-200 dark:border-earth-800" 
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Seletor de Cor Personalizada Livre */}
          <div className="p-4 rounded-2xl bg-earth-50 dark:bg-earth-800/40 border border-earth-200 dark:border-earth-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-xl dark:bg-purple-900/30 dark:text-purple-300">
                <Pipette size={18} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-earth-900 dark:text-earth-100">Cor Personalizada (Qualquer Tom)</h4>
                <p className="text-[11px] text-earth-500">Escolha qualquer cor hexadecimal para gerar um tema exclusivo.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="color"
                value={pickerColor}
                onChange={e => handleApplyCustomColor(e.target.value)}
                className="w-10 h-10 rounded-xl border border-earth-200 dark:border-earth-700 cursor-pointer bg-transparent"
                title="Selecione sua cor"
              />
              <input
                type="text"
                value={pickerColor}
                onChange={e => handleApplyCustomColor(e.target.value)}
                className="w-24 px-3 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-900 text-xs font-mono font-bold text-earth-800 dark:text-earth-100 uppercase"
                placeholder="#22c55e"
              />
              {palette === 'custom' && (
                <span className="text-[10px] font-bold px-2 py-1 bg-forest-600 text-white rounded-lg">
                  Ativa
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="bg-white dark:bg-earth-900 p-6 rounded-3xl border border-earth-200 dark:border-earth-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-forest-600 dark:text-forest-400 font-semibold text-sm">
              <Sparkles size={16} />
              <span>Visualização em Tempo Real</span>
            </div>
            <h3 className="text-base font-bold text-earth-900 dark:text-earth-100">Tema Ativo</h3>
            <p className="text-xs text-earth-500 leading-relaxed">
              O design se adapta à cor selecionada e gera variações harmônicas de tons no modo claro e modo escuro profundo (Deep Obsidian).
            </p>
          </div>

          <div className="border border-earth-200 dark:border-earth-800 rounded-2xl p-4 bg-earth-50 dark:bg-earth-950 shadow-inner space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-earth-400">Card Simulado</span>
              <span className="text-xs font-bold text-forest-600 dark:text-forest-400">
                {hideBalances ? 'R$ •••••' : 'R$ 1.500,00'}
              </span>
            </div>
            
            <div className="flex gap-2">
              <button type="button" className="flex-1 py-2 bg-forest-600 text-white rounded-xl font-medium text-xs shadow-md hover:opacity-90 transition-all text-center">
                Destaque Primário
              </button>
              <button type="button" className="flex-1 py-2 bg-forest-100 text-forest-700 dark:bg-forest-900/30 dark:text-forest-300 rounded-xl font-medium text-xs text-center">
                Secundário
              </button>
            </div>
            
            <div className="h-1.5 w-full bg-earth-200 dark:bg-earth-800 rounded-full overflow-hidden">
              <div className="h-full bg-forest-500 rounded-full w-2/3 transition-all duration-500" />
            </div>
          </div>

          <div className="pt-2 border-t border-earth-100 dark:border-earth-800 flex items-center justify-between text-[10px] text-earth-400">
            <span>Paleta: <strong className="capitalize text-earth-600 dark:text-earth-300">{palette}</strong></span>
            <span>Versão: <strong className="text-earth-600 dark:text-earth-300">1.3.0 PWA</strong></span>
          </div>
        </div>

      </div>

      {/* ── MODAL 1: EDITAR PERFIL (NOME E E-MAIL) ── */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-t-3xl sm:rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center border-b border-earth-100 dark:border-earth-800 pb-3">
              <h3 className="font-bold text-base text-earth-900 dark:text-earth-50 flex items-center gap-2">
                <Edit3 size={18} className="text-forest-600" /> Editar Dados do Perfil
              </h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-earth-400 hover:text-earth-600 text-lg cursor-pointer">✕</button>
            </div>

            {profileMsg && (
              <div className={`p-3 rounded-2xl text-xs font-semibold ${profileMsg.type === 'success' ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900/40' : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-900/40'}`}>
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">
                    Primeiro Nome *
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Ex: João"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-xs outline-none focus:ring-2 focus:ring-forest-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">
                    Sobrenome
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Ex: Silva"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-xs outline-none focus:ring-2 focus:ring-forest-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">
                  Endereço de E-mail *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-xs outline-none focus:ring-2 focus:ring-forest-500"
                />
              </div>

              <div className="p-3 bg-earth-50 dark:bg-earth-800/40 rounded-2xl border border-earth-100 dark:border-earth-800 text-[11px] text-earth-500">
                Nome de usuário: <strong className="text-earth-800 dark:text-earth-200">@{user?.username}</strong>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="flex-1 py-3 bg-earth-100 dark:bg-earth-800 hover:bg-earth-200 dark:hover:bg-earth-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="flex-1 py-3 bg-forest-600 hover:bg-forest-700 text-white rounded-2xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-forest-600/20"
                >
                  {profileLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: ALTERAR SENHA ── */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-t-3xl sm:rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center border-b border-earth-100 dark:border-earth-800 pb-3">
              <h3 className="font-bold text-base text-earth-900 dark:text-earth-50 flex items-center gap-2">
                <Lock size={18} className="text-forest-600" /> Alterar Minha Senha
              </h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-earth-400 hover:text-earth-600 text-lg cursor-pointer">✕</button>
            </div>

            {passwordMsg && (
              <div className={`p-3 rounded-2xl text-xs font-semibold ${passwordMsg.type === 'success' ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900/40' : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-900/40'}`}>
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">
                  Nova Senha (Mínimo 8 caracteres) *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-xs outline-none focus:ring-2 focus:ring-forest-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 mb-1">
                  Confirmar Nova Senha *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-earth-200 dark:border-earth-700 bg-earth-50 dark:bg-earth-800 text-xs outline-none focus:ring-2 focus:ring-forest-500"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-3 bg-earth-100 dark:bg-earth-800 hover:bg-earth-200 dark:hover:bg-earth-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 py-3 bg-forest-600 hover:bg-forest-700 text-white rounded-2xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-forest-600/20"
                >
                  {passwordLoading ? 'Salvando...' : 'Atualizar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
