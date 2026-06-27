// core/router.js - Roteamento e navegação entre views
// Depende de: core/state.js (state), ui.js (ui) e as views registradas

const router = {
    navigateTo(view) {
        state.currentView = view;

        // Atualiza item ativo na barra lateral
        document.querySelectorAll('.nav-item').forEach(btn => {
            if (btn.dataset.view === view) {
                btn.classList.add('bg-forest-50', 'text-forest-700', 'dark:bg-forest-900/20', 'dark:text-forest-300');
                btn.classList.remove('text-earth-600', 'dark:text-earth-400');
            } else {
                btn.classList.remove('bg-forest-50', 'text-forest-700', 'dark:bg-forest-900/20', 'dark:text-forest-300');
                btn.classList.add('text-earth-600', 'dark:text-earth-400');
            }
        });

        // Atualiza item ativo no bottom nav (mobile)
        document.querySelectorAll('.bottom-nav-item').forEach(btn => {
            if (btn.dataset.view === view) {
                btn.classList.add('active', 'text-forest-600', 'dark:text-forest-300');
                btn.classList.remove('text-earth-400', 'dark:text-earth-500');
            } else {
                btn.classList.remove('active', 'text-forest-600', 'dark:text-forest-300');
                btn.classList.add('text-earth-400', 'dark:text-earth-500');
            }
        });

        switch (view) {
            case 'dashboard': ui.renderDashboard(state);         break;
            case 'finance':   ui.renderFinance(state);           break;
            case 'admin':     window.location.href = '/admin/';  break;
        }
    },
};
