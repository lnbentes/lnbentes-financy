import { useState, useEffect } from 'react';
import { useFinance } from '../FinanceContext';
import { financeService } from '../../../services/finance';
import { Modal } from './Modal';
import { Download, Upload, Trash2, AlertTriangle, FileJson, CheckCircle2 } from 'lucide-react';

const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function DataModal() {
  const { isDataModalOpen, setDataModalOpen, loadData, accounts } = useFinance();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filters
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const [scope, setScope] = useState<'all' | 'year' | 'month'>('all');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);

  // Import
  const [importTab, setImportTab] = useState<'file' | 'paste'>('file');
  const [pasteJson, setPasteJson] = useState('');
  const [pasteAccount, setPasteAccount] = useState<number | ''>('');
  const [importResult, setImportResult] = useState<any>(null);

  const yearRange = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 2 + i);

  useEffect(() => {
    if (isDataModalOpen) {
      setScope('all');
      setSelectedAccounts([]);
      setFilterYear(new Date().getFullYear());
      setFilterMonth(new Date().getMonth() + 1);
      setImportTab('file');
      setPasteJson('');
      setPasteAccount('');
      setImportResult(null);
      setError('');
    }
  }, [isDataModalOpen]);

  const getFilterParams = () => {
    return {
      account_ids: selectedAccounts.length ? selectedAccounts.join(',') : undefined,
      year: scope !== 'all' ? filterYear : undefined,
      month: scope === 'month' ? filterMonth : undefined,
    };
  };

  const handleExport = () => {
    const params = getFilterParams();
    window.open(financeService.transactions.export(params), '_blank');
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await financeService.transactions.import(formData);
      setImportResult(res.data || res);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao importar arquivo.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportPaste = async () => {
    if (!pasteJson.trim()) return;

    let rawStr = pasteJson.trim();
    if (!rawStr.startsWith('[')) {
      rawStr = `[${rawStr}]`;
    }

    let parsed;
    try {
      parsed = JSON.parse(rawStr);
    } catch (e) {
      setError('JSON inválido. Verifique a sintaxe e tente novamente.');
      return;
    }

    // Se houver uma conta selecionada, injeta em cada item
    if (pasteAccount) {
      const accName = accounts.find(a => a.id === pasteAccount)?.name;
      if (accName) {
        parsed = parsed.map((item: any) => ({ ...item, account_name: accName }));
      }
    }

    setLoading(true);
    setError('');
    setImportResult(null);

    try {
      const res = await financeService.transactions.importJson(parsed);
      setImportResult(res.data || res);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao importar JSON.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    const params = getFilterParams();
    
    let msg = 'Confirma a exclusão das transações';
    if (params.year && params.month) msg += ` de ${params.month}/${params.year}`;
    else if (params.year) msg += ` do ano ${params.year}`;
    else msg += ' de todo o período';
    if (selectedAccounts.length) msg += ` nas ${selectedAccounts.length} conta(s) selecionada(s)`;
    msg += '?\n\nEsta ação não pode ser desfeita.';

    if (!window.confirm(msg)) return;

    setLoading(true);
    setError('');
    setImportResult(null);

    try {
      const res = await financeService.transactions.bulkDelete(params);
      const data = res.data || res;
      alert(`${data.deleted || 0} transação(ões) excluída(s) com sucesso.`);
      await loadData();
      setDataModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions).map(opt => parseInt(opt.value));
    setSelectedAccounts(values);
  };

  return (
    <Modal 
      isOpen={isDataModalOpen} 
      onClose={() => setDataModalOpen(false)} 
      title="Gerenciamento de Dados"
    >
      <div className="space-y-6">
        {/* Filtros */}
        <div className="bg-earth-50 dark:bg-earth-800/50 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-earth-600 dark:text-earth-400 uppercase tracking-wide">
            Escopo dos dados
          </h3>

          <div>
            <label className="block text-xs font-medium text-earth-600 dark:text-earth-400 mb-1">
              Contas (deixe vazio para todas)
            </label>
            <select 
              multiple 
              value={selectedAccounts.map(String)}
              onChange={handleAccountSelect}
              className="w-full px-3 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-900 text-sm focus:ring-2 focus:ring-forest-500 outline-none min-h-[70px]"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-earth-400 mt-1">Ctrl+clique para selecionar várias</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-earth-600 dark:text-earth-400 mb-1">Período</label>
              <select 
                value={scope} onChange={e => setScope(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-900 text-sm focus:ring-2 focus:ring-forest-500 outline-none"
              >
                <option value="all">Tudo</option>
                <option value="year">Ano</option>
                <option value="month">Mês/Ano</option>
              </select>
            </div>
            
            {scope !== 'all' && (
              <div>
                <label className="block text-xs font-medium text-earth-600 dark:text-earth-400 mb-1">Ano</label>
                <select 
                  value={filterYear} onChange={e => setFilterYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-900 text-sm focus:ring-2 focus:ring-forest-500 outline-none"
                >
                  {yearRange.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            )}

            {scope === 'month' && (
              <div>
                <label className="block text-xs font-medium text-earth-600 dark:text-earth-400 mb-1">Mês</label>
                <select 
                  value={filterMonth} onChange={e => setFilterMonth(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-900 text-sm focus:ring-2 focus:ring-forest-500 outline-none"
                >
                  {MONTHS_PT.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}
        
        {importResult && (
          <div className="text-xs rounded-xl p-3 space-y-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <p className="font-semibold text-green-700 dark:text-green-300 flex items-center gap-1">
              <CheckCircle2 size={14} /> Importação concluída
            </p>
            <p className="text-green-600 dark:text-green-400">Contas criadas: <strong>{importResult.accounts_created}</strong></p>
            <p className="text-green-600 dark:text-green-400">Categorias criadas: <strong>{importResult.categories_created}</strong></p>
            <p className="text-green-600 dark:text-green-400">Transações importadas: <strong>{importResult.transactions_created}</strong></p>
            {importResult.errors && importResult.errors.length > 0 && (
              <details className="mt-1">
                <summary className="cursor-pointer text-amber-600">{importResult.errors.length} aviso(s)</summary>
                <ul className="mt-1 space-y-0.5">
                  {importResult.errors.map((e: string, i: number) => <li key={i} className="text-amber-600">• {e}</li>)}
                </ul>
              </details>
            )}
          </div>
        )}

        {/* Exportar */}
        <div className="border border-earth-200 dark:border-earth-700 rounded-xl p-4 space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Download size={18} className="text-forest-600" />
            Exportar dados
          </h3>
          <p className="text-xs text-earth-500">
            Baixa um arquivo <code className="bg-earth-100 dark:bg-earth-800 px-1 rounded">.json</code> com contas, categorias e transações conforme o escopo selecionado.
          </p>
          <button 
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 bg-forest-600 hover:bg-forest-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            <Download size={18} /> Baixar JSON
          </button>
        </div>

        {/* Importar */}
        <div className="border border-earth-200 dark:border-earth-700 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Upload size={18} className="text-blue-600" />
            Importar dados
          </h3>

          <div className="flex rounded-xl overflow-hidden border border-earth-200 dark:border-earth-700 text-xs font-semibold">
            <button 
              onClick={() => setImportTab('file')}
              className={`flex-1 py-2 transition-colors ${importTab === 'file' ? 'bg-blue-600 text-white' : 'text-earth-600 dark:text-earth-400 hover:bg-earth-100 dark:hover:bg-earth-800'}`}
            >
              Arquivo .json
            </button>
            <button 
              onClick={() => setImportTab('paste')}
              className={`flex-1 py-2 transition-colors ${importTab === 'paste' ? 'bg-blue-600 text-white' : 'text-earth-600 dark:text-earth-400 hover:bg-earth-100 dark:hover:bg-earth-800'}`}
            >
              Colar / API
            </button>
          </div>

          {importTab === 'file' && (
            <div className="space-y-2">
              <p className="text-xs text-earth-500">
                Selecione um <code className="bg-earth-100 dark:bg-earth-800 px-1 rounded">.json</code> exportado aqui ou qualquer JSON no formato de exportação.
              </p>
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl py-5 cursor-pointer hover:border-blue-500 transition-colors">
                <Upload size={24} className="text-blue-400" />
                <span className="text-sm text-blue-500">Clique para selecionar o arquivo</span>
                <input type="file" accept=".json,application/json" className="hidden" onChange={handleImportFile} disabled={loading} />
              </label>
            </div>
          )}

          {importTab === 'paste' && (
            <div className="space-y-3">
              <p className="text-xs text-earth-500">
                Cole diretamente as transações. Ideal para integrações e envios em lote. Você não precisa colocar os colchetes [ ] se for copiar vários.
              </p>

              <div>
                <label className="block text-xs font-medium text-earth-600 dark:text-earth-400 mb-1">
                  Conta destino (opcional)
                </label>
                <select 
                  value={pasteAccount} 
                  onChange={e => setPasteAccount(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-900 text-sm focus:ring-2 focus:ring-forest-500 outline-none"
                >
                  <option value="">Usar conta do JSON original</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-earth-400 mt-1">Se selecionada, forçará essa conta para todas as transações coladas abaixo.</p>
              </div>

              <textarea 
                rows={8} 
                value={pasteJson}
                onChange={e => setPasteJson(e.target.value)}
                placeholder='{
  "description": "Salário",
  "amount": 3000,
  "type": "INCOME",
  "category_name": "Salário",
  "date": "2026-04-01"
},
{
  "description": "Conta de Luz",
  "amount": 150,
  "type": "EXPENSE",
  "category_name": "Moradia",
  "date": "2026-04-05"
}'
                className="w-full px-3 py-2.5 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-900 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none resize-y"
              />
              <button 
                onClick={handleImportPaste}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                <FileJson size={18} /> {loading ? 'Importando...' : 'Importar JSON'}
              </button>
            </div>
          )}
        </div>

        {/* Excluir Lote */}
        <div className="border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 mb-2 text-red-600 dark:text-red-400 font-bold">
            <Trash2 size={18} /> Excluir dados do escopo
          </div>
          <p className="text-xs text-earth-600 dark:text-earth-400 mb-4">
            Remove permanentemente as transações do escopo selecionado acima (Contas/Período) e reverte os saldos. Esta ação não pode ser desfeita.
          </p>
          <button 
            onClick={handleBulkDelete}
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            <AlertTriangle size={18} /> Excluir transações do escopo
          </button>
        </div>

      </div>
    </Modal>
  );
}
