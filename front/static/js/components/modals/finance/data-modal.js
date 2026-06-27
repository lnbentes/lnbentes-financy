
const financeDataModal = (() => {
    let _onDone = null;

    function _render() {
        const accounts = state.accounts || [];
        const now = new Date();
        const yearRange = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 2 + i);

        const accountOptions = accounts.map(a =>
            `<option value="${a.id}">${a.name}</option>`
        ).join('');

        const yearOptions = yearRange.map(y => `<option value="${y}">${y}</option>`).join('');
        const monthOptions = PT_MONTHS.map((m, i) =>
            `<option value="${i + 1}">${m}</option>`
        ).join('');

        return `
        <div id="finance-data-modal-overlay"
             class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div class="bg-white dark:bg-earth-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">

            <!-- Cabeçalho -->
            <div class="flex items-center justify-between p-5 border-b border-earth-200 dark:border-earth-700">
              <h2 class="text-lg font-bold flex items-center gap-2">
                <ion-icon name="server-outline" class="text-forest-600"></ion-icon>
                Gerenciar Dados Financeiros
              </h2>
              <button id="fdm-close" class="p-1.5 rounded-lg hover:bg-earth-100 dark:hover:bg-earth-800 transition-colors">
                <ion-icon name="close-outline" class="text-xl"></ion-icon>
              </button>
            </div>

            <!-- Corpo -->
            <div class="p-5 space-y-6">

              <!-- Filtros comuns -->
              <div class="bg-earth-50 dark:bg-earth-800/50 rounded-xl p-4 space-y-3">
                <h3 class="text-sm font-semibold text-earth-600 dark:text-earth-400 uppercase tracking-wide">
                  Escopo dos dados
                </h3>

                <!-- Contas -->
                <div>
                  <label class="block text-xs font-medium text-earth-600 dark:text-earth-400 mb-1">
                    Contas (deixe vazio para todas)
                  </label>
                  <select id="fdm-accounts" multiple
                    class="w-full px-3 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-900 text-sm focus:ring-2 focus:ring-forest-500 outline-none min-h-[70px]">
                    ${accountOptions}
                  </select>
                  <p class="text-[10px] text-earth-400 mt-1">Ctrl+clique para selecionar várias</p>
                </div>

                <!-- Período -->
                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <label class="block text-xs font-medium text-earth-600 dark:text-earth-400 mb-1">Período</label>
                    <select id="fdm-scope"
                      class="w-full px-3 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-900 text-sm focus:ring-2 focus:ring-forest-500 outline-none">
                      <option value="all">Tudo</option>
                      <option value="year">Ano</option>
                      <option value="month">Mês/Ano</option>
                    </select>
                  </div>
                  <div id="fdm-year-wrap" class="hidden">
                    <label class="block text-xs font-medium text-earth-600 dark:text-earth-400 mb-1">Ano</label>
                    <select id="fdm-year"
                      class="w-full px-3 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-900 text-sm focus:ring-2 focus:ring-forest-500 outline-none">
                      ${yearOptions}
                    </select>
                  </div>
                  <div id="fdm-month-wrap" class="hidden">
                    <label class="block text-xs font-medium text-earth-600 dark:text-earth-400 mb-1">Mês</label>
                    <select id="fdm-month"
                      class="w-full px-3 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-900 text-sm focus:ring-2 focus:ring-forest-500 outline-none">
                      ${monthOptions}
                    </select>
                  </div>
                </div>
              </div>

              <!-- Exportar -->
              <div class="border border-earth-200 dark:border-earth-700 rounded-xl p-4 space-y-2">
                <h3 class="font-semibold flex items-center gap-2">
                  <ion-icon name="download-outline" class="text-forest-600"></ion-icon>
                  Exportar dados
                </h3>
                <p class="text-xs text-earth-500">
                  Baixa um arquivo <code class="bg-earth-100 dark:bg-earth-800 px-1 rounded">.json</code>
                  com contas, categorias e transações conforme o escopo selecionado.
                </p>
                <button id="fdm-btn-export"
                  class="w-full flex items-center justify-center gap-2 bg-forest-600 hover:bg-forest-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                  <ion-icon name="download-outline"></ion-icon>
                  Baixar JSON
                </button>
              </div>

              <!-- Importar -->
              <div class="border border-earth-200 dark:border-earth-700 rounded-xl p-4 space-y-3">
                <h3 class="font-semibold flex items-center gap-2">
                  <ion-icon name="cloud-upload-outline" class="text-blue-600"></ion-icon>
                  Importar dados
                </h3>

                <!-- Abas: Arquivo / Colar JSON -->
                <div class="flex rounded-xl overflow-hidden border border-earth-200 dark:border-earth-700 text-xs font-semibold">
                  <button id="fdm-tab-file" data-tab="file"
                    class="fdm-tab flex-1 py-2 transition-colors bg-blue-600 text-white">
                    Arquivo .json
                  </button>
                  <button id="fdm-tab-paste" data-tab="paste"
                    class="fdm-tab flex-1 py-2 transition-colors text-earth-600 dark:text-earth-400 hover:bg-earth-100 dark:hover:bg-earth-800">
                    Colar / API
                  </button>
                </div>

                <!-- Painel: Arquivo -->
                <div id="fdm-panel-file" class="space-y-2">
                  <p class="text-xs text-earth-500">
                    Selecione um <code class="bg-earth-100 dark:bg-earth-800 px-1 rounded">.json</code>
                    exportado aqui ou qualquer JSON no formato de exportação.
                    Contas e categorias que já existem não são duplicadas. Transações são sempre inseridas.
                  </p>
                  <label
                    class="flex items-center justify-center gap-2 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl py-5 cursor-pointer hover:border-blue-500 transition-colors"
                    for="fdm-file-input">
                    <ion-icon name="cloud-upload-outline" class="text-2xl text-blue-400"></ion-icon>
                    <span id="fdm-file-label" class="text-sm text-blue-500">Clique para selecionar o arquivo</span>
                    <input id="fdm-file-input" type="file" accept=".json,application/json" class="hidden">
                  </label>
                  <button id="fdm-btn-import-file" disabled
                    class="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                    <ion-icon name="cloud-upload-outline"></ion-icon>
                    Importar arquivo
                  </button>
                </div>

                <!-- Painel: Colar JSON -->
                <div id="fdm-panel-paste" class="space-y-2 hidden">
                  <p class="text-xs text-earth-500">
                    Cole diretamente um array de transações
                    <code class="bg-earth-100 dark:bg-earth-800 px-1 rounded">[{...}, {...}]</code>
                    ou o formato completo de exportação. Ideal para integrações e envios em lote via API.
                  </p>
                  <textarea id="fdm-paste-input" rows="8" placeholder='[
  {
    "description": "Salário",
    "amount": 3000,
    "type": "INCOME",
    "method": "PIX",
    "account_name": "Banco X",
    "category_name": "Salário",
    "date": "2026-04-01"
  }
]'
                    class="w-full px-3 py-2.5 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-900 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none resize-y"></textarea>
                  <p class="text-[10px] text-earth-400">
                    Campos obrigatórios por transação:
                    <code class="bg-earth-100 dark:bg-earth-800 px-1 rounded">description</code>,
                    <code class="bg-earth-100 dark:bg-earth-800 px-1 rounded">amount</code>,
                    <code class="bg-earth-100 dark:bg-earth-800 px-1 rounded">type</code>
                    (INCOME/EXPENSE/TRANSFER),
                    <code class="bg-earth-100 dark:bg-earth-800 px-1 rounded">account_name</code>,
                    <code class="bg-earth-100 dark:bg-earth-800 px-1 rounded">date</code> (YYYY-MM-DD).
                  </p>
                  <button id="fdm-btn-import-paste"
                    class="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                    <ion-icon name="cloud-upload-outline"></ion-icon>
                    Importar JSON
                  </button>
                </div>

                <div id="fdm-import-result" class="hidden text-xs rounded-xl p-3 space-y-1"></div>
              </div>

              <!-- Excluir em lote -->
              <div class="border border-red-200 dark:border-red-800 rounded-xl p-4 space-y-2">
                <h3 class="font-semibold flex items-center gap-2 text-red-600 dark:text-red-400">
                  <ion-icon name="trash-outline"></ion-icon>
                  Excluir dados
                </h3>
                <p class="text-xs text-earth-500">
                  Remove permanentemente as transações do escopo selecionado e reverte os saldos das contas.
                  <strong class="text-red-500">Esta ação não pode ser desfeita.</strong>
                </p>
                <button id="fdm-btn-delete"
                  class="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                  <ion-icon name="trash-outline"></ion-icon>
                  Excluir transações
                </button>
              </div>

            </div>
          </div>
        </div>`;
    }

    // ── Helpers de filtro ─────────────────────────────────────────────────────

    function _getFilterParams() {
        const scope = document.getElementById('fdm-scope').value;
        const rawIds = Array.from(document.getElementById('fdm-accounts').selectedOptions)
            .map(o => o.value);
        const account_ids = rawIds.length ? rawIds : null;
        const year = (scope === 'year' || scope === 'month')
            ? parseInt(document.getElementById('fdm-year').value) : null;
        const month = scope === 'month'
            ? parseInt(document.getElementById('fdm-month').value) : null;
        return { account_ids, year, month };
    }

    function _buildExportUrl({ account_ids, year, month }) {
        const params = {};
        if (account_ids?.length) params.account_ids = account_ids.join(',');
        if (year) params.year = year;
        if (month) params.month = month;
        return api.finance.transactions.export(params);
    }

    // ── Helpers de resultado de importação ────────────────────────────────────

    function _showImportResult(result) {
        const box = document.getElementById('fdm-import-result');
        box.className = 'text-xs rounded-xl p-3 space-y-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800';
        box.innerHTML = `
          <p class="font-semibold text-green-700 dark:text-green-300 flex items-center gap-1">
            <ion-icon name="checkmark-circle-outline"></ion-icon> Importação concluída
          </p>
          <p class="text-green-600 dark:text-green-400">Contas criadas: <strong>${result.accounts_created}</strong></p>
          <p class="text-green-600 dark:text-green-400">Categorias criadas: <strong>${result.categories_created}</strong></p>
          <p class="text-green-600 dark:text-green-400">Transações importadas: <strong>${result.transactions_created}</strong></p>
          ${result.errors.length
            ? `<details class="mt-1"><summary class="cursor-pointer text-amber-600">${result.errors.length} aviso(s)</summary>
               <ul class="mt-1 space-y-0.5">${result.errors.map(e => `<li class="text-amber-600">• ${e}</li>`).join('')}</ul>
               </details>`
            : ''}
        `;
        box.classList.remove('hidden');
    }

    function _showImportError(msg) {
        const box = document.getElementById('fdm-import-result');
        box.className = 'text-xs rounded-xl p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400';
        box.textContent = 'Erro: ' + msg;
        box.classList.remove('hidden');
    }

    // ── Bind de eventos do modal ──────────────────────────────────────────────

    function _bindEvents() {
        // Fechar
        document.getElementById('fdm-close').addEventListener('click', close);
        document.getElementById('finance-data-modal-overlay').addEventListener('click', e => {
            if (e.target === e.currentTarget) close();
        });

        // Controle de período
        document.getElementById('fdm-scope').addEventListener('change', e => {
            const v = e.target.value;
            document.getElementById('fdm-year-wrap').classList.toggle('hidden', v === 'all');
            document.getElementById('fdm-month-wrap').classList.toggle('hidden', v !== 'month');
        });

        // Seleção de arquivo para import
        document.getElementById('fdm-file-input').addEventListener('change', e => {
            const file = e.target.files[0];
            const label = document.getElementById('fdm-file-label');
            const btn = document.getElementById('fdm-btn-import');
            if (file) {
                label.textContent = file.name;
                btn.disabled = false;
            } else {
                label.textContent = 'Clique para selecionar o arquivo';
                btn.disabled = true;
            }
            document.getElementById('fdm-import-result').classList.add('hidden');
        });

        // Exportar — abre URL de download
        document.getElementById('fdm-btn-export').addEventListener('click', () => {
            const params = _getFilterParams();
            const url = _buildExportUrl(params);
            window.location.href = url;
        });

        // ── Abas Arquivo / Colar JSON ─────────────────────────────────────────
        document.querySelectorAll('.fdm-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const selected = tab.dataset.tab;
                document.querySelectorAll('.fdm-tab').forEach(t => {
                    const active = t.dataset.tab === selected;
                    t.classList.toggle('bg-blue-600', active);
                    t.classList.toggle('text-white', active);
                    t.classList.toggle('text-earth-600', !active);
                    t.classList.toggle('dark:text-earth-400', !active);
                    t.classList.toggle('hover:bg-earth-100', !active);
                });
                document.getElementById('fdm-panel-file').classList.toggle('hidden', selected !== 'file');
                document.getElementById('fdm-panel-paste').classList.toggle('hidden', selected !== 'paste');
                document.getElementById('fdm-import-result').classList.add('hidden');
            });
        });

        // Seleção de arquivo para import
        document.getElementById('fdm-file-input').addEventListener('change', e => {
            const file = e.target.files[0];
            const label = document.getElementById('fdm-file-label');
            const btn = document.getElementById('fdm-btn-import-file');
            if (file) {
                label.textContent = file.name;
                btn.disabled = false;
            } else {
                label.textContent = 'Clique para selecionar o arquivo';
                btn.disabled = true;
            }
            document.getElementById('fdm-import-result').classList.add('hidden');
        });

        // Importar — via arquivo
        document.getElementById('fdm-btn-import-file').addEventListener('click', async () => {
            const file = document.getElementById('fdm-file-input').files[0];
            if (!file) return;
            const btn = document.getElementById('fdm-btn-import-file');
            btn.disabled = true;
            btn.innerHTML = '<ion-icon name="hourglass-outline"></ion-icon> Importando…';
            document.getElementById('fdm-import-result').classList.add('hidden');

            try {
                const formData = new FormData();
                formData.append('file', file);
                const result = await api.finance.transactions.import(formData);
                _showImportResult(result);
                if (_onDone) _onDone();
            } catch (err) {
                _showImportError(err.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<ion-icon name="cloud-upload-outline"></ion-icon> Importar arquivo';
            }
        });

        // Importar — via JSON colado
        document.getElementById('fdm-btn-import-paste').addEventListener('click', async () => {
            const raw = document.getElementById('fdm-paste-input').value.trim();
            if (!raw) return;

            let parsed;
            try {
                parsed = JSON.parse(raw);
            } catch {
                _showImportError('JSON inválido. Verifique a sintaxe e tente novamente.');
                return;
            }

            const btn = document.getElementById('fdm-btn-import-paste');
            btn.disabled = true;
            btn.innerHTML = '<ion-icon name="hourglass-outline"></ion-icon> Importando…';
            document.getElementById('fdm-import-result').classList.add('hidden');

            try {
                const result = await api.finance.transactions.importJson(parsed);
                _showImportResult(result);
                if (_onDone) _onDone();
            } catch (err) {
                _showImportError(err.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<ion-icon name="cloud-upload-outline"></ion-icon> Importar JSON';
            }
        });

        // Excluir em lote
        document.getElementById('fdm-btn-delete').addEventListener('click', async () => {
            const { account_ids, year, month } = _getFilterParams();
            let msg = 'Confirma a exclusão das transações';
            if (year && month) msg += ` de ${PT_MONTHS[month - 1]}/${year}`;
            else if (year) msg += ` do ano ${year}`;
            else msg += ' de todo o período';
            if (account_ids?.length) msg += ` nas ${account_ids.length} conta(s) selecionada(s)`;
            msg += '?\n\nEsta ação não pode ser desfeita.';

            if (!confirm(msg)) return;
            const btn = document.getElementById('fdm-btn-delete');
            btn.disabled = true;
            btn.innerHTML = '<ion-icon name="hourglass-outline"></ion-icon> Excluindo…';

            try {
                const result = await api.finance.transactions.bulkDelete({ account_ids, year, month });
                alert(`${result.deleted} transação(ões) excluída(s) com sucesso.`);
                if (_onDone) _onDone();
                close();
            } catch (err) {
                alert('Erro ao excluir: ' + err.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<ion-icon name="trash-outline"></ion-icon> Excluir transações';
            }
        });
    }

    // ── API pública ───────────────────────────────────────────────────────────

    function open({ onDone } = {}) {
        _onDone = onDone || null;
        document.body.insertAdjacentHTML('beforeend', _render());
        _bindEvents();

        // Pré-selecionar ano atual
        const nowYear = new Date().getFullYear();
        const yearSel = document.getElementById('fdm-year');
        if (yearSel) {
            const opt = [...yearSel.options].find(o => parseInt(o.value) === nowYear);
            if (opt) opt.selected = true;
        }
        // Pré-selecionar mês atual
        const nowMonth = new Date().getMonth() + 1;
        const monthSel = document.getElementById('fdm-month');
        if (monthSel) {
            const opt = [...monthSel.options].find(o => parseInt(o.value) === nowMonth);
            if (opt) opt.selected = true;
        }
    }

    function close() {
        const overlay = document.getElementById('finance-data-modal-overlay');
        if (overlay) overlay.remove();
    }

    return { open, close };
})();
