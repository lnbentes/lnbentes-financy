import { NavLink } from 'react-router-dom';
import { Grid, BarChart3, Target, Repeat, Settings } from 'lucide-react';

export function BottomNav() {
  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex-1 flex flex-col items-center justify-center py-2 gap-1 transition-all min-h-[58px] active:scale-90 select-none ${
      isActive
        ? 'text-forest-600 dark:text-forest-400 font-bold'
        : 'text-earth-400 dark:text-earth-500 hover:text-earth-600 dark:hover:text-earth-300'
    }`;

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-earth-900/95 backdrop-blur-md border-t border-earth-200/80 dark:border-earth-800/80 flex md:hidden z-30 shadow-lg shadow-black/5" 
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <NavLink to="/dashboard" className={navLinkClasses}>
        {({ isActive }) => (
          <>
            <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-forest-50 dark:bg-forest-900/40 text-forest-600 dark:text-forest-400' : ''}`}>
              <Grid size={20} />
            </div>
            <span className="text-[10px] leading-none">Início</span>
          </>
        )}
      </NavLink>

      <NavLink to="/finance" className={navLinkClasses}>
        {({ isActive }) => (
          <>
            <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-forest-50 dark:bg-forest-900/40 text-forest-600 dark:text-forest-400' : ''}`}>
              <BarChart3 size={20} />
            </div>
            <span className="text-[10px] leading-none">Finanças</span>
          </>
        )}
      </NavLink>

      <NavLink to="/budgets" className={navLinkClasses}>
        {({ isActive }) => (
          <>
            <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-forest-50 dark:bg-forest-900/40 text-forest-600 dark:text-forest-400' : ''}`}>
              <Target size={20} />
            </div>
            <span className="text-[10px] leading-none">Metas</span>
          </>
        )}
      </NavLink>

      <NavLink to="/recurring" className={navLinkClasses}>
        {({ isActive }) => (
          <>
            <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400' : ''}`}>
              <Repeat size={20} />
            </div>
            <span className="text-[10px] leading-none">Fixas</span>
          </>
        )}
      </NavLink>

      <NavLink to="/settings" className={navLinkClasses}>
        {({ isActive }) => (
          <>
            <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-forest-50 dark:bg-forest-900/40 text-forest-600 dark:text-forest-400' : ''}`}>
              <Settings size={20} />
            </div>
            <span className="text-[10px] leading-none">Ajustes</span>
          </>
        )}
      </NavLink>
    </nav>
  );
}
