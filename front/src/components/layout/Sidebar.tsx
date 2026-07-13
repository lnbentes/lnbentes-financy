import { NavLink } from 'react-router-dom';
import { Leaf, Grid, BarChart3, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { authService } from '../../services/authService';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
      isActive
        ? 'bg-forest-50 text-forest-700 dark:bg-forest-900/20 dark:text-forest-300'
        : 'text-earth-600 hover:bg-forest-50 hover:text-forest-700 dark:text-earth-400 dark:hover:bg-forest-900/20 dark:hover:text-forest-300'
    }`;

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden" 
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-white dark:bg-earth-900 border-r border-earth-200 dark:border-earth-800 transition-transform duration-300 z-50 w-64 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-forest-600 rounded-xl flex items-center justify-center text-white text-xl">
            <Leaf size={24} />
          </div>
          <div className="font-serif font-bold text-xl text-forest-900 dark:text-forest-100">
            Finanças App
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <NavLink to="/dashboard" onClick={onClose} className={navLinkClasses}>
            <Grid size={20} className="shrink-0" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/finance" onClick={onClose} className={navLinkClasses}>
            <BarChart3 size={20} className="shrink-0" />
            <span>Financeiro</span>
          </NavLink>
          <a href="/admin/" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-earth-600 hover:bg-forest-50 hover:text-forest-700 dark:text-earth-400 dark:hover:bg-forest-900/20 dark:hover:text-forest-300">
            <Settings size={20} className="shrink-0" />
            <span>Admin</span>
          </a>
        </nav>

        <div className="p-4 mt-auto border-t border-earth-100 dark:border-earth-800 space-y-2">
          <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-earth-600 hover:bg-earth-100 dark:text-earth-400 dark:hover:bg-earth-800 transition-all font-medium">
            {theme === 'dark' ? <Sun size={20} className="shrink-0" /> : <Moon size={20} className="shrink-0" />}
            <span>Tema {theme === 'dark' ? 'Claro' : 'Escuro'}</span>
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-medium">
            <LogOut size={20} className="shrink-0" />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
