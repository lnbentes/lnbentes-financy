// components/modals/finance/transaction-modal.js - Modal de criação/edição de transação
// Depende de: modal.js, api/index.js, core/state.js

const transactionModal = {
    /**
     * @param {object}   opts
     * @param {object}   [opts.transaction]  - Transação existente para edição
     * @param {Function} [opts.onSaved]      - Callback após salvar/excluir
     */
    open({ transaction = null, onSaved } = {}) {
        const isEdit = !!transaction;
        const t = transaction || {};

        const accountOptions = state.accounts
            .map(acc => `<option value="${acc.id}" ${t.account == acc.id ? 'selected' : ''}>${acc.name}</option>`)
            .join('');

        // Opções de conta destino (para transferência) — exclui a conta de origem selecionada dinamicamente
        const toAccountOptions = state.accounts
            .map(acc => `<option value="${acc.id}" ${t.to_account == acc.id ? 'selected' : ''}>${acc.name}</option>`)
            .join('');

        const categoryOptions = state.categories
            .map(cat => `<option value="${cat.id}" ${t.category == cat.id ? 'selected' : ''}>${cat.name}</option>`)
            .join('');

        const today = t.date || new Date().toISOString().split('T')[0];
        const isInstallment = isEdit && t.installment_total > 1;
        const isTransfer = t.type === 'TRANSFER';

        const deleteBtn = isEdit ? `
            <button type="button" id="tx-modal-delete"
                class="mr-auto px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400
                       hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors font-medium text-sm">
                <ion-icon name="trash-outline" class="mr-1"></ion-icon>Excluir
            </button>` : '';

        modal.open({
            title: isEdit ? 'Editar Transação' : 'Nova Transação',
            size: 'lg',
            body: `
                <form id="tx-modal-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Descrição *</label>
                        <input type="text" name="description" value="${t.description || ''}"
                            class="w-full px-4 py-3 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none transition-all"
                            placeholder="Ex: Mercado, Salário..." required>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Valor (R$) *</label>
                            <input type="number" name="amount" step="0.01" min="0.01" value="${t.amount || ''}"
                                class="w-full px-4 py-3 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none transition-all"
                                placeholder="0,00" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Tipo *</label>
                            <select name="type" id="tx-type-sel"
                                class="w-full px-4 py-3 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none transition-all">
                                <option value="EXPENSE"  ${(!t.type || t.type === 'EXPENSE')  ? 'selected' : ''}>Despesa</option>
                                <option value="INCOME"   ${t.type === 'INCOME'   ? 'selected' : ''}>Receita</option>
                                <option value="TRANSFER" ${t.type === 'TRANSFER' ? 'selected' : ''}>Transferência</option>
                            </select>
                        </div>
                    </div>

                    <!-- Método + Data (oculto em Transferência) -->
                    <div id="tx-method-date-row" class="grid grid-cols-2 gap-4 ${isTransfer ? 'hidden' : ''}">
                        <div>
                            <label class="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Método</label>
                            <select name="method" id="tx-method-sel"
                                class="w-full px-4 py-3 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none transition-all">
                                <option value="DEBIT"  ${(!t.method || t.method === 'DEBIT' || t.method === 'INSTALLMENT') ? 'selected' : ''}>Débito</option>
                                <option value="CREDIT" ${t.method === 'CREDIT' ? 'selected' : ''}>Crédito</option>
                                <option value="CASH"   ${t.method === 'CASH'   ? 'selected' : ''}>Dinheiro</option>
                                <option value="PIX"    ${t.method === 'PIX'    ? 'selected' : ''}>Pix</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Data *</label>
                            <input type="date" name="date" id="tx-date-main" value="${today}"
                                class="w-full px-4 py-3 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none transition-all"
                                ${!isTransfer ? 'required' : ''}>
                        </div>
                    </div>

                    <!-- Data isolada (só aparece em Transferência) -->
                    <div id="tx-date-transfer-row" class="${isTransfer ? '' : 'hidden'}">
                        <label class="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Data *</label>
                        <input type="date" name="date" id="tx-date-transfer" value="${today}"
                            class="w-full px-4 py-3 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none transition-all"
                            ${isTransfer ? 'required' : ''}>
                    </div>

                    <!-- Checkbox parcelado (não disponível em edição nem em Transferência) -->
                    <div id="tx-installment-check-row" class="${isEdit || isTransfer ? 'hidden' : ''}">
                        <label class="flex items-center gap-2 cursor-pointer select-none w-fit">
                            <input type="checkbox" id="tx-installment-check"
                                class="w-4 h-4 rounded accent-amber-500 cursor-pointer">
                            <span class="text-sm font-medium text-earth-700 dark:text-earth-300 flex items-center gap-1">
                                <ion-icon name="layers-outline" class="text-amber-500"></ion-icon>
                                Parcelado
                            </span>
                        </label>
                    </div>

                    <!-- Detalhes de parcelas (controlado pelo checkbox) -->
                    <div id="tx-installment-row" class="hidden bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                        <label class="block text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">
                            <ion-icon name="layers-outline" class="mr-1"></ion-icon>Número de parcelas
                        </label>
                        <input type="number" name="installments" min="2" max="60" value="${isInstallment ? t.installment_total : 2}"
                            class="w-full px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-700 bg-white dark:bg-earth-800 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                            placeholder="Ex: 12">
                        <p class="text-xs text-amber-600 dark:text-amber-400 mt-1.5">O valor total será dividido entre os meses. Parcelas futuras só descontam no mês vigente.</p>
                    </div>

                    <!-- Conta origem -->
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1" id="tx-account-label">Conta</label>
                            <select name="account" id="tx-account-sel"
                                class="w-full px-4 py-3 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none transition-all">
                                ${accountOptions || '<option value="">Nenhuma conta</option>'}
                            </select>
                        </div>
                        <!-- Categoria (oculta em Transferência) -->
                        <div id="tx-category-col">
                            <label class="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Categoria</label>
                            <select name="category"
                                class="w-full px-4 py-3 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none transition-all">
                                <option value="">Sem categoria</option>
                                ${categoryOptions}
                            </select>
                        </div>
                    </div>

                    <!-- Conta destino (só aparece em Transferência) -->
                    <div id="tx-to-account-row" class="${isTransfer ? '' : 'hidden'}">
                        <label class="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                            <ion-icon name="arrow-forward-outline" class="mr-1"></ion-icon>Conta destino *
                        </label>
                        <select name="to_account" id="tx-to-account-sel"
                            class="w-full px-4 py-3 rounded-xl border border-blue-200 dark:border-blue-700 bg-white dark:bg-earth-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                            <option value="">Selecione a conta destino</option>
                            ${toAccountOptions}
                        </select>
                    </div>

                    ${isEdit && isInstallment ? `
                    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300">
                        <ion-icon name="information-circle-outline" class="mr-1"></ion-icon>
                        Esta é a parcela <strong>${t.installment_current}/${t.installment_total}</strong>. Apenas ela será alterada.
                    </div>` : ''}

                    <p id="tx-modal-error" class="text-red-500 text-sm hidden"></p>
                </form>
            `,
            footer: `
                ${deleteBtn}
                <button type="button" id="tx-modal-cancel"
                    class="px-5 py-2.5 rounded-xl border border-earth-200 dark:border-earth-700 text-earth-700 dark:text-earth-300
                           hover:bg-earth-50 dark:hover:bg-earth-800 transition-colors font-medium">
                    Cancelar
                </button>
                <button type="submit" form="tx-modal-form" id="tx-modal-submit"
                    class="px-5 py-2.5 bg-forest-600 hover:bg-forest-700 text-white rounded-xl font-medium transition-all">
                    ${isEdit ? 'Salvar Alterações' : 'Registrar'}
                </button>
            `,
        });

        // ── Helpers de visibilidade ───────────────────────────────────────────
        function _updateVisibilityForType(type) {
            const isT = type === 'TRANSFER';
            document.getElementById('tx-method-date-row').classList.toggle('hidden', isT);
            document.getElementById('tx-date-transfer-row').classList.toggle('hidden', !isT);
            document.getElementById('tx-to-account-row').classList.toggle('hidden', !isT);
            document.getElementById('tx-category-col').classList.toggle('hidden', isT);
            document.getElementById('tx-installment-row').classList.add('hidden');
            const checkRow = document.getElementById('tx-installment-check-row');
            if (checkRow) checkRow.classList.toggle('hidden', isT);
            const chk = document.getElementById('tx-installment-check');
            if (chk) chk.checked = false;

            // Ajusta label da conta
            document.getElementById('tx-account-label').textContent = isT ? 'Conta origem' : 'Conta';

            // Required dinâmico nos campos de data
            document.getElementById('tx-date-main').required = !isT;
            document.getElementById('tx-date-transfer').required = isT;
        }

        // Toggle tipo
        document.getElementById('tx-type-sel').addEventListener('change', e => {
            _updateVisibilityForType(e.target.value);
        });

        // Checkbox parcelado — mostra/oculta o campo de número de parcelas
        const installmentCheck = document.getElementById('tx-installment-check');
        if (installmentCheck) {
            installmentCheck.addEventListener('change', e => {
                document.getElementById('tx-installment-row').classList.toggle('hidden', !e.target.checked);
            });
        }

        document.getElementById('tx-modal-cancel').addEventListener('click', () => modal.close());

        if (isEdit) {
            document.getElementById('tx-modal-delete').addEventListener('click', async () => {
                if (!confirm('Excluir esta transação?')) return;
                try {
                    await api.finance.transactions.delete(t.id);
                    modal.close();
                    if (onSaved) onSaved();
                } catch (err) {
                    alert('Erro ao excluir: ' + err.message);
                }
            });
        }

        document.getElementById('tx-modal-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            const errorEl   = document.getElementById('tx-modal-error');
            const submitBtn = document.getElementById('tx-modal-submit');

            const currentType = document.getElementById('tx-type-sel').value;
            const isTransferNow = currentType === 'TRANSFER';

            // Limpa campos não relevantes por tipo
            if (!data.category) delete data.category;
            if (isEdit) delete data.installments;
            if (isTransferNow) {
                delete data.category;
                delete data.method;
                data.installments = 1;
                // Sincroniza o campo de data correto
                data.date = document.getElementById('tx-date-transfer').value;
                if (!data.to_account) {
                    errorEl.textContent = 'Selecione a conta destino para a transferência.';
                    errorEl.classList.remove('hidden');
                    return;
                }
                if (data.account === data.to_account) {
                    errorEl.textContent = 'A conta de origem e destino não podem ser iguais.';
                    errorEl.classList.remove('hidden');
                    return;
                }
            } else {
                delete data.to_account;
                // Sincroniza o campo de data correto
                data.date = document.getElementById('tx-date-main').value;
                // Se parcelas ocultas, força 1
                const installmentRow = document.getElementById('tx-installment-row');
                if (installmentRow && installmentRow.classList.contains('hidden')) {
                    data.installments = 1;
                }
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Salvando...';

            try {
                if (isEdit) {
                    await api.finance.transactions.update(t.id, data);
                } else {
                    await api.finance.transactions.create(data);
                }
                modal.close();
                if (onSaved) onSaved();
            } catch (err) {
                errorEl.textContent = err.message;
                errorEl.classList.remove('hidden');
                submitBtn.disabled = false;
                submitBtn.textContent = isEdit ? 'Salvar Alterações' : 'Registrar';
            }
        });
    },
};
