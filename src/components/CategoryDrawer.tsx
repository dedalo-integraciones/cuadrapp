import React, { useEffect } from 'react';
import { Categoria, FiltroCatalogo, Producto, Rubro } from '../types';
import { colorSeguro } from '../utils/csvParser';
import { useTheme } from '../context/ThemeContext';
import { X, Layers, Check, Sparkles } from 'lucide-react';

interface CategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  rubros: Rubro[];
  categorias: Categoria[];
  productos: Producto[];
  selected: FiltroCatalogo;
  onSelect: (filtro: FiltroCatalogo) => void;
  totalProductsCount: number;
}

export const CategoryDrawer: React.FC<CategoryDrawerProps> = ({
  isOpen,
  onClose,
  rubros,
  categorias,
  productos,
  selected,
  onSelect,
  totalProductsCount,
}) => {
  const { isDark } = useTheme();

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

  const contarCategoria = (idCategoria: number) =>
    productos.filter((p) => p.id_categoria === idCategoria).length;

  const contarRubro = (idRubro: number) =>
    categorias
      .filter((c) => c.id_rubro === idRubro)
      .reduce((total, c) => total + contarCategoria(c.id), 0);

  const elegir = (filtro: FiltroCatalogo) => {
    onSelect(filtro);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-start">
      <div
        id="category-drawer-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
      />

      <aside
        id="category-drawer-panel"
        aria-label="Menú de rubros y categorías"
        className={`relative z-10 w-full max-w-[390px] h-full max-h-screen shadow-2xl flex flex-col border-r animate-in slide-in-from-left duration-300 overflow-hidden ${
          isDark
            ? 'bg-[#040706] text-white border-stone-800'
            : 'bg-stone-50 text-stone-900 border-stone-200 shadow-stone-300/30'
        }`}
      >
        <div className="p-4 bg-[#C8180F] text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide uppercase leading-tight font-poppins">
                Rubros y categorías
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

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <button
            id="filter-rubro-all"
            type="button"
            onClick={() => elegir(null)}
            className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
              selected === null
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
                  selected === null
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
                  Toda la carta
                </span>
                <span className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  Ver todos los rubros
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
              {selected === null && <Check className="w-4 h-4 text-[#C8180F] stroke-[3]" />}
            </div>
          </button>

          {rubros.map((rubro) => {
            const accent = colorSeguro(rubro.color);
            const cats = categorias.filter((c) => c.id_rubro === rubro.id);
            const totalRubro = contarRubro(rubro.id);
            const rubroElegido = selected?.tipo === 'rubro' && selected.id === rubro.id;

            return (
              <div
                key={rubro.id}
                className={`rounded-2xl border-2 overflow-hidden transition-colors ${
                  isDark ? 'border-stone-800 bg-[#0c1310]' : 'border-stone-200 bg-white'
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    elegir({ tipo: 'rubro', id: rubro.id, etiqueta: rubro.rubro })
                  }
                  className={`w-full flex items-center justify-between p-3 text-left transition-colors cursor-pointer ${
                    rubroElegido
                      ? isDark
                        ? 'bg-stone-900'
                        : 'bg-stone-100'
                      : isDark
                        ? 'hover:bg-stone-900'
                        : 'hover:bg-stone-100'
                  }`}
                  style={{ borderLeft: `4px solid ${accent}` }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-xs shrink-0"
                      style={{ backgroundColor: accent }}
                    >
                      {rubro.rubro.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <span
                        className={`font-extrabold text-sm tracking-wide uppercase block truncate ${
                          isDark ? 'text-white' : 'text-stone-900'
                        }`}
                      >
                        {rubro.rubro}
                      </span>
                      <span className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                        {totalRubro} {totalRubro === 1 ? 'producto' : 'productos'}
                      </span>
                    </div>
                  </div>
                  {rubroElegido && <Check className="w-4 h-4 shrink-0" style={{ color: accent }} />}
                </button>

                <div className={`px-3 pb-3 pt-1 space-y-1.5 ${isDark ? 'bg-[#080b0a]' : 'bg-stone-50'}`}>
                  {cats.length === 0 && (
                    <p className={`text-[11px] px-1 py-1 ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                      Este rubro todavía no tiene categorías.
                    </p>
                  )}
                  {cats.map((categoria) => {
                    const color = colorSeguro(categoria.color, accent);
                    const count = contarCategoria(categoria.id);
                    const activo = selected?.tipo === 'categoria' && selected.id === categoria.id;
                    return (
                      <button
                        key={categoria.id}
                        type="button"
                        onClick={() =>
                          elegir({
                            tipo: 'categoria',
                            id: categoria.id,
                            etiqueta: categoria.categoria,
                          })
                        }
                        className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                          activo
                            ? isDark
                              ? 'bg-stone-900 border-stone-600'
                              : 'bg-white border-stone-400 shadow-sm'
                            : isDark
                              ? 'bg-transparent border-stone-800 hover:bg-stone-900'
                              : 'bg-white/70 border-stone-200 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span
                            className={`text-xs font-bold truncate ${
                              isDark ? 'text-stone-200' : 'text-stone-800'
                            }`}
                          >
                            {categoria.categoria}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              isDark ? 'bg-stone-800 text-stone-300' : 'bg-stone-200 text-stone-700'
                            }`}
                          >
                            {count}
                          </span>
                          {activo && <Check className="w-3.5 h-3.5 stroke-[3]" style={{ color }} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div
          className={`p-3 border-t text-center text-xs ${
            isDark
              ? 'bg-[#040706] border-stone-800 text-stone-400'
              : 'bg-stone-100 border-stone-200 text-stone-500'
          }`}
        >
          Toque un rubro o una categoría para filtrar la carta.
        </div>
      </aside>
    </div>
  );
};

export default CategoryDrawer;
