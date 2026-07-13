// main.js - Ponto de entrada da aplicação
// Depende de: core/state.js | core/theme.js | core/router.js | api/index.js | ui.js

async function init() {
    theme.apply();
    setupEventListeners();

    try {
        const users = await api.users.list();
        if (users.length > 0) {
            state.user = users[0];
            await loadAppData();
            ui.showApp();
            router.navigateTo(state.currentView);
        } else {
            ui.showLogin();
        }
    } catch (err) {
        ui.showLogin();
    }
}

async function loadAppData() {
    try {
        const [transactions, accounts, categories] = await Promise.all([
            api.finance.transactions.list(),
            api.finance.accounts.list(),
            api.finance.categories.list(),
        ]);
        state.transactions = transactions;
        state.accounts     = accounts;
        state.categories   = categories;
    } catch (err) {
        console.error('Falha ao carregar dados da aplicação:', err);
    }
}

function setupEventListeners() {
    // Navegação sidebar
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => router.navigateTo(btn.dataset.view));
    });

    // Navegação bottom nav (mobile)
    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
        btn.addEventListener('click', () => router.navigateTo(btn.dataset.view));
    });

    // Alternador de tema
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => theme.toggle());
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await api.auth.logout();
            window.location.reload();
        });
    }

    // Formulário de login (delegação)
    document.addEventListener('submit', async (e) => {
        if (e.target.id === 'login-form') {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            const errorEl  = document.getElementById('login-error');
            try {
                await api.auth.login(username, password);
                init();
            } catch (err) {
                errorEl.innerText = err.message;
                errorEl.classList.remove('hidden');
            }
        }
    });
}

// Inicia a aplicação
document.addEventListener('DOMContentLoaded', init);

