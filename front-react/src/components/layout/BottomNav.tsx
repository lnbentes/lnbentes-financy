import { NavLink } from 'react-router-dom';
import { Grid, BarChart3 } from 'lucide-react';

export function BottomNav() {
  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors min-h-[56px] ${
      isActive
        ? 'text-forest-600 dark:text-forest-300'
        : 'text-earth-400 dark:text-earth-500 hover:text-forest-600 dark:hover:text-forest-300'
    }`;

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-earth-900 border-t border-earth-200 dark:border-earth-800 flex md:hidden z-50" 
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <NavLink to="/dashboard" className={navLinkClasses}>
        <Grid size={22} />
        <span className="text-[10px] font-medium">Início</span>
      </NavLink>
      <NavLink to="/finance" className={navLinkClasses}>
        <BarChart3 size={22} />
        <span className="text-[10px] font-medium">Finanças</span>
      </NavLink>
    </nav>
  );
}
