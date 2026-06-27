// components/modals/finance/account-modal.js - Modal de criação/edição de conta bancária
// Depende de: modal.js, api/index.js

const ACCOUNT_ICONS = [
    { value: 'wallet-outline',         label: 'Carteira' },
    { value: 'card-outline',           label: 'Cartão' },
    { value: 'business-outline',       label: 'Banco' },
    { value: 'cash-outline',           label: 'Dinheiro' },
    { value: 'trending-up-outline',    label: 'Investimento' },
    { value: 'phone-portrait-outline', label: 'Digital' },
    { value: 'globe-outline',          label: 'Internacional' },
    { value: 'home-outline',           label: 'Casa' },
    { value: 'briefcase-outline',      label: 'Empresa' },
    { value: 'star-outline',           label: 'Favorita' },
];

const ACCOUNT_COLORS = [
    '#16a34a', '#22c55e', '#0ea5e9', '#3b82f6', '#8b5cf6',
    '#ec4899', '#f97316', '#eab308', '#ef4444', '#6b7280',
];

const accountModal = {
    /**
     * @param {object}   opts
     * @param {object}   [opts.account]  - Conta existente para edição
     * @param {Function} [opts.onSaved]  - Callback após salvar/excluir
     */
    open({ account = null, onSaved } = {}) {
        const isEdit = !!account;
        const acc = account || {};

        const selectedColor = acc.color || ACCOUNT_COLORS[0];
        const selectedIcon  = acc.icon  || ACCOUNT_ICONS[0].value;

        const colorSwatches = ACCOUNT_COLORS.map(c => `
            <button type="button" data-color="${c}"
                class="color-swatch w-8 h-8 rounded-full border-2 transition-all ${c === selectedColor ? 'border-earth-800 dark:border-white scale-110' : 'border-transparent'}"
                style="background:${c}"></button>
        `).join('');

        const iconButtons = ACCOUNT_ICONS.map(ic => `
            <button type="button" data-icon="${ic.value}"
                class="icon-btn flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-earth-600 dark:text-earth-300
                    ${ic.value === selectedIcon ? 'border-forest-500 bg-forest-50 dark:bg-forest-900/30' : 'border-transparent hover:border-earth-300 dark:hover:border-earth-600'}"
                title="${ic.label}">
                <ion-icon name="${ic.value}" class="text-xl"></ion-icon>
                <span class="text-[10px] leading-tight text-center">${ic.label}</span>
            </button>
        `).join('');

        const deleteBtn = isEdit ? `
            <button type="button" id="acc-modal-delete"
                class="mr-auto px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400
                       hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors font-medium text-sm">
                <ion-icon name="trash-outline" class="mr-1"></ion-icon>Excluir
            </button>` : '';

        modal.open({
            title: isEdit ? 'Editar Conta' : 'Nova Conta',
            body: `
                <form id="acc-modal-form" class="space-y-5">
                    <div>
                        <label class="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Nome da conta *</label>
                        <input type="text" name="name" value="${acc.name || ''}" required
                            class="w-full px-4 py-3 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none transition-all"
                            placeholder="Ex: Nubank, Carteira, Caixa...">
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Tipo</label>
                            <select name="type"
                                class="w-full px-4 py-3 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none transition-all">
                                <option value="BANK"       ${acc.type === 'BANK'       ? 'selected' : ''}>Banco</option>
                                <option value="WALLET"     ${acc.type === 'WALLET'     ? 'selected' : ''}>Carteira</option>
                                <option value="INVESTMENT" ${acc.type === 'INVESTMENT' ? 'selected' : ''}>Investimento</option>
                                <option value="CREDIT"     ${acc.type === 'CREDIT'     ? 'selected' : ''}>Cartão de Crédito</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Saldo inicial (R$)</label>
                            <input type="number" name="balance" step="0.01" value="${acc.balance || 0}"
                                class="w-full px-4 py-3 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none transition-all">
                        </div>
                    </div>

                    <!-- Cor -->
                    <div>
                        <label class="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-2">Cor</label>
                        <div class="flex gap-2 flex-wrap" id="acc-color-swatches">${colorSwatches}</div>
                        <input type="hidden" name="color" id="acc-color-input" value="${selectedColor}">
                    </div>

                    <!-- Ícone -->
                    <div>
                        <label class="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-2">Ícone</label>
                        <div class="grid grid-cols-5 gap-2" id="acc-icon-buttons">${iconButtons}</div>
                        <input type="hidden" name="icon" id="acc-icon-input" value="${selectedIcon}">
                    </div>

                    <!-- Preview -->
                    <div class="flex items-center gap-4 p-4 rounded-2xl text-white" id="acc-preview" style="background:linear-gradient(135deg,${selectedColor}cc,${selectedColor}66)">
                        <ion-icon name="${selectedIcon}" id="acc-preview-icon" class="text-2xl"></ion-icon>
                        <div>
                            <p class="text-xs opacity-80 font-medium">Pré-visualização</p>
                            <p id="acc-preview-name" class="font-bold">${acc.name || 'Nome da conta'}</p>
                        </div>
                    </div>

                    <p id="acc-modal-error" class="text-red-500 text-sm hidden"></p>
                </form>
            `,
            footer: `
                ${deleteBtn}
                <button type="button" id="acc-modal-cancel"
                    class="px-5 py-2.5 rounded-xl border border-earth-200 dark:border-earth-700 text-earth-700 dark:text-earth-300
                           hover:bg-earth-50 dark:hover:bg-earth-800 transition-colors font-medium">
                    Cancelar
                </button>
                <button type="submit" form="acc-modal-form" id="acc-modal-submit"
                    class="px-5 py-2.5 bg-forest-600 hover:bg-forest-700 text-white rounded-xl font-medium transition-all">
                    ${isEdit ? 'Salvar Alterações' : 'Criar Conta'}
                </button>
            `,
        });

        document.getElementById('acc-color-swatches').addEventListener('click', e => {
            const btn = e.target.closest('[data-color]');
            if (!btn) return;
            const color = btn.dataset.color;
            document.getElementById('acc-color-input').value = color;
            document.querySelectorAll('.color-swatch').forEach(b => {
                b.classList.toggle('border-earth-800', b.dataset.color === color);
                b.classList.toggle('dark:border-white', b.dataset.color === color);
                b.classList.toggle('scale-110', b.dataset.color === color);
                b.classList.toggle('border-transparent', b.dataset.color !== color);
            });
            document.getElementById('acc-preview').style.background = `linear-gradient(135deg,${color}cc,${color}66)`;
        });

        document.getElementById('acc-icon-buttons').addEventListener('click', e => {
            const btn = e.target.closest('[data-icon]');
            if (!btn) return;
            const icon = btn.dataset.icon;
            document.getElementById('acc-icon-input').value = icon;
            document.querySelectorAll('.icon-btn').forEach(b => {
                const active = b.dataset.icon === icon;
                b.classList.toggle('border-forest-500', active);
                b.classList.toggle('bg-forest-50', active);
                b.classList.toggle('dark:bg-forest-900/30', active);
                b.classList.toggle('border-transparent', !active);
            });
            document.getElementById('acc-preview-icon').setAttribute('name', icon);
        });

        document.querySelector('#acc-modal-form [name="name"]').addEventListener('input', e => {
            document.getElementById('acc-preview-name').textContent = e.target.value || 'Nome da conta';
        });

        document.getElementById('acc-modal-cancel').addEventListener('click', () => modal.close());

        if (isEdit) {
            document.getElementById('acc-modal-delete').addEventListener('click', async () => {
                if (!confirm('Excluir esta conta? Todas as transações vinculadas serão removidas.')) return;
                try {
                    await api.finance.accounts.delete(acc.id);
                    modal.close();
                    if (onSaved) onSaved();
                } catch (err) {
                    alert('Erro ao excluir: ' + err.message);
                }
            });
        }

        document.getElementById('acc-modal-form').addEventListener('submit', async e => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target).entries());
            const errorEl   = document.getElementById('acc-modal-error');
            const submitBtn = document.getElementById('acc-modal-submit');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Salvando...';
            try {
                if (isEdit) {
                    await api.finance.accounts.update(acc.id, data);
                } else {
                    await api.finance.accounts.create(data);
                }
                modal.close();
                if (onSaved) onSaved();
            } catch (err) {
                errorEl.textContent = err.message;
                errorEl.classList.remove('hidden');
                submitBtn.disabled = false;
                submitBtn.textContent = isEdit ? 'Salvar Alterações' : 'Criar Conta';
            }
        });
    },
};
