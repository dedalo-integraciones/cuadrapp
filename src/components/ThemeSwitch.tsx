import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeSwitch: React.FC = () => {
  const { isDark, setTheme } = useTheme();

  return (
    <div className="w-full flex flex-col items-center justify-center py-2 px-3">
      {/* Container Box */}
      <div
        className={`inline-flex items-center p-1 rounded-full border transition-all duration-300 shadow-md ${
          isDark
            ? 'bg-stone-900/90 border-stone-700/80'
            : 'bg-white border-stone-300'
        }`}
        role="group"
        aria-label="Selector de modo claro y oscuro"
      >
        {/* Modo Claro (Sol) */}
        <button
          type="button"
          id="theme-btn-light"
          onClick={() => setTheme('light')}
          aria-pressed={!isDark}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all duration-300 cursor-pointer select-none ${
            !isDark
              ? 'bg-amber-400 text-stone-950 shadow-sm scale-100'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Sun
            className={`w-4 h-4 transition-transform duration-300 ${
              !isDark ? 'rotate-90 text-stone-950 stroke-[2.5]' : 'text-stone-400'
            }`}
          />
          <span className="tracking-tight">Claro</span>
        </button>

        {/* Modo Oscuro (Luna) */}
        <button
          type="button"
          id="theme-btn-dark"
          onClick={() => setTheme('dark')}
          aria-pressed={isDark}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all duration-300 cursor-pointer select-none ${
            isDark
              ? 'bg-indigo-600 text-white shadow-sm scale-100'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Moon
            className={`w-4 h-4 transition-transform duration-300 ${
              isDark ? '-rotate-12 text-white fill-white/20 stroke-[2.5]' : 'text-stone-500'
            }`}
          />
          <span className="tracking-tight">Oscuro</span>
        </button>
      </div>

      <span
        className={`text-[10px] font-bold tracking-wider uppercase mt-1.5 transition-colors duration-300 ${
          isDark ? 'text-stone-400' : 'text-stone-500'
        }`}
      >
        {isDark ? 'Modo oscuro activo' : 'Modo claro activo'}
      </span>
    </div>
  );
};
