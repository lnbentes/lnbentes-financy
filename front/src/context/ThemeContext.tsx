import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// Função para gerar tons a partir de um HEX base
function generateShadesFromHex(hex: string) {
  // Limpa o hex
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  const mix = (r2: number, g2: number, b2: number, weight: number) => {
    const nr = Math.round(r * (1 - weight) + r2 * weight);
    const ng = Math.round(g * (1 - weight) + g2 * weight);
    const nb = Math.round(b * (1 - weight) + b2 * weight);
    return `#${((1 << 24) + (nr << 16) + (ng << 8) + nb).toString(16).slice(1)}`;
  };

  return {
    '--primary-50': mix(255, 255, 255, 0.92),
    '--primary-100': mix(255, 255, 255, 0.8),
    '--primary-200': mix(255, 255, 255, 0.6),
    '--primary-300': mix(255, 255, 255, 0.4),
    '--primary-400': mix(255, 255, 255, 0.2),
    '--primary-500': `#${c}`,
    '--primary-600': mix(0, 0, 0, 0.15),
    '--primary-700': mix(0, 0, 0, 0.3),
    '--primary-800': mix(0, 0, 0, 0.45),
    '--primary-900': mix(0, 0, 0, 0.6),
  };
}

export const PALETTES = {
  forest: {
    '--primary-50': '#f0fdf4',
    '--primary-100': '#dcfce7',
    '--primary-200': '#bbf7d0',
    '--primary-300': '#86efac',
    '--primary-400': '#4ade80',
    '--primary-500': '#22c55e',
    '--primary-600': '#16a34a',
    '--primary-700': '#15803d',
    '--primary-800': '#166534',
    '--primary-900': '#14532d',
  },
  emerald: {
    '--primary-50': '#ecfdf5',
    '--primary-100': '#d1fae5',
    '--primary-200': '#a7f3d0',
    '--primary-300': '#6ee7b7',
    '--primary-400': '#34d399',
    '--primary-500': '#10b981',
    '--primary-600': '#059669',
    '--primary-700': '#047857',
    '--primary-800': '#065f46',
    '--primary-900': '#064e3b',
  },
  ocean: {
    '--primary-50': '#eff6ff',
    '--primary-100': '#dbeafe',
    '--primary-200': '#bfdbfe',
    '--primary-300': '#93c5fd',
    '--primary-400': '#60a5fa',
    '--primary-500': '#3b82f6',
    '--primary-600': '#2563eb',
    '--primary-700': '#1d4ed8',
    '--primary-800': '#1e40af',
    '--primary-900': '#1e3a8a',
  },
  sky: {
    '--primary-50': '#f0f9ff',
    '--primary-100': '#e0f2fe',
    '--primary-200': '#bae6fd',
    '--primary-300': '#7dd3fc',
    '--primary-400': '#38bdf8',
    '--primary-500': '#0ea5e9',
    '--primary-600': '#0284c7',
    '--primary-700': '#0369a1',
    '--primary-800': '#075985',
    '--primary-900': '#0c4a6e',
  },
  indigo: {
    '--primary-50': '#eef2ff',
    '--primary-100': '#e0e7ff',
    '--primary-200': '#c7d2fe',
    '--primary-300': '#a5b4fc',
    '--primary-400': '#818cf8',
    '--primary-500': '#6366f1',
    '--primary-600': '#4f46e5',
    '--primary-700': '#4338ca',
    '--primary-800': '#3730a3',
    '--primary-900': '#312e81',
  },
  lavender: {
    '--primary-50': '#faf5ff',
    '--primary-100': '#f3e8ff',
    '--primary-200': '#e9d5ff',
    '--primary-300': '#d8b4fe',
    '--primary-400': '#c084fc',
    '--primary-500': '#a855f7',
    '--primary-600': '#9333ea',
    '--primary-700': '#7e22ce',
    '--primary-800': '#6b21a8',
    '--primary-900': '#581c87',
  },
  rose: {
    '--primary-50': '#fdf2f8',
    '--primary-100': '#fce7f3',
    '--primary-200': '#fbcfe8',
    '--primary-300': '#f9a8d4',
    '--primary-400': '#f472b6',
    '--primary-500': '#ec4899',
    '--primary-600': '#db2777',
    '--primary-700': '#be185d',
    '--primary-800': '#9d174d',
    '--primary-900': '#831843',
  },
  ruby: {
    '--primary-50': '#fff1f2',
    '--primary-100': '#ffe4e6',
    '--primary-200': '#fecdd3',
    '--primary-300': '#fda4af',
    '--primary-400': '#fb7185',
    '--primary-500': '#e11d48',
    '--primary-600': '#be123c',
    '--primary-700': '#9f1239',
    '--primary-800': '#881337',
    '--primary-900': '#4c0519',
  },
  tangerine: {
    '--primary-50': '#fff7ed',
    '--primary-100': '#ffedd5',
    '--primary-200': '#fed7aa',
    '--primary-300': '#fdbb74',
    '--primary-400': '#fb923c',
    '--primary-500': '#f97316',
    '--primary-600': '#ea580c',
    '--primary-700': '#c2410c',
    '--primary-800': '#9a3412',
    '--primary-900': '#7c2d12',
  },
  amber: {
    '--primary-50': '#fffbeb',
    '--primary-100': '#fef3c7',
    '--primary-200': '#fde68a',
    '--primary-300': '#fcd34d',
    '--primary-400': '#fbbf24',
    '--primary-500': '#f59e0b',
    '--primary-600': '#d97706',
    '--primary-700': '#b45309',
    '--primary-800': '#92400e',
    '--primary-900': '#78350f',
  },
  teal: {
    '--primary-50': '#f0fdfa',
    '--primary-100': '#ccfbf1',
    '--primary-200': '#99f6e4',
    '--primary-300': '#5eead4',
    '--primary-400': '#2dd4bf',
    '--primary-500': '#14b8a6',
    '--primary-600': '#0d9488',
    '--primary-700': '#0f766e',
    '--primary-800': '#115e59',
    '--primary-900': '#134e4a',
  },
  cyan: {
    '--primary-50': '#ecfeff',
    '--primary-100': '#cffafe',
    '--primary-200': '#a5f3fc',
    '--primary-300': '#67e8f9',
    '--primary-400': '#22d3ee',
    '--primary-500': '#06b6d4',
    '--primary-600': '#0891b2',
    '--primary-700': '#0e7490',
    '--primary-800': '#155e75',
    '--primary-900': '#164e63',
  },
};

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  palette: string;
  customHex: string;
  changePalette: (name: string, customColorHex?: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [palette, setPalette] = useState<string>('forest');
  const [customHex, setCustomHex] = useState<string>('#22c55e');

  const applyPalette = (name: string, hex?: string) => {
    let colors: Record<string, string>;
    if (name === 'custom' && hex) {
      colors = generateShadesFromHex(hex);
    } else {
      colors = PALETTES[name as keyof typeof PALETTES] || PALETTES.forest;
    }
    Object.entries(colors).forEach(([key, val]) => {
      document.documentElement.style.setProperty(key, val);
    });
  };

  useEffect(() => {
    // Theme initialization (padrão escuro moderno)
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'dark') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }

    // Palette initialization
    const savedPalette = localStorage.getItem('palette') || 'forest';
    const savedCustomHex = localStorage.getItem('custom_hex') || '#22c55e';
    setPalette(savedPalette);
    setCustomHex(savedCustomHex);
    applyPalette(savedPalette, savedCustomHex);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newTheme;
    });
  };

  const changePalette = (name: string, customColorHex?: string) => {
    setPalette(name);
    localStorage.setItem('palette', name);
    if (name === 'custom' && customColorHex) {
      setCustomHex(customColorHex);
      localStorage.setItem('custom_hex', customColorHex);
      applyPalette('custom', customColorHex);
    } else {
      applyPalette(name);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, palette, customHex, changePalette }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
