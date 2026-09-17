import React from 'react';
import { ShoppingCart, Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  onOpenCart?: () => void;
  itemCount?: number;
  onOpenMenu?: () => void;
  activeRubroFilter?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCart,
  itemCount = 0,
  onOpenMenu,
  activeRubroFilter,
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="relative w-full">
      {/* Hero Banner with rounded border matching the cards container */}
      <div className="px-2.5 pt-2.5">
        <div
          className={`w-full relative overflow-hidden rounded-[24px] sm:rounded-[28px] border-[3.5px] shadow-xl transition-all duration-300 ${
            isDark
              ? 'border-white bg-[#040706]'
              : 'border-stone-900 bg-white'
          }`}
        >
          <img
            id="header-hero-img"
            src="/images/hero.webp"
            alt="Sabor Casero"
            referrerPolicy="no-referrer"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            width={573}
            height={253}
            className="w-full h-auto aspect-[573/253] object-cover object-center block"
          />
        </div>
      </div>

      {/* Action Bar (Rubros Filter, Theme Toggle & Carrito) below the image */}
      <div className="flex items-center justify-between gap-2 px-3 pt-2.5 pb-1">
        {/* Left: Rubros Menu Button */}
        {onOpenMenu ? (
          <button
            id="top-menu-button"
            type="button"
            onClick={onOpenMenu}
            aria-label="Abrir menú de rubros y filtros"
            className="inline-flex items-center gap-1.5 px-3.5 h-7.5 rounded-full bg-[#0055A4] hover:bg-[#004080] text-white shadow-xs transition-all active:scale-95 group focus:outline-none cursor-pointer border border-white/20 shrink-0"
          >
            <Menu className="w-3.5 h-3.5 stroke-[2.5] transition-transform group-hover:scale-110" />
            <span className="font-black text-xs tracking-wider uppercase">
              {activeRubroFilter ? activeRubroFilter.slice(0, 10) : 'Rubros'}
            </span>
            {activeRubroFilter && (
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            )}
          </button>
        ) : (
          <div />
        )}

        {/* Center: Botón redundante de modo claro/oscuro (solo iconos sol y luna, chiquito pero funcional) */}
        <button
          id="top-theme-toggle-button"
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          title={isDark ? 'Cambiar a modo claro (Sol)' : 'Cambiar a modo oscuro (Luna)'}
          className={`inline-flex items-center p-0.5 h-7.5 rounded-full border transition-all duration-300 cursor-pointer active:scale-90 shadow-xs select-none ${
            isDark
              ? 'bg-stone-900/90 border-stone-700 text-stone-300 hover:border-stone-500'
              : 'bg-white border-stone-300 text-stone-700 hover:border-stone-400'
          }`}
        >
          {/* Sol */}
          <div
            className={`w-6.5 h-6.5 rounded-full flex items-center justify-center transition-all duration-300 ${
              !isDark
                ? 'bg-amber-400 text-stone-950 shadow-xs scale-100 rotate-0'
                : 'text-stone-500 hover:text-stone-300 -rotate-45'
            }`}
          >
            <Sun className={`w-3.5 h-3.5 ${!isDark ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
          </div>

          {/* Luna */}
          <div
            className={`w-6.5 h-6.5 rounded-full flex items-center justify-center transition-all duration-300 ${
              isDark
                ? 'bg-indigo-600 text-white shadow-xs scale-100 rotate-0'
                : 'text-stone-400 hover:text-stone-600 rotate-45'
            }`}
          >
            <Moon className={`w-3.5 h-3.5 ${isDark ? 'fill-white/30 stroke-[2.5]' : 'stroke-[2]'}`} />
          </div>
        </button>

        {/* Right: Carrito Button */}
        {onOpenCart && (
          <button
            id="top-cart-button"
            type="button"
            onClick={onOpenCart}
            aria-label="Ver carrito de compras"
            className="inline-flex items-center gap-1.5 px-3.5 h-7.5 rounded-full bg-[#C8180F] hover:bg-[#a51410] text-white shadow-xs transition-all active:scale-95 group focus:outline-none cursor-pointer border border-white/20 shrink-0"
          >
            <div className="relative flex items-center">
              <ShoppingCart className="w-3.5 h-3.5 stroke-[2.5] transition-transform group-hover:scale-105" />
              {itemCount > 0 && (
                <span
                  id="top-cart-badge"
                  className="absolute -top-2 -right-2.5 bg-white text-[#C8180F] text-[9px] font-black min-w-[15px] h-[15px] px-0.5 rounded-full flex items-center justify-center shadow-xs"
                >
                  {itemCount}
                </span>
              )}
            </div>
            <span className="font-black text-xs tracking-wider uppercase">Carrito</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
