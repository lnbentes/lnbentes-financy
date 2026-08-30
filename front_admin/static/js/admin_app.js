/**
 * Orquestrador da Interface do Portal Administrativo
 */
document.addEventListener('DOMContentLoaded', () => {
    AdminApp.init();
});

const AdminApp = {
    state: {
        currentTab: 'dashboard',
        stats: null,
        users: [],
        requests: [],
        notifications: [],
        familyData: null,
        charts: {
            history: null,
            categories: null,
            members: null
        },
        currentUser: null,
        userFilter: '',
        requestFilter: 'ALL',
        confirmCallback: null
    },

    async init() {
        this.setupTheme();
        this.setupEventListeners();
        
        // Inicializa selects de período da família com mês/ano atual
        const now = new Date();
        const mSel = document.getElementById('family-month-select');
        const ySel = document.getElementById('family-year-select');
        if (mSel) mSel.value = String(now.getMonth() + 1);
        if (ySel) ySel.value = String(now.getFullYear());

        await this.checkSession();
        if (this.state.currentUser) {
            await this.refreshAllData();
        }
    },

    // ── Tema e Modo Escuro ────────────────────────────────────
    setupTheme() {
        const savedTheme = localStorage.getItem('admin_theme') || 'dark';
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    },

    toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('admin_theme', isDark ? 'dark' : 'light');
        if (this.state.currentTab === 'family' && this.state.familyData) {
            this.renderFamilyCharts(this.state.familyData);
        }
    },

    // ── Autenticação e Sessão ─────────────────────────────────
    async checkSession() {
        try {
            const user = await AdminAPI.auth.currentUser();
            if (user && (user.is_staff || user.is_superuser)) {
                this.state.currentUser = user;
                this.showAppView();
            } else {
                this.showLoginView();
            }
        } catch {
            this.showLoginView();
        }
    },

    showLoginView() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('admin-layout').classList.add('hidden');
    },

    showAppView() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('admin-layout').classList.remove('hidden');
        document.getElementById('admin-user-name').textContent = this.state.currentUser.first_name || this.state.currentUser.username;
        document.getElementById('admin-user-badge').textContent = this.state.currentUser.is_superuser ? 'Super Admin' : 'Admin';
    },

    async handleLogin(e) {
        e.preventDefault();
        const userInp = document.getElementById('login-username').value.trim();
        const passInp = document.getElementById('login-password').value;
        const errEl = document.getElementById('login-error');
        errEl.classList.add('hidden');

        try {
            await AdminAPI.auth.login(userInp, passInp);
            const user = await AdminAPI.auth.currentUser();
            if (!user || (!user.is_staff && !user.is_superuser)) {
                throw new Error('Acesso restrito a administradores.');
            }
            this.state.currentUser = user;
            this.showAppView();
            this.showToast('Login realizado com sucesso!', 'success');
            await this.refreshAllData();
        } catch (err) {
            errEl.textContent = err.message || 'Credenciais inválidas.';
            errEl.classList.remove('hidden');
        }
    },

    async handleLogout() {
        try {
            await AdminAPI.auth.logout();
        } catch (e) {
            console.warn(e);
        }
        this.state.currentUser = null;
        this.showLoginView();
        this.showToast('Sessão encerrada.', 'info');
    },

    // ── Navegação de Abas ─────────────────────────────────────
    switchTab(tabId) {
        this.state.currentTab = tabId;
        
        // Atualiza botões da sidebar
        document.querySelectorAll('.nav-tab-btn').forEach(btn => {
            const isActive = btn.dataset.tab === tabId;
            btn.classList.toggle('active-tab', isActive);
            btn.classList.toggle('bg-forest-600', isActive);
            btn.classList.toggle('text-white', isActive);
            btn.classList.toggle('text-earth-600', !isActive && !document.documentElement.classList.contains('dark'));
            btn.classList.toggle('text-earth-400', !isActive && document.documentElement.classList.contains('dark'));
        });

        // Oculta todas as seções e exibe a selecionada
        document.querySelectorAll('.tab-content-section').forEach(sec => {
            sec.classList.add('hidden');
        });
        const activeSection = document.getElementById(`section-${tabId}`);
        if (activeSection) {
            activeSection.classList.remove('hidden');
        }

        // Título dinâmico da página
        const titles = {
            dashboard: 'Painel de Controle',
            family: 'Finanças da Família',
            requests: 'Solicitações de Cadastro',
            users: 'Gerenciamento de Usuários',
            database: 'Banco de Dados & Sistema',
            notifications: 'Notificações do Sistema'
        };
        document.getElementById('page-title').textContent = titles[tabId] || 'Portal Administrativo';

        // Atualiza a visualização correspondente
        if (tabId === 'dashboard') this.renderDashboard();
        if (tabId === 'family') this.loadFamilyFinance();
        if (tabId === 'requests') this.renderRequests();
        if (tabId === 'users') this.renderUsers();
        if (tabId === 'database') this.renderDatabase();
        if (tabId === 'notifications') this.renderNotifications();
    },

    // ── Carregamento Geral de Dados ───────────────────────────
    async refreshAllData() {
        try {
            const [stats, requests, users, notifications] = await Promise.all([
                AdminAPI.system.getStats(),
                AdminAPI.registrationRequests.list(),
                AdminAPI.users.list(),
                AdminAPI.notifications.list()
            ]);

            this.state.stats = stats;
            this.state.requests = requests;
            this.state.users = users;
            this.state.notifications = notifications;

            this.updateBadgeCounts();
            this.switchTab(this.state.currentTab);
        } catch (err) {
            this.showToast('Erro ao atualizar dados: ' + err.message, 'error');
        }
    },

    updateBadgeCounts() {
        const pendingCount = this.state.requests.filter(r => r.status === 'PENDING').length;
        const unreadNotifCount = this.state.notifications.filter(n => !n.is_read).length;

        const reqBadge = document.getElementById('badge-requests');
        if (reqBadge) {
            reqBadge.textContent = pendingCount;
            reqBadge.classList.toggle('hidden', pendingCount === 0);
        }

        const notifBadge = document.getElementById('badge-notifications');
        if (notifBadge) {
            notifBadge.textContent = unreadNotifCount;
            notifBadge.classList.toggle('hidden', unreadNotifCount === 0);
        }
    },

    // ── Renderização: Dashboard ───────────────────────────────
    renderDashboard() {
        if (!this.state.stats) return;
        const s = this.state.stats;

        document.getElementById('stat-total-users').textContent = s.users.total;
        document.getElementById('stat-active-users').textContent = `${s.users.active} ativos / ${s.users.inactive} inativos`;
        document.getElementById('stat-pending-requests').textContent = s.registration_requests.pending;
        document.getElementById('stat-transactions').textContent = s.finance.transactions;
        document.getElementById('stat-db-size').textContent = `${s.database.size_mb} MB`;

        // Renderiza pedidos recentes no dashboard
        const recentPending = this.state.requests.filter(r => r.status === 'PENDING').slice(0, 5);
        const listEl = document.getElementById('dashboard-pending-list');
        if (listEl) {
            if (recentPending.length === 0) {
                listEl.innerHTML = '<div class="p-6 text-center text-sm text-earth-400">Nenhum pedido de cadastro pendente no momento.</div>';
            } else {
                listEl.innerHTML = recentPending.map(r => `
                    <div class="flex items-center justify-between p-4 border-b border-earth-100 dark:border-earth-800 last:border-0 hover:bg-earth-50 dark:hover:bg-earth-800/40 transition-colors">
                        <div>
                            <div class="font-bold text-sm text-earth-800 dark:text-earth-100">${r.first_name} ${r.last_name || ''} (@${r.username})</div>
                            <div class="text-xs text-earth-500">${r.email} · ${new Date(r.created_at).toLocaleString('pt-BR')}</div>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="AdminApp.approveRequest(${r.id})" class="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer">
                                Aprovar
                            </button>
                            <button onclick="AdminApp.rejectRequest(${r.id})" class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer">
                                Rejeitar
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        }
    },

    // ── Finanças da Família ───────────────────────────────────
    formatBRL(value) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    },

    async loadFamilyFinance() {
        const mSel = document.getElementById('family-month-select');
        const ySel = document.getElementById('family-year-select');
        
        const now = new Date();
        if (mSel && !mSel.value) {
            mSel.value = String(now.getMonth() + 1);
        }
        if (ySel && !ySel.value) {
            ySel.value = String(now.getFullYear());
        }

        const month = mSel ? mSel.value : (now.getMonth() + 1);
        const year = ySel ? ySel.value : now.getFullYear();

        try {
            const data = await AdminAPI.familyFinance.getStats(year, month);
            this.state.familyData = data;
            this.renderFamilyFinance(data);
        } catch (err) {
            console.error(err);
            this.showToast('Erro ao carregar dados da família: ' + err.message, 'error');
        }
    },

    renderFamilyFinance(data) {
        if (!data || !data.kpis) return;
        const k = data.kpis;

        // Atualiza KPIs
        const elNetworth = document.getElementById('fam-kpi-networth');
        const elAccounts = document.getElementById('fam-kpi-accounts');
        const elIncome = document.getElementById('fam-kpi-income');
        const elExpense = document.getElementById('fam-kpi-expense');
        const elSavings = document.getElementById('fam-kpi-savings');
        const elSavingsRate = document.getElementById('fam-kpi-savings-rate');
        const elInstallments = document.getElementById('fam-kpi-installments');
        const elInstallmentsCount = document.getElementById('fam-kpi-installments-count');

        if (elNetworth) elNetworth.textContent = this.formatBRL(k.total_net_worth);
        if (elAccounts) elAccounts.textContent = `${k.total_accounts} contas ativas`;
        if (elIncome) elIncome.textContent = this.formatBRL(k.family_income);
        if (elExpense) elExpense.textContent = this.formatBRL(k.family_expense);
        if (elSavings) {
            elSavings.textContent = this.formatBRL(k.family_net_savings);
            elSavings.className = `text-2xl font-black ${k.family_net_savings >= 0 ? 'text-blue-500' : 'text-red-500'}`;
        }
        if (elSavingsRate) {
            elSavingsRate.textContent = `${k.savings_rate}% economizado (${k.family_net_savings >= 0 ? 'Superávit' : 'Déficit'})`;
        }
        if (elInstallments) elInstallments.textContent = this.formatBRL(k.total_future_installments);
        if (elInstallmentsCount) elInstallmentsCount.textContent = `${k.count_future_installments} parcelas futuras`;

        // Renderiza Tabela de Membros
        const tableBody = document.getElementById('family-members-table-body');
        if (tableBody) {
            if (!data.members || data.members.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-xs text-earth-400">Nenhum membro encontrado.</td></tr>';
            } else {
                tableBody.innerHTML = data.members.map(m => {
                    const initials = (m.name.charAt(0) || m.username.charAt(0) || 'U').toUpperCase();
                    const netSavings = m.income - m.expense;
                    return `
                        <tr class="hover:bg-earth-50 dark:hover:bg-earth-800/40 transition-colors">
                            <td class="p-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-full bg-forest-100 dark:bg-forest-900/50 text-forest-700 dark:text-forest-300 font-bold text-xs flex items-center justify-center shrink-0 border border-forest-200 dark:border-forest-800">
                                        ${initials}
                                    </div>
                                    <div class="min-w-0">
                                        <div class="font-bold text-xs text-earth-800 dark:text-earth-100 flex items-center gap-1.5 truncate">
                                            <span>${m.name}</span>
                                            ${m.is_staff ? '<span class="px-1.5 py-0.2 text-[9px] bg-forest-100 dark:bg-forest-950 text-forest-700 dark:text-forest-400 font-bold rounded">Staff</span>' : ''}
                                        </div>
                                        <div class="text-[11px] text-earth-400">@${m.username} · ${m.accounts_count} contas</div>
                                    </div>
                                </div>
                            </td>
                            <td class="p-4 text-xs font-semibold text-earth-700 dark:text-earth-300">${this.formatBRL(m.total_balance)}</td>
                            <td class="p-4 text-xs font-bold text-green-600 dark:text-green-400">+${this.formatBRL(m.income)}</td>
                            <td class="p-4 text-xs font-bold text-red-500">-${this.formatBRL(m.expense)}</td>
                            <td class="p-4 text-xs font-bold ${netSavings >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-500'}">
                                ${netSavings >= 0 ? '+' : ''}${this.formatBRL(netSavings)}
                            </td>
                            <td class="p-4 text-right">
                                <div class="inline-flex flex-col items-end gap-1">
                                    <span class="text-xs font-black text-earth-800 dark:text-earth-200">${m.expense_share_percentage}%</span>
                                    <div class="w-20 bg-earth-100 dark:bg-earth-800 h-1.5 rounded-full overflow-hidden">
                                        <div class="bg-red-500 h-full rounded-full" style="width: ${Math.min(m.expense_share_percentage, 100)}%"></div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }

        // Renderiza Gráficos
        this.renderFamilyCharts(data);
    },

    destroyCharts() {
        if (this.state.charts.history) {
            this.state.charts.history.destroy();
            this.state.charts.history = null;
        }
        if (this.state.charts.categories) {
            this.state.charts.categories.destroy();
            this.state.charts.categories = null;
        }
        if (this.state.charts.members) {
            this.state.charts.members.destroy();
            this.state.charts.members = null;
        }
    },

    renderFamilyCharts(data) {
        if (typeof Chart === 'undefined') return;
        this.destroyCharts();

        const isDark = document.documentElement.classList.contains('dark');
        const textColor = isDark ? '#94a3b8' : '#475569';
        const gridColor = isDark ? '#1e293b' : '#f1f5f9';

        // 1. Gráfico de Histórico de 6 Meses
        const canvasHist = document.getElementById('chart-family-history');
        if (canvasHist && data.monthly_history && data.monthly_history.length > 0) {
            const labels = data.monthly_history.map(h => h.label);
            const incomes = data.monthly_history.map(h => h.income);
            const expenses = data.monthly_history.map(h => h.expense);
            const balances = data.monthly_history.map(h => h.balance);

            this.state.charts.history = new Chart(canvasHist, {
                data: {
                    labels,
                    datasets: [
                        {
                            type: 'bar',
                            label: 'Receitas',
                            data: incomes,
                            backgroundColor: '#22c55e',
                            borderRadius: 6,
                            barPercentage: 0.6,
                        },
                        {
                            type: 'bar',
                            label: 'Despesas',
                            data: expenses,
                            backgroundColor: '#ef4444',
                            borderRadius: 6,
                            barPercentage: 0.6,
                        },
                        {
                            type: 'line',
                            label: 'Saldo Líquido',
                            data: balances,
                            borderColor: '#3b82f6',
                            backgroundColor: '#3b82f6',
                            borderWidth: 2.5,
                            tension: 0.3,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: {
                            labels: { color: textColor, font: { family: 'Inter', size: 11, weight: 'bold' } }
                        },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => `${ctx.dataset.label}: ${AdminApp.formatBRL(ctx.raw)}`
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: gridColor },
                            ticks: { color: textColor, font: { family: 'Inter', size: 10 } }
                        },
                        y: {
                            grid: { color: gridColor },
                            ticks: {
                                color: textColor,
                                font: { family: 'Inter', size: 10 },
                                callback: (val) => 'R$ ' + (val / 1000).toFixed(0) + 'k'
                            }
                        }
                    }
                }
            });
        }

        // 2. Gráfico de Categorias Familiares (Donut)
        const canvasCat = document.getElementById('chart-family-categories');
        if (canvasCat) {
            const hasCategories = data.categories && data.categories.length > 0;
            const labels = hasCategories ? data.categories.map(c => c.name) : ['Sem despesas'];
            const amounts = hasCategories ? data.categories.map(c => c.total_amount) : [1];
            const colors = hasCategories ? data.categories.map(c => c.color || '#94a3b8') : ['#e2e8f0'];

            this.state.charts.categories = new Chart(canvasCat, {
                type: 'doughnut',
                data: {
                    labels,
                    datasets: [{
                        data: amounts,
                        backgroundColor: colors,
                        borderWidth: 2,
                        borderColor: isDark ? '#0f172a' : '#ffffff',
                        hoverOffset: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: { color: textColor, font: { family: 'Inter', size: 10, weight: '600' }, boxWidth: 12 }
                        },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => {
                                    if (!hasCategories) return ' Sem despesas registradas';
                                    return ` ${ctx.label}: ${AdminApp.formatBRL(ctx.raw)}`;
                                }
                            }
                        }
                    },
                    cutout: '65%'
                }
            });
        }

        // 3. Gráfico de Membros (Participação nos Gastos)
        const canvasMembers = document.getElementById('chart-family-members');
        if (canvasMembers && data.members && data.members.length > 0) {
            const mLabels = data.members.map(m => m.name);
            const mExpenses = data.members.map(m => m.expense);

            this.state.charts.members = new Chart(canvasMembers, {
                type: 'bar',
                data: {
                    labels: mLabels,
                    datasets: [{
                        label: 'Gastos no Mês',
                        data: mExpenses,
                        backgroundColor: '#ef4444dd',
                        hoverBackgroundColor: '#ef4444',
                        borderRadius: 8,
                        barThickness: 24,
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => ` Gastos: ${AdminApp.formatBRL(ctx.raw)}`
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: gridColor },
                            ticks: {
                                color: textColor,
                                font: { family: 'Inter', size: 10 },
                                callback: (val) => 'R$ ' + val
                            }
                        },
                        y: {
                            grid: { display: false },
                            ticks: { color: textColor, font: { family: 'Inter', size: 11, weight: 'bold' } }
                        }
                    }
                }
            });
        }
    },

    // ── Renderização: Solicitações de Cadastro ────────────────
    renderRequests() {
        const list = this.state.requests;
        const filter = this.state.requestFilter;
        const filtered = filter === 'ALL' ? list : list.filter(r => r.status === filter);

        const tbody = document.getElementById('requests-table-body');
        if (!tbody) return;

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-sm text-earth-400">Nenhuma solicitação encontrada para o filtro "${filter}".</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(r => {
            let statusBadge = '';
            if (r.status === 'PENDING') {
                statusBadge = '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Pendente</span>';
            } else if (r.status === 'APPROVED') {
                statusBadge = '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Aprovado</span>';
            } else {
                statusBadge = '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Rejeitado</span>';
            }

            return `
                <tr class="border-b border-earth-100 dark:border-earth-800 hover:bg-earth-50 dark:hover:bg-earth-800/30 transition-colors text-sm">
                    <td class="p-4 font-mono text-xs text-earth-500">#${r.id}</td>
                    <td class="p-4 font-semibold text-earth-900 dark:text-earth-100">${r.first_name} ${r.last_name || ''}</td>
                    <td class="p-4 text-earth-600 dark:text-earth-400">@${r.username}</td>
                    <td class="p-4 text-earth-600 dark:text-earth-400">${r.email}</td>
                    <td class="p-4">${statusBadge}</td>
                    <td class="p-4 text-right">
                        ${r.status === 'PENDING' ? `
                            <div class="flex justify-end gap-2">
                                <button onclick="AdminApp.approveRequest(${r.id})" class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors">
                                    Aprovar
                                </button>
                                <button onclick="AdminApp.rejectRequest(${r.id})" class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors">
                                    Rejeitar
                                </button>
                            </div>
                        ` : `
                            <span class="text-xs text-earth-400">${new Date(r.created_at).toLocaleDateString('pt-BR')}</span>
                        `}
                    </td>
                </tr>
            `;
        }).join('');
    },

    async approveRequest(id) {
        this.openConfirmModal({
            title: 'Aprovar Solicitação de Cadastro',
            message: 'Tem certeza de que deseja aprovar este cadastro? O usuário será criado imediatamente e poderá acessar o aplicativo.',
            confirmText: 'Aprovar Cadastro',
            confirmClass: 'bg-green-600 hover:bg-green-700',
            onConfirm: async () => {
                try {
                    await AdminAPI.registrationRequests.approve(id);
                    this.showToast('Usuário aprovado e criado com sucesso!', 'success');
                    await this.refreshAllData();
                } catch (err) {
                    this.showToast(err.message, 'error');
                }
            }
        });
    },

    async rejectRequest(id) {
        this.openConfirmModal({
            title: 'Rejeitar Solicitação',
            message: 'Tem certeza de que deseja rejeitar este pedido de cadastro?',
            confirmText: 'Rejeitar',
            confirmClass: 'bg-red-600 hover:bg-red-700',
            onConfirm: async () => {
                try {
                    await AdminAPI.registrationRequests.reject(id);
                    this.showToast('Solicitação rejeitada.', 'info');
                    await this.refreshAllData();
                } catch (err) {
                    this.showToast(err.message, 'error');
                }
            }
        });
    },

    // ── Renderização: Gestão de Usuários ──────────────────────
    renderUsers() {
        const list = this.state.users;
        const q = (this.state.userFilter || '').toLowerCase();
        const filtered = list.filter(u => 
            u.username.toLowerCase().includes(q) || 
            (u.email || '').toLowerCase().includes(q) ||
            (u.first_name || '').toLowerCase().includes(q) ||
            (u.last_name || '').toLowerCase().includes(q)
        );

        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-sm text-earth-400">Nenhum usuário encontrado.</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(u => {
            const isMe = this.state.currentUser && this.state.currentUser.id === u.id;
            return `
                <tr class="border-b border-earth-100 dark:border-earth-800 hover:bg-earth-50 dark:hover:bg-earth-800/30 transition-colors text-sm">
                    <td class="p-4">
                        <div class="font-bold text-earth-900 dark:text-earth-100">${u.first_name || ''} ${u.last_name || ''} ${isMe ? '<span class="text-[10px] bg-forest-100 text-forest-700 dark:bg-forest-900/40 dark:text-forest-300 px-2 py-0.5 rounded-full font-bold">Você</span>' : ''}</div>
                        <div class="text-xs text-earth-500 font-mono">@${u.username}</div>
                    </td>
                    <td class="p-4 text-earth-600 dark:text-earth-400">${u.email || '-'}</td>
                    <td class="p-4">
                        <button onclick="AdminApp.toggleUserActive(${u.id})" class="cursor-pointer ${u.is_active ? 'text-green-600 hover:text-green-700 dark:text-green-400' : 'text-red-500 hover:text-red-600'}" title="Clique para alternar">
                            ${u.is_active ? '● Ativo' : '○ Inativo'}
                        </button>
                    </td>
                    <td class="p-4">
                        <button onclick="AdminApp.toggleUserStaff(${u.id})" class="px-2 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${u.is_staff ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-earth-100 text-earth-600 dark:bg-earth-800 dark:text-earth-400'}">
                            ${u.is_superuser ? 'Super Admin' : (u.is_staff ? 'Staff' : 'Usuário')}
                        </button>
                    </td>
                    <td class="p-4 text-xs text-earth-500">${u.date_joined ? new Date(u.date_joined).toLocaleDateString('pt-BR') : '-'}</td>
                    <td class="p-4 text-right">
                        <div class="flex justify-end gap-1.5">
                            <button onclick="AdminApp.openResetPasswordModal(${u.id}, '${u.username}')" class="p-1.5 bg-earth-100 hover:bg-earth-200 dark:bg-earth-800 dark:hover:bg-earth-700 rounded-lg text-earth-600 dark:text-earth-300 text-xs cursor-pointer transition-colors" title="Redefinir Senha">
                                🔑
                            </button>
                            ${!isMe ? `
                                <button onclick="AdminApp.deleteUser(${u.id}, '${u.username}')" class="p-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/60 rounded-lg text-red-600 dark:text-red-300 text-xs cursor-pointer transition-colors" title="Excluir Usuário">
                                    🗑️
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    async toggleUserActive(id) {
        try {
            await AdminAPI.users.toggleActive(id);
            this.showToast('Status do usuário atualizado.', 'success');
            await this.refreshAllData();
        } catch (err) {
            this.showToast(err.message, 'error');
        }
    },

    async toggleUserStaff(id) {
        try {
            await AdminAPI.users.toggleStaff(id);
            this.showToast('Privilégios de administrador atualizados.', 'success');
            await this.refreshAllData();
        } catch (err) {
            this.showToast(err.message, 'error');
        }
    },

    deleteUser(id, username) {
        this.openConfirmModal({
            title: `Excluir Usuário @${username}`,
            message: `ATENÇÃO: Todos os dados vinculados a este usuário (contas, categorias e transações) serão removidos permanentemente.`,
            confirmText: 'Excluir Definitivamente',
            confirmClass: 'bg-red-600 hover:bg-red-700',
            onConfirm: async () => {
                try {
                    await AdminAPI.users.delete(id);
                    this.showToast(`Usuário @${username} excluído com sucesso.`, 'success');
                    await this.refreshAllData();
                } catch (err) {
                    this.showToast(err.message, 'error');
                }
            }
        });
    },

    openNewUserModal() {
        document.getElementById('user-modal-form').reset();
        document.getElementById('user-modal').classList.remove('hidden');
    },

    closeUserModal() {
        document.getElementById('user-modal').classList.add('hidden');
    },

    async handleCreateUserSubmit(e) {
        e.preventDefault();
        const username = document.getElementById('new-user-username').value.trim();
        const email = document.getElementById('new-user-email').value.trim();
        const firstName = document.getElementById('new-user-firstname').value.trim();
        const lastName = document.getElementById('new-user-lastname').value.trim();
        const password = document.getElementById('new-user-password').value;
        const isStaff = document.getElementById('new-user-is-staff').checked;

        try {
            await AdminAPI.users.create({
                username,
                email,
                first_name: firstName,
                last_name: lastName,
                password,
                is_staff: isStaff,
                is_active: true
            });
            this.closeUserModal();
            this.showToast(`Usuário @${username} criado com sucesso!`, 'success');
            await this.refreshAllData();
        } catch (err) {
            this.showToast(err.message, 'error');
        }
    },

    openResetPasswordModal(id, username) {
        document.getElementById('reset-pass-user-id').value = id;
        document.getElementById('reset-pass-user-label').textContent = `@${username}`;
        document.getElementById('reset-pass-input').value = '';
        document.getElementById('reset-password-modal').classList.remove('hidden');
    },

    closeResetPasswordModal() {
        document.getElementById('reset-password-modal').classList.add('hidden');
    },

    async handleResetPasswordSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('reset-pass-user-id').value;
        const password = document.getElementById('reset-pass-input').value;

        try {
            await AdminAPI.users.resetPassword(id, password);
            this.closeResetPasswordModal();
            this.showToast('Senha redefinida com sucesso!', 'success');
        } catch (err) {
            this.showToast(err.message, 'error');
        }
    },

    // ── Renderização: Banco de Dados & Sistema ────────────────
    renderDatabase() {
        if (!this.state.stats) return;
        const s = this.state.stats;

        document.getElementById('db-engine-val').textContent = s.database.engine.toUpperCase();
        document.getElementById('db-size-val').textContent = `${s.database.size_mb} MB (${s.database.size_bytes.toLocaleString()} bytes)`;
        document.getElementById('db-path-val').textContent = s.database.path;

        document.getElementById('db-count-users').textContent = s.users.total;
        document.getElementById('db-count-accounts').textContent = s.finance.accounts;
        document.getElementById('db-count-categories').textContent = s.finance.categories;
        document.getElementById('db-count-transactions').textContent = s.finance.transactions;
        document.getElementById('db-count-requests').textContent = s.registration_requests.total;
        document.getElementById('db-count-notifications').textContent = s.notifications.total;
    },

    async runDatabaseMaintenance() {
        const btn = document.getElementById('btn-db-maintenance');
        btn.disabled = true;
        btn.innerHTML = '⏳ Otimizando...';

        try {
            const res = await AdminAPI.system.runDbMaintenance();
            this.showToast(res.message || 'Manutenção concluída!', 'success');
            await this.refreshAllData();
        } catch (err) {
            this.showToast(err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '⚡ Executar Otimização (VACUUM)';
        }
    },

    downloadDatabaseBackup() {
        window.open(AdminAPI.system.getBackupUrl(), '_blank');
        this.showToast('Iniciando download do backup...', 'info');
    },

    // ── Renderização: Notificações ────────────────────────────
    renderNotifications() {
        const list = this.state.notifications;
        const listEl = document.getElementById('notifications-full-list');
        if (!listEl) return;

        if (list.length === 0) {
            listEl.innerHTML = '<div class="p-8 text-center text-sm text-earth-400">Nenhuma notificação registrada.</div>';
            return;
        }

        listEl.innerHTML = list.map(n => `
            <div class="p-4 rounded-2xl border transition-all ${n.is_read ? 'bg-white dark:bg-earth-900 border-earth-200 dark:border-earth-800 opacity-70' : 'bg-forest-50/50 dark:bg-forest-950/20 border-forest-300 dark:border-forest-800 shadow-sm'} flex items-start justify-between gap-4">
                <div>
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-sm text-earth-900 dark:text-earth-100">${n.title}</span>
                        ${!n.is_read ? '<span class="w-2 h-2 rounded-full bg-forest-500"></span>' : ''}
                    </div>
                    <p class="text-xs text-earth-600 dark:text-earth-400 mt-1">${n.message}</p>
                    <span class="text-[10px] text-earth-400 mt-2 block">${new Date(n.created_at).toLocaleString('pt-BR')}</span>
                </div>
                ${!n.is_read ? `
                    <button onclick="AdminApp.markNotificationRead(${n.id})" class="px-3 py-1 bg-forest-600 hover:bg-forest-700 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0 transition-colors">
                        Marcar como lida
                    </button>
                ` : ''}
            </div>
        `).join('');
    },

    async markNotificationRead(id) {
        try {
            await AdminAPI.notifications.markAsRead(id);
            await this.refreshAllData();
        } catch (err) {
            this.showToast(err.message, 'error');
        }
    },

    async markAllNotificationsRead() {
        try {
            await AdminAPI.notifications.markAllAsRead();
            this.showToast('Todas as notificações marcadas como lidas.', 'success');
            await this.refreshAllData();
        } catch (err) {
            this.showToast(err.message, 'error');
        }
    },

    // ── Modais e Toasts ───────────────────────────────────────
    openConfirmModal({ title, message, confirmText, confirmClass, onConfirm }) {
        document.getElementById('confirm-modal-title').textContent = title;
        document.getElementById('confirm-modal-message').textContent = message;
        
        const btnConfirm = document.getElementById('confirm-modal-btn');
        btnConfirm.textContent = confirmText || 'Confirmar';
        btnConfirm.className = `px-4 py-2.5 rounded-xl text-white font-bold text-sm cursor-pointer transition-colors ${confirmClass || 'bg-forest-600 hover:bg-forest-700'}`;

        this.state.confirmCallback = onConfirm;
        document.getElementById('confirm-modal').classList.remove('hidden');
    },

    closeConfirmModal() {
        document.getElementById('confirm-modal').classList.add('hidden');
        this.state.confirmCallback = null;
    },

    executeConfirmModal() {
        if (this.state.confirmCallback) {
            this.state.confirmCallback();
        }
        this.closeConfirmModal();
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const colors = {
            success: 'bg-green-600 text-white',
            error: 'bg-red-600 text-white',
            info: 'bg-forest-700 text-white',
            warning: 'bg-amber-600 text-white'
        };

        const toast = document.createElement('div');
        toast.className = `px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 transition-all duration-300 ${colors[type] || colors.info}`;
        toast.innerHTML = `<span>${message}</span>`;

        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    },

    setupEventListeners() {
        // Form login
        const formLogin = document.getElementById('login-form');
        if (formLogin) {
            formLogin.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout
        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => this.handleLogout());
        }

        // Toggle Theme
        const btnTheme = document.getElementById('btn-theme-toggle');
        if (btnTheme) {
            btnTheme.addEventListener('click', () => this.toggleTheme());
        }

        // Sidebar Navigation
        document.querySelectorAll('.nav-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });

        // Filtro de Usuários
        const userSearch = document.getElementById('users-search-input');
        if (userSearch) {
            userSearch.addEventListener('input', (e) => {
                this.state.userFilter = e.target.value;
                this.renderUsers();
            });
        }

        // Filtro de Solicitações
        const reqFilter = document.getElementById('requests-filter-select');
        if (reqFilter) {
            reqFilter.addEventListener('change', (e) => {
                this.state.requestFilter = e.target.value;
                this.renderRequests();
            });
        }

        // Filtro de Mês e Ano da Família
        const famMonth = document.getElementById('family-month-select');
        if (famMonth) {
            famMonth.addEventListener('change', () => this.loadFamilyFinance());
        }
        const famYear = document.getElementById('family-year-select');
        if (famYear) {
            famYear.addEventListener('change', () => this.loadFamilyFinance());
        }

        // Form Criar Usuário
        const formNewUser = document.getElementById('user-modal-form');
        if (formNewUser) {
            formNewUser.addEventListener('submit', (e) => this.handleCreateUserSubmit(e));
        }

        // Form Reset Senha
        const formResetPass = document.getElementById('reset-password-form');
        if (formResetPass) {
            formResetPass.addEventListener('submit', (e) => this.handleResetPasswordSubmit(e));
        }
    }
};
