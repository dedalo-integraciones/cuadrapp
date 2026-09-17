import React, { useEffect } from 'react';
import { RubroItem } from '../types';
import { RUBRO_COLORS } from '../utils/csvParser';
import { useTheme } from '../context/ThemeContext';
import { X, Layers, Check, Sparkles } from 'lucide-react';

interface CategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  rubros: string[];
  selectedRubro: string | null;
  onSelectRubro: (rubro: string | null) => void;
  productosPorRubro: Record<string, number>;
  totalProductsCount: number;
  rubrosMap?: Record<string, RubroItem>;
}

export const CategoryDrawer: React.FC<CategoryDrawerProps> = ({
  isOpen,
  onClose,
  rubros,
  selectedRubro,
  onSelectRubro,
  productosPorRubro,
  totalProductsCount,
  rubrosMap = {},
}) => {
  const { isDark } = useTheme();

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-start">
      {/* Backdrop */}
      <div
        id="category-drawer-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Drawer Container aligned with the mobile frame */}
      <aside
        id="category-drawer-panel"
        aria-label="Menú de Rubros y Categorías"
        className={`relative z-10 w-full max-w-[390px] h-full max-h-screen shadow-2xl flex flex-col border-r animate-in slide-in-from-left duration-300 overflow-hidden ${
          isDark
            ? 'bg-[#040706] text-white border-stone-800'
            : 'bg-stone-50 text-stone-900 border-stone-200 shadow-stone-300/30'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 bg-[#C8180F] text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide uppercase leading-tight font-poppins">
                Rubros & Menú
              </h3>
              <p className="text-[11px] text-white/80">Filtrar artículos del catálogo</p>
            </div>
          </div>

          <button
            id="close-category-drawer-btn"
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú de rubros"
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/35 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Option: Ver Todo */}
          <button
            id="filter-rubro-all"
            type="button"
            onClick={() => {
              onSelectRubro(null);
              onClose();
            }}
            className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
              selectedRubro === null
                ? isDark
                  ? 'bg-stone-900 border-[#C8180F] shadow-md'
                  : 'bg-white border-[#C8180F] shadow-sm'
                : isDark
                ? 'bg-[#0c1310] border-stone-800 hover:bg-stone-900'
                : 'bg-white border-stone-200 hover:bg-stone-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                  selectedRubro === null
                    ? 'bg-[#C8180F] text-white shadow-xs'
                    : isDark
                    ? 'bg-stone-800 text-stone-200'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span
                  className={`font-black text-sm uppercase tracking-wide block ${
                    isDark ? 'text-white' : 'text-stone-900'
                  }`}
                >
                  Todos los Rubros
                </span>
                <span className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  Ver carta completa
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isDark ? 'bg-stone-800 text-stone-200' : 'bg-stone-200 text-stone-700'
                }`}
              >
                {totalProductsCount}
              </span>
              {selectedRubro === null && (
                <Check className="w-4 h-4 text-[#C8180F] stroke-[3]" />
              )}
            </div>
          </button>

          <div className="pt-2 pb-1">
            <div
              className={`text-[10px] uppercase font-bold tracking-wider px-1 ${
                isDark ? 'text-stone-400' : 'text-stone-500'
              }`}
            >
              Categorías ({rubros.length})
            </div>
          </div>

          {/* List of Rubros */}
          {rubros.map((rubro) => {
            const count = productosPorRubro[rubro] || 0;
            const rubroInfo = rubrosMap[rubro];
            const accentColor = rubroInfo?.color || RUBRO_COLORS[rubro] || '#C91810';
            const isSelected = selectedRubro === rubro;

            return (
              <button
                key={rubro}
                id={`filter-rubro-${rubro.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                type="button"
                onClick={() => {
                  onSelectRubro(rubro);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-stone-900 shadow-md'
                      : 'bg-white shadow-sm'
                    : isDark
                    ? 'bg-[#0c1310] border-stone-800 hover:bg-stone-900'
                    : 'bg-white border-stone-200 hover:bg-stone-100'
                }`}
                style={{
                  borderColor: isSelected ? accentColor : undefined,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xs"
                    style={{ backgroundColor: accentColor }}
                  >
                    {rubro.charAt(0)}
                  </div>
                  <div>
                    <span
                      className={`font-extrabold text-sm tracking-wide uppercase block ${
                        isDark ? 'text-white' : 'text-stone-900'
                      }`}
                    >
                      {rubro}
                    </span>
                    <span
                      className={`text-[11px] font-medium ${
                        isDark ? 'text-stone-400' : 'text-stone-500'
                      }`}
                    >
                      {count} {count === 1 ? 'producto' : 'productos'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    {count}
                  </span>
                  {isSelected && (
                    <Check
                      className="w-4 h-4 stroke-[3]"
                      style={{ color: accentColor }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div
          className={`p-3 border-t text-center text-xs ${
            isDark
              ? 'bg-[#040706] border-stone-800 text-stone-400'
              : 'bg-stone-100 border-stone-200 text-stone-500'
          }`}
        >
          Toca cualquier rubro para filtrar o ver directamente
        </div>
      </aside>
    </div>
  );
};

export default CategoryDrawer;
