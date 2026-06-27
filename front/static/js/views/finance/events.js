
function financeBindEvents() {
    // ── Seletor de mês/ano ────────────────────────────────────────────────────
    document.getElementById('finance-month-sel').addEventListener('change', e => {
        financeState.month = parseInt(e.target.value);
        financeLoadMonth();
    });
    document.getElementById('finance-year-sel').addEventListener('change', e => {
        financeState.year = parseInt(e.target.value);
        financeLoadMonth();
    });

    // Botão "hoje"
    document.getElementById('btn-today').addEventListener('click', () => {
        const now = new Date();
        financeState.month = now.getMonth() + 1;
        financeState.year  = now.getFullYear();
        financeLoadMonth();
    });

    // Seta: mês anterior
    document.getElementById('btn-prev-month').addEventListener('click', () => {
        if (financeState.month === 1) {
            financeState.month = 12;
            financeState.year -= 1;
        } else {
            financeState.month -= 1;
        }
        financeLoadMonth();
    });

    // Seta: próximo mês
    document.getElementById('btn-next-month').addEventListener('click', () => {
        if (financeState.month === 12) {
            financeState.month = 1;
            financeState.year += 1;
        } else {
            financeState.month += 1;
        }
        financeLoadMonth();
    });

    // ── Filtros de busca ──────────────────────────────────────────────────────
    document.getElementById('finance-search').addEventListener('input', e => {
        financeState.search = e.target.value;
        clearTimeout(financeState._searchTimer);
        financeState._searchTimer = setTimeout(financeLoadMonth, 400);
    });
    document.getElementById('finance-type-filter').addEventListener('change', e => {
        financeState.txType = e.target.value;
        financeLoadMonth();
    });
    document.getElementById('finance-min-amount').addEventListener('change', e => {
        financeState.minAmount = e.target.value;
        financeLoadMonth();
    });
    document.getElementById('finance-max-amount').addEventListener('change', e => {
        financeState.maxAmount = e.target.value;
        financeLoadMonth();
    });
    document.getElementById('finance-clear-filters').addEventListener('click', () => {
        financeState.search    = '';
        financeState.txType    = '';
        financeState.minAmount = '';
        financeState.maxAmount = '';
        financeLoadMonth();
    });

    // ── Transações ────────────────────────────────────────────────────────────
    document.getElementById('btn-new-transaction').addEventListener('click', () =>
        transactionModal.open({ onSaved: financeLoadMonth })
    );
    document.querySelectorAll('.btn-edit-tx').forEach(btn =>
        btn.addEventListener('click', () => {
            const tx = financeState.transactions.find(t => t.id == btn.dataset.id);
            if (tx) transactionModal.open({ transaction: tx, onSaved: financeLoadMonth });
        })
    );
    document.querySelectorAll('.btn-delete-tx').forEach(btn =>
        btn.addEventListener('click', () => financeDeleteTransaction(btn.dataset.id))
    );

    // ── Contas ────────────────────────────────────────────────────────────────
    document.getElementById('btn-manage-data').addEventListener('click', () =>
        financeDataModal.open({ onDone: financeLoadMonth })
    );
    document.getElementById('btn-new-account').addEventListener('click', () =>
        accountModal.open({ onSaved: _financeReloadAccounts })
    );
    document.querySelectorAll('.btn-edit-acc').forEach(btn =>
        btn.addEventListener('click', () => {
            const acc = state.accounts.find(a => a.id == btn.dataset.id);
            if (acc) accountModal.open({ account: acc, onSaved: _financeReloadAccounts });
        })
    );
    document.querySelectorAll('.btn-delete-acc').forEach(btn =>
        btn.addEventListener('click', () => financeDeleteAccount(btn.dataset.id))
    );

    // ── Categorias ────────────────────────────────────────────────────────────
    document.getElementById('btn-new-category').addEventListener('click', () =>
        categoryModal.open({ onSaved: _financeReloadCategories })
    );
    document.querySelectorAll('.btn-edit-cat').forEach(btn =>
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const cat = state.categories.find(c => c.id == btn.dataset.id);
            if (cat) categoryModal.open({ category: cat, onSaved: _financeReloadCategories });
        })
    );
    document.querySelectorAll('.btn-delete-cat').forEach(btn =>
        btn.addEventListener('click', e => {
            e.stopPropagation();
            financeDeleteCategory(btn.dataset.id);
        })
    );
}

// ── Helpers de reload ─────────────────────────────────────────────────────────
async function _financeReloadAccounts() {
    state.accounts = await api.finance.accounts.list();
    financeLoadMonth();
}

async function _financeReloadCategories() {
    state.categories = await api.finance.categories.list();
    financeLoadMonth();
}

// ── Ações destrutivas ─────────────────────────────────────────────────────────
async function financeDeleteTransaction(id) {
    const tx    = financeState.transactions.find(t => t.id === id);
    const label = tx?.installment_total > 1
        ? `Excluir apenas esta parcela (${tx.installment_current}/${tx.installment_total})?`
        : 'Excluir esta transação?';
    if (!confirm(label)) return;
    try {
        await api.finance.transactions.delete(id);
        await financeLoadMonth();
    } catch (e) {
        alert('Erro ao excluir: ' + e.message);
    }
}

async function financeDeleteAccount(id) {
    if (!confirm('Excluir esta conta? As transações vinculadas serão removidas.')) return;
    try {
        await api.finance.accounts.delete(id);
        await _financeReloadAccounts();
    } catch (e) {
        alert('Erro ao excluir conta: ' + e.message);
    }
}

async function financeDeleteCategory(id) {
    if (!confirm('Excluir esta categoria?')) return;
    try {
        await api.finance.categories.delete(id);
        await _financeReloadCategories();
    } catch (e) {
        alert('Erro ao excluir categoria: ' + e.message);
    }
}
