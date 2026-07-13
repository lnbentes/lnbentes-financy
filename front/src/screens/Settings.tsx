import { useTheme } from '../context/ThemeContext';
import { Palette, Check, Sparkles } from 'lucide-react';

const PALETTE_DETAILS = [
  { id: 'forest', name: 'Forest (Verde Eco)', mainColor: '#22c55e', colors: ['#f0fdf4', '#22c55e', '#15803d'] },
  { id: 'lavender', name: 'Lavender (M3 Roxo)', mainColor: '#a855f7', colors: ['#faf5ff', '#a855f7', '#7e22ce'] },
  { id: 'ocean', name: 'Ocean (M3 Azul)', mainColor: '#3b82f6', colors: ['#eff6ff', '#3b82f6', '#1d4ed8'] },
  { id: 'tangerine', name: 'Tangerine (Laranja)', mainColor: '#f97316', colors: ['#fff7ed', '#f97316', '#c2410c'] },
  { id: 'ruby', name: 'Ruby (Vermelho Rubi)', mainColor: '#e53e3e', colors: ['#fff5f5', '#e53e3e', '#c53030'] },
  { id: 'teal', name: 'Teal (Azul-Verde)', mainColor: '#14b8a6', colors: ['#f0fdfa', '#14b8a6', '#0f766e'] },
];

export function Settings() {
  const { palette, changePalette } = useTheme();

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold text-forest-900 dark:text-forest-100 font-serif">Configurações</h2>
          <p className="text-earth-600 dark:text-earth-400">Personalize a aparência e comportamento do seu aplicativo financeiro.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Color Palette Selector */}
        <div className="lg:col-span-2 bg-white dark:bg-earth-900 p-6 rounded-3xl border border-earth-200 dark:border-earth-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-forest-100 text-forest-600 rounded-xl dark:bg-forest-900/20 dark:text-forest-300">
              <Palette size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Paleta de Cores (Material 3)</h3>
              <p className="text-xs text-earth-500">Mude a cor de destaque principal de toda a interface do sistema.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PALETTE_DETAILS.map(p => {
              const active = palette === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => changePalette(p.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    active 
                      ? 'border-forest-500 bg-forest-50/50 dark:bg-forest-900/10' 
                      : 'border-earth-200 dark:border-earth-800 hover:border-earth-300 dark:hover:border-earth-700 bg-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs" style={{ background: p.mainColor }}>
                      {active && <Check size={12} />}
                    </span>
                    <span className="font-semibold text-sm text-earth-800 dark:text-earth-200">{p.name}</span>
                  </div>
                  
                  {/* Colors Preview */}
                  <div className="flex gap-1">
                    {p.colors.map((c, i) => (
                      <span 
                        key={i} 
                        className="w-3.5 h-3.5 rounded-full border border-earth-200 dark:border-earth-800" 
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="bg-white dark:bg-earth-900 p-6 rounded-3xl border border-earth-200 dark:border-earth-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-forest-600 dark:text-forest-400 font-semibold text-sm">
              <Sparkles size={16} />
              <span>Visualização em Tempo Real</span>
            </div>
            <h3 className="text-base font-bold">Tema do Sistema</h3>
            <p className="text-xs text-earth-500 leading-relaxed">
              O Material Design 3 se adapta à cor selecionada e gera variações harmônicas de tons claros e escuros. Veja abaixo uma simulação rápida de como os botões e destaques ficam com a sua paleta activa.
            </p>
          </div>

          {/* Simulated Interface Preview */}
          <div className="border border-earth-200 dark:border-earth-800 rounded-2xl p-4 bg-earth-50 dark:bg-earth-950/50 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-earth-400">Card Simulado</span>
              <span className="text-xs font-bold text-forest-600">R$ 1.500,00</span>
            </div>
            
            <div className="flex gap-2">
              <button type="button" className="flex-1 py-2 bg-forest-600 text-white rounded-xl font-medium text-xs shadow-sm hover:opacity-90 transition-all text-center">
                Destaque Primário
              </button>
              <button type="button" className="flex-1 py-2 bg-forest-100 text-forest-700 dark:bg-forest-900/30 dark:text-forest-300 rounded-xl font-medium text-xs text-center">
                Secundário
              </button>
            </div>
            
            <div className="h-1.5 w-full bg-earth-200 dark:bg-earth-850 rounded-full overflow-hidden">
              <div className="h-full bg-forest-500 rounded-full w-2/3 transition-all duration-500" />
            </div>
          </div>

          <div className="pt-2 border-t border-earth-100 dark:border-earth-800">
            <span className="text-[10px] text-earth-400 leading-tight block text-center">
              Paleta ativa: <strong className="capitalize text-earth-600 dark:text-earth-300">{palette}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
