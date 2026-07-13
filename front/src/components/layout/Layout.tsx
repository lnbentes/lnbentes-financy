import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getTitle = () => {
    const path = location.pathname.split('/')[1] || 'dashboard';
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      finance: 'Financeiro',
      admin: 'Administração',
    };
    return titles[path] || 'Dashboard';
  };

  return (
    <div className="flex min-h-screen bg-earth-50 dark:bg-earth-950 transition-colors duration-300 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen no-scrollbar transition-all duration-300 ease-in-out md:ml-64 pb-20 md:pb-8 relative">
        <Header onMenuClick={() => setSidebarOpen(true)} title={getTitle()} />
        
        <div className="animate-in fade-in duration-300">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
