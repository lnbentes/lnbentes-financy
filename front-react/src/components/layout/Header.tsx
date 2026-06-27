import { Menu, Moon, Sun, Bell } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <header className="flex justify-between items-center mb-6 sticky top-0 bg-earth-50/90 dark:bg-earth-950/90 backdrop-blur-sm py-2 z-40 gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-xl text-earth-700 dark:text-earth-200 hover:bg-earth-100 dark:hover:bg-earth-800 transition-colors shrink-0" 
          aria-label="Abrir menu"
        >
          <Menu size={24} />
        </button>
        <span className="md:hidden font-bold font-serif text-base text-forest-700 dark:text-forest-300 truncate">
          Finanças App
        </span>
        <h2 className="hidden md:block text-xl font-bold capitalize text-earth-800 dark:text-earth-100 truncate">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full text-forest-600 dark:text-forest-300 hover:bg-forest-100 dark:hover:bg-forest-900 transition-colors"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="p-2 relative rounded-full text-forest-600 dark:text-forest-300 hover:bg-forest-100 dark:hover:bg-forest-900 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center gap-2 border-l pl-2 sm:pl-4 border-earth-300 dark:border-earth-700">
          <button className="flex items-center gap-2 focus:outline-none">
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
