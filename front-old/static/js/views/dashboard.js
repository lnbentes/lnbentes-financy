// views/dashboard.js - Dashboard com dados reais do banco

// ── Estado local do dashboard ────────────────────────────────────────────────
const dashboardState = {
    year:           new Date().getFullYear(),
    month:          new Date().getMonth() + 1,
    summary:        { income: 0, expense: 0, balance: 0, category_breakdown: [] },
    monthSummaries: [],   // 5 meses: [centro-2 … centro+2]
    _appData:       null, // referência ao appData para re-render na navegação
};

const _DASH_MONTHS_PT   = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const _DASH_MONTHS_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                            'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// ── Helpers ──────────────────────────────────────────────────────────────────
function _dashFmt(value) {
    return parseFloat(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function _dashOffsetMonth(year, month, offset) {
    let m = month - 1 + offset;
    const y = year + Math.floor(m / 12);
    m = ((m % 12) + 12) % 12;
    return { year: y, month: m + 1 };
}

function _dashDestroyChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const existing = Chart.getChart(canvas);
    if (existing) existing.destroy();
}

// ── Carregamento de dados via API ────────────────────────────────────────────
async function dashboardLoadData() {
    const offsets = [-2, -1, 0, 1, 2];
    const months  = offsets.map(o => _dashOffsetMonth(dashboardState.year, dashboardState.month, o));

    try {
        const summaries = await Promise.all(
            months.map(({ year, month }) => api.finance.transactions.summary({ year, month }))
        );
        dashboardState.monthSummaries = summaries.map((s, i) => ({
            ...s,
            label: _DASH_MONTHS_PT[months[i].month - 1],
            year:  months[i].year,
            month: months[i].month,
        }));
        dashboardState.summary = summaries[2]; // mês selecionado (centro)
    } catch (e) {
        console.error('Erro ao carregar dados do dashboard:', e);
        dashboardState.monthSummaries = [];
        dashboardState.summary = { income: 0, expense: 0, balance: 0, category_breakdown: [] };
    }

    _dashUpdateCards();
    _dashRenderCharts();
}

// ── Atualiza valores nos cards ───────────────────────────────────────────────
function _dashUpdateCards() {
    const { income, expense, balance } = dashboardState.summary;

    const elIncome  = document.getElementById('dash-income');
    const elExpense = document.getElementById('dash-expense');
    const elBalance = document.getElementById('dash-balance');

    if (elIncome)  elIncome.textContent  = _dashFmt(income);
    if (elExpense) elExpense.textContent = _dashFmt(expense);
    if (elBalance) {
        elBalance.textContent = _dashFmt(balance);
        elBalance.className   = `text-2xl font-bold mt-1 ${balance >= 0 ? 'text-forest-600' : 'text-red-600'}`;
    }
}

// ── Renderiza os gráficos ────────────────────────────────────────────────────
function _dashRenderCharts() {
    _dashDestroyChart('cashflow-chart');
    _dashDestroyChart('category-chart');

    // Gráfico de barras — fluxo de caixa (5 meses)
    const ctx1 = document.getElementById('cashflow-chart');
    if (ctx1) {
        new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: dashboardState.monthSummaries.map(s => s.label),
                datasets: [
                    {
                        label: 'Receitas',
                        data: dashboardState.monthSummaries.map(s => s.income),
                        backgroundColor: '#22c55e',
                        borderRadius: 8,
                    },
                    {
                        label: 'Despesas',
                        data: dashboardState.monthSummaries.map(s => s.expense),
                        backgroundColor: '#ef4444',
                        borderRadius: 8,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: {
                    y: { beginAtZero: true, grid: { display: false } },
                    x: { grid: { display: false } },
                },
            },
        });
    }

    // Gráfico de rosca — categorias do mês selecionado
    const ctx2 = document.getElementById('category-chart');
    if (ctx2) {
        const breakdown = dashboardState.summary.category_breakdown || [];

        // Remove estado vazio anterior
        const prevEmpty = document.getElementById('dash-cat-empty');
        if (prevEmpty) prevEmpty.remove();
        ctx2.style.display = '';

        if (breakdown.length === 0) {
            ctx2.style.display = 'none';
            const empty = document.createElement('p');
            empty.id        = 'dash-cat-empty';
            empty.className = 'text-earth-400 dark:text-earth-600 text-sm text-center mt-10';
            empty.textContent = 'Sem despesas neste mês.';
            ctx2.parentElement.appendChild(empty);
            return;
        }

        new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: breakdown.map(b => b.name),
                datasets: [{
                    data:            breakdown.map(b => b.total),
                    backgroundColor: breakdown.map(b => b.color || '#888888'),
                    borderWidth: 0,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right' } },
            },
        });
    }
}

// ── Render principal ─────────────────────────────────────────────────────────
ui.renderDashboard = function (appData) {
    dashboardState._appData = appData;

    const { user, tasks, accounts } = appData;
    const container = document.getElementById('view-container');
    document.getElementById('view-title').innerText = 'Dashboard';
    document.getElementById('user-name').innerText  = user.username || user.name;

    const pendingTasks  = tasks.filter(t => t.status === 'PENDING').length;
    const totalBalance  = (accounts || []).reduce((s, a) => s + parseFloat(a.balance || 0), 0);

    const now           = new Date();
    const isCurrentMonth = dashboardState.year  === now.getFullYear()
                        && dashboardState.month === now.getMonth() + 1;

    const monthLabel = `${_DASH_MONTHS_FULL[dashboardState.month - 1]} ${dashboardState.year}`;

    container.innerHTML = `
        <div class="space-y-6">

            <!-- Cabeçalho + navegação de mês -->
            <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 class="text-3xl font-bold text-forest-900 dark:text-forest-100">Bem-vindo, ${user.first_name || user.username}</h2>
                    <p class="text-earth-600 dark:text-earth-400">Aqui está o que acontece na sua eco-casa.</p>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                    <button id="dash-prev-month"
                        class="p-2 rounded-xl border border-earth-200 dark:border-earth-700 hover:bg-earth-100 dark:hover:bg-earth-800 text-earth-600 dark:text-earth-400 transition-colors"
                        title="Mês anterior">
                        <ion-icon name="chevron-back-outline" class="text-xl"></ion-icon>
                    </button>
                    <button id="dash-today-btn"
                        class="px-3 py-2 rounded-xl text-sm font-medium border transition-colors
                            ${isCurrentMonth
                                ? 'bg-forest-600 text-white border-forest-600'
                                : 'border-earth-200 dark:border-earth-700 text-earth-600 dark:text-earth-400 hover:bg-earth-100 dark:hover:bg-earth-800'}"
                        title="${isCurrentMonth ? 'Mês atual' : 'Voltar para o mês atual'}">
                        ${monthLabel}
                    </button>
                    <button id="dash-next-month"
                        class="p-2 rounded-xl border border-earth-200 dark:border-earth-700 hover:bg-earth-100 dark:hover:bg-earth-800 text-earth-600 dark:text-earth-400 transition-colors"
                        title="Próximo mês">
                        <ion-icon name="chevron-forward-outline" class="text-xl"></ion-icon>
                    </button>
                </div>
            </header>

            <!-- Cards de resumo -->
            <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">

                <div class="bg-white dark:bg-earth-900 p-5 rounded-2xl shadow-sm border border-earth-200 dark:border-earth-800">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-sm font-medium text-earth-500">Tarefas Pendentes</p>
                            <h3 class="text-2xl font-bold text-orange-600 mt-1">${pendingTasks}</h3>
                        </div>
                        <div class="p-2 bg-orange-100 text-orange-600 rounded-lg">
                            <ion-icon name="alert-circle-outline" class="text-2xl"></ion-icon>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-earth-900 p-5 rounded-2xl shadow-sm border border-earth-200 dark:border-earth-800">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-sm font-medium text-earth-500">Saldo Total (Contas)</p>
                            <h3 class="text-2xl font-bold ${totalBalance >= 0 ? 'text-forest-600' : 'text-red-600'} mt-1">${_dashFmt(totalBalance)}</h3>
                        </div>
                        <div class="p-2 bg-forest-100 text-forest-600 rounded-lg">
                            <ion-icon name="business-outline" class="text-2xl"></ion-icon>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-earth-900 p-5 rounded-2xl shadow-sm border border-earth-200 dark:border-earth-800">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-sm font-medium text-earth-500">Renda (Mês)</p>
                            <h3 id="dash-income" class="text-2xl font-bold text-green-600 mt-1">—</h3>
                        </div>
                        <div class="p-2 bg-green-100 text-green-600 rounded-lg">
                            <ion-icon name="trending-up-outline" class="text-2xl"></ion-icon>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-earth-900 p-5 rounded-2xl shadow-sm border border-earth-200 dark:border-earth-800">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-sm font-medium text-earth-500">Gastos (Mês)</p>
                            <h3 id="dash-expense" class="text-2xl font-bold text-red-600 mt-1">—</h3>
                        </div>
                        <div class="p-2 bg-red-100 text-red-600 rounded-lg">
                            <ion-icon name="trending-down-outline" class="text-2xl"></ion-icon>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-earth-900 p-5 rounded-2xl shadow-sm border border-earth-200 dark:border-earth-800">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-sm font-medium text-earth-500">Saldo (Mês)</p>
                            <h3 id="dash-balance" class="text-2xl font-bold text-forest-600 mt-1">—</h3>
                        </div>
                        <div class="p-2 bg-forest-100 text-forest-600 rounded-lg">
                            <ion-icon name="wallet-outline" class="text-2xl"></ion-icon>
                        </div>
                    </div>
                </div>

            </div>

            <!-- Gráficos -->
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div class="bg-white dark:bg-earth-900 p-4 md:p-6 rounded-2xl shadow-sm border border-earth-200 dark:border-earth-800 h-64 md:h-80">
                    <h3 class="text-base md:text-lg font-semibold text-earth-800 dark:text-earth-100 mb-3 md:mb-4">
                        Fluxo de Caixa
                    </h3>
                    <canvas id="cashflow-chart"></canvas>
                </div>
                <div class="bg-white dark:bg-earth-900 p-4 md:p-6 rounded-2xl shadow-sm border border-earth-200 dark:border-earth-800 h-64 md:h-80">
                    <h3 class="text-base md:text-lg font-semibold text-earth-800 dark:text-earth-100 mb-3 md:mb-4">
                        Despesas por Categoria
                    </h3>
                    <canvas id="category-chart"></canvas>
                </div>
            </div>

        </div>
    `;

    // Botão: mês anterior
    document.getElementById('dash-prev-month').addEventListener('click', () => {
        const { year, month } = _dashOffsetMonth(dashboardState.year, dashboardState.month, -1);
        dashboardState.year  = year;
        dashboardState.month = month;
        ui.renderDashboard(dashboardState._appData);
    });

    // Botão: próximo mês
    document.getElementById('dash-next-month').addEventListener('click', () => {
        const { year, month } = _dashOffsetMonth(dashboardState.year, dashboardState.month, 1);
        dashboardState.year  = year;
        dashboardState.month = month;
        ui.renderDashboard(dashboardState._appData);
    });

    // Botão: voltar ao mês atual
    document.getElementById('dash-today-btn').addEventListener('click', () => {
        const now = new Date();
        if (!isCurrentMonth) {
            dashboardState.year  = now.getFullYear();
            dashboardState.month = now.getMonth() + 1;
            ui.renderDashboard(dashboardState._appData);
        }
    });

    // Inicia carregamento assíncrono dos dados financeiros
    dashboardLoadData();
};
