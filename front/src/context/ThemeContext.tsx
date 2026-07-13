import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

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
  ruby: {
    '--primary-50': '#fff5f5',
    '--primary-100': '#fed7d7',
    '--primary-200': '#feb2b2',
    '--primary-300': '#fc8181',
    '--primary-400': '#f56565',
    '--primary-500': '#e53e3e',
    '--primary-600': '#e53e3e',
    '--primary-700': '#c53030',
    '--primary-800': '#9b2c2c',
    '--primary-900': '#742a2c',
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
};

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  palette: string;
  changePalette: (name: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [palette, setPalette] = useState<string>('forest');

  const applyPalette = (name: string) => {
    const colors = PALETTES[name as keyof typeof PALETTES] || PALETTES.forest;
    Object.entries(colors).forEach(([key, val]) => {
      document.documentElement.style.setProperty(key, val);
    });
  };

  useEffect(() => {
    // Theme initialization
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }

    // Palette initialization
    const savedPalette = localStorage.getItem('palette') || 'forest';
    setPalette(savedPalette);
    applyPalette(savedPalette);
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

  const changePalette = (name: string) => {
    setPalette(name);
    localStorage.setItem('palette', name);
    applyPalette(name);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, palette, changePalette }}>
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
