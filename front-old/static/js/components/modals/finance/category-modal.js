// components/modals/finance/category-modal.js - Modal de criação/edição de categoria
// Depende de: modal.js, api/index.js

const CATEGORY_ICONS = [
    { value: 'cart-outline',            label: 'Mercado' },
    { value: 'restaurant-outline',      label: 'Alimentação' },
    { value: 'car-outline',             label: 'Transporte' },
    { value: 'home-outline',            label: 'Moradia' },
    { value: 'medical-outline',         label: 'Saúde' },
    { value: 'school-outline',          label: 'Educação' },
    { value: 'shirt-outline',           label: 'Roupas' },
    { value: 'game-controller-outline', label: 'Lazer' },
    { value: 'airplane-outline',        label: 'Viagem' },
    { value: 'phone-portrait-outline',  label: 'Tecnologia' },
    { value: 'barbell-outline',         label: 'Academia' },
    { value: 'paw-outline',             label: 'Pet' },
    { value: 'cash-outline',            label: 'Salário' },
    { value: 'trending-up-outline',     label: 'Investimento' },
    { value: 'gift-outline',            label: 'Presente' },
    { value: 'wifi-outline',            label: 'Internet' },
    { value: 'tv-outline',              label: 'Streaming' },
    { value: 'pricetag-outline',        label: 'Geral' },
    { value: 'build-outline',           label: 'Serviços' },
    { value: 'card-outline',            label: 'Financeiro' },
];

const CATEGORY_COLORS = [
    '#16a34a', '#22c55e', '#0ea5e9', '#3b82f6', '#8b5cf6',
    '#ec4899', '#f97316', '#eab308', '#ef4444', '#14b8a6',
    '#f43f5e', '#a855f7', '#06b6d4', '#84cc16', '#6366f1',
];

const categoryModal = {
    /**
     * @param {object}   opts
     * @param {object}   [opts.category]  - Categoria existente para edição
     * @param {Function} [opts.onSaved]   - Callback após salvar/excluir
     */
    open({ category = null, onSaved } = {}) {
        const isEdit = !!category;
        const cat = category || {};

        const selectedColor = cat.color || CATEGORY_COLORS[0];
        const selectedIcon  = cat.icon  || CATEGORY_ICONS[CATEGORY_ICONS.length - 1].value;

        const colorSwatches = CATEGORY_COLORS.map(c => `
            <button type="button" data-color="${c}"
                class="cat-color-swatch w-8 h-8 rounded-full border-2 transition-all ${c === selectedColor ? 'border-earth-800 dark:border-white scale-110' : 'border-transparent'}"
                style="background:${c}"></button>
        `).join('');

        const iconButtons = CATEGORY_ICONS.map(ic => `
            <button type="button" data-icon="${ic.value}"
                class="cat-icon-btn flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-earth-600 dark:text-earth-300
                    ${ic.value === selectedIcon ? 'border-forest-500 bg-forest-50 dark:bg-forest-900/30' : 'border-transparent hover:border-earth-300 dark:hover:border-earth-600'}"
                title="${ic.label}">
                <ion-icon name="${ic.value}" class="text-xl"></ion-icon>
                <span class="text-[9px] leading-tight text-center">${ic.label}</span>
            </button>
        `).join('');

        const deleteBtn = isEdit ? `
            <button type="button" id="cat-modal-delete"
                class="mr-auto px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400
                       hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors font-medium text-sm">
                <ion-icon name="trash-outline" class="mr-1"></ion-icon>Excluir
            </button>` : '';

        modal.open({
            title: isEdit ? 'Editar Categoria' : 'Nova Categoria',
            size: 'lg',
            body: `
                <form id="cat-modal-form" class="space-y-5">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Nome *</label>
                            <input type="text" name="name" value="${cat.name || ''}" required
                                class="w-full px-4 py-3 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none transition-all"
                                placeholder="Ex: Alimentação, Salário...">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Tipo</label>
                            <select name="type"
                                class="w-full px-4 py-3 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none transition-all">
                                <option value="EXPENSE" ${(!cat.type || cat.type === 'EXPENSE') ? 'selected' : ''}>Despesa</option>
                                <option value="INCOME"  ${cat.type === 'INCOME' ? 'selected' : ''}>Receita</option>
                                <option value="BOTH"    ${cat.type === 'BOTH'   ? 'selected' : ''}>Ambos</option>
                            </select>
                        </div>
                    </div>

                    <!-- Cor -->
                    <div>
                        <label class="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-2">Cor</label>
                        <div class="flex gap-2 flex-wrap" id="cat-color-swatches">${colorSwatches}</div>
                        <input type="hidden" name="color" id="cat-color-input" value="${selectedColor}">
                    </div>

                    <!-- Ícone -->
                    <div>
                        <label class="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-2">Ícone</label>
                        <div class="grid grid-cols-5 gap-1.5 max-h-40 overflow-y-auto pr-1" id="cat-icon-buttons">${iconButtons}</div>
                        <input type="hidden" name="icon" id="cat-icon-input" value="${selectedIcon}">
                    </div>

                    <!-- Preview -->
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center text-white" id="cat-preview-bubble" style="background:${selectedColor}">
                            <ion-icon name="${selectedIcon}" id="cat-preview-icon" class="text-lg"></ion-icon>
                        </div>
                        <span id="cat-preview-name" class="font-semibold text-earth-700 dark:text-earth-300">${cat.name || 'Nome da categoria'}</span>
                    </div>

                    <p id="cat-modal-error" class="text-red-500 text-sm hidden"></p>
                </form>
            `,
            footer: `
                ${deleteBtn}
                <button type="button" id="cat-modal-cancel"
                    class="px-5 py-2.5 rounded-xl border border-earth-200 dark:border-earth-700 text-earth-700 dark:text-earth-300
                           hover:bg-earth-50 dark:hover:bg-earth-800 transition-colors font-medium">
                    Cancelar
                </button>
                <button type="submit" form="cat-modal-form" id="cat-modal-submit"
                    class="px-5 py-2.5 bg-forest-600 hover:bg-forest-700 text-white rounded-xl font-medium transition-all">
                    ${isEdit ? 'Salvar Alterações' : 'Criar Categoria'}
                </button>
            `,
        });

        document.getElementById('cat-color-swatches').addEventListener('click', e => {
            const btn = e.target.closest('[data-color]');
            if (!btn) return;
            const color = btn.dataset.color;
            document.getElementById('cat-color-input').value = color;
            document.querySelectorAll('.cat-color-swatch').forEach(b => {
                b.classList.toggle('border-earth-800', b.dataset.color === color);
                b.classList.toggle('dark:border-white', b.dataset.color === color);
                b.classList.toggle('scale-110', b.dataset.color === color);
                b.classList.toggle('border-transparent', b.dataset.color !== color);
            });
            document.getElementById('cat-preview-bubble').style.background = color;
        });

        document.getElementById('cat-icon-buttons').addEventListener('click', e => {
            const btn = e.target.closest('[data-icon]');
            if (!btn) return;
            const icon = btn.dataset.icon;
            document.getElementById('cat-icon-input').value = icon;
            document.querySelectorAll('.cat-icon-btn').forEach(b => {
                const active = b.dataset.icon === icon;
                b.classList.toggle('border-forest-500', active);
                b.classList.toggle('bg-forest-50', active);
                b.classList.toggle('dark:bg-forest-900/30', active);
                b.classList.toggle('border-transparent', !active);
            });
            document.getElementById('cat-preview-icon').setAttribute('name', icon);
        });

        document.querySelector('#cat-modal-form [name="name"]').addEventListener('input', e => {
            document.getElementById('cat-preview-name').textContent = e.target.value || 'Nome da categoria';
        });

        document.getElementById('cat-modal-cancel').addEventListener('click', () => modal.close());

        if (isEdit) {
            document.getElementById('cat-modal-delete').addEventListener('click', async () => {
                if (!confirm('Excluir esta categoria?')) return;
                try {
                    await api.finance.categories.delete(cat.id);
                    modal.close();
                    if (onSaved) onSaved();
                } catch (err) {
                    alert('Erro ao excluir: ' + err.message);
                }
            });
        }

        document.getElementById('cat-modal-form').addEventListener('submit', async e => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target).entries());
            const errorEl   = document.getElementById('cat-modal-error');
            const submitBtn = document.getElementById('cat-modal-submit');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Salvando...';
            try {
                if (isEdit) {
                    await api.finance.categories.update(cat.id, data);
                } else {
                    await api.finance.categories.create(data);
                }
                modal.close();
                if (onSaved) onSaved();
            } catch (err) {
                errorEl.textContent = err.message;
                errorEl.classList.remove('hidden');
                submitBtn.disabled = false;
                submitBtn.textContent = isEdit ? 'Salvar Alterações' : 'Criar Categoria';
            }
        });
    },
};
