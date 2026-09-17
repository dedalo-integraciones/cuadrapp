import React from 'react';
import { ComboItem } from '../types';
import { Plus, Check } from 'lucide-react';
import { formatPriceARS } from '../utils/csvParser';
import { useTheme } from '../context/ThemeContext';
import { ProductImage } from './ProductImage';

interface ComboCardProps {
  combo: ComboItem;
  imagen?: string;
  onAddToCart: (combo: ComboItem) => void;
  quantityInCart?: number;
}

export const ComboCard: React.FC<ComboCardProps> = ({
  combo,
  imagen,
  onAddToCart,
  quantityInCart = 0,
}) => {
  const { isDark } = useTheme();
  const { nombre, detalle_1, detalle_2, precio, color } = combo;

  return (
    <div
      id={`combo-card-${combo.id}`}
      className={`relative flex flex-col rounded-2xl border-2 transition-all duration-300 overflow-hidden pb-3 pt-0 px-3 shadow-md ${
        isDark ? 'bg-[#040706]' : 'bg-white shadow-xs'
      }`}
      style={{
        borderColor: color,
      }}
    >
      {/* Ribbon Header with notched ends */}
      <div className="relative -mx-3 mb-2.5">
        <div
          className="relative flex items-center justify-between px-4 py-1.5 text-white font-extrabold text-sm tracking-wider uppercase shadow-xs w-full"
          style={{ backgroundColor: color }}
        >
          {/* Ribbon cut/notch decorations */}
          <span className="absolute left-0 top-0 bottom-0 w-2 bg-black/10"></span>
          <span className="relative z-10 drop-shadow-xs flex items-center gap-1.5">
            <span>★</span>
            <span>{nombre}</span>
          </span>
          <span className="absolute right-0 top-0 bottom-0 w-2 bg-black/10"></span>
        </div>
      </div>

      {/* Cart quantity badge if in cart */}
      {quantityInCart > 0 && (
        <div
          className="absolute top-8 right-2 z-20 flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold text-white shadow-sm animate-pulse"
          style={{ backgroundColor: color }}
        >
          <Check className="w-3 h-3 stroke-[3]" />
          <span>{quantityInCart} en carrito</span>
        </div>
      )}

      {/* Row Body: Left Content + Right Image */}
      <div className="flex items-center justify-between gap-3">
        {/* Left Side: Bullet details + Total Pill & Order Button (Higher Layer) */}
        <div className="flex-1 flex flex-col justify-between min-w-0 pr-1 relative z-10">
          {/* Bullet Points Details */}
          <div
            className={`space-y-1 text-left text-xs sm:text-[13px] leading-snug font-medium mb-3 transition-colors duration-300 ${
              isDark ? 'text-stone-300' : 'text-stone-600'
            }`}
          >
            {detalle_1 && (
              <div className="flex items-start gap-1.5">
                <span className="text-xs leading-4 select-none font-bold" style={{ color }}>
                  •
                </span>
                <span
                  className={`font-semibold transition-colors duration-300 ${
                    isDark ? 'text-stone-100' : 'text-stone-950'
                  }`}
                >
                  {detalle_1}
                </span>
              </div>
            )}
            {detalle_2 && (
              <div className="flex items-start gap-1.5">
                <span className="text-xs leading-4 select-none font-bold" style={{ color }}>
                  •
                </span>
                <span
                  className={`font-semibold transition-colors duration-300 ${
                    isDark ? 'text-stone-100' : 'text-stone-950'
                  }`}
                >
                  {detalle_2}
                </span>
              </div>
            )}
          </div>

          {/* Total & Order Action Button */}
          <div className="flex items-center gap-2 relative z-10">
            <div className="flex flex-col">
              <div
                className="flex items-center gap-1 text-[11px] font-bold tracking-wide leading-none mb-1"
                style={{ color }}
              >
                <span className="text-[9px] opacity-70">⪻</span>
                <span>Total</span>
                <span className="text-[9px] opacity-70">⪼</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(combo);
                }}
                aria-label={`Pedir ${nombre}`}
                className="inline-flex items-center justify-center gap-1.5 rounded-full py-1.5 px-3.5 text-white font-black text-base sm:text-lg tracking-tight shadow-xs transition-transform group-hover:scale-102 active:scale-95 cursor-pointer pointer-events-auto"
                style={{ backgroundColor: color }}
              >
                <span>{formatPriceARS(precio)}</span>
                <div className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center ml-0.5">
                  <Plus className="w-3.5 h-3.5 stroke-[3] group-hover:rotate-90 transition-transform duration-200" />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Dish Image with poster fallback */}
        <div className="w-32 h-28 sm:w-36 sm:h-30 flex-shrink-0 flex items-center justify-center relative z-0 pointer-events-none select-none">
          <ProductImage
            src={imagen}
            alt={`${nombre} - Cuadra.app`}
            posterSrc="/no-image.webp"
            loading="lazy"
            objectFit="cover"
            containerClassName="w-full h-full rounded-2xl overflow-hidden shadow-xs border border-stone-800/40"
            className="filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)] transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </div>
    </div>
  );
};

export default ComboCard;
