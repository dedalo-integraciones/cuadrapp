import React from 'react';
import { ProductItem, CartItem } from '../types';
import { formatPriceARS, RUBRO_COLORS } from '../utils/csvParser';
import { Plus } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ProductImage } from './ProductImage';

interface MenuSectionProps {
  rubro: string;
  items: ProductItem[];
  cart: CartItem[];
  onAddToCart: (product: ProductItem) => void;
  onSelectProduct?: (product: ProductItem) => void;
  rubroColor?: string;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  rubro,
  items,
  cart,
  onAddToCart,
  onSelectProduct,
  rubroColor,
}) => {
  const { isDark } = useTheme();

  const sectionColor = rubroColor || RUBRO_COLORS[rubro] || '#C91810';

  if (!items || items.length === 0) return null;

  return (
    <section
      id={`section-${rubro.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
      aria-labelledby={`heading-${rubro.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
      className="space-y-3 pt-2"
    >
      {/* Rubro Category Banner */}
      <div className="flex items-center gap-2 px-1">
        <div
          className="h-6 w-2 rounded-full"
          style={{ backgroundColor: sectionColor }}
        />
        <h2
          id={`heading-${rubro.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
          className={`font-black text-lg sm:text-xl tracking-wider uppercase font-poppins transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-stone-950'
          }`}
        >
          {rubro}
        </h2>
        <span
          className="ml-auto text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white shadow-2xs"
          style={{ backgroundColor: sectionColor }}
        >
          {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
        </span>
      </div>

      {/* Grid of Product Cards */}
      <div className="space-y-3">
        {items.map((item) => {
          const itemInCart = cart.find((c) => String(c.itemId) === String(item.id));
          const quantityInCart = itemInCart ? itemInCart.cantidad : 0;
          const cardColor = item.color || sectionColor;

          return (
            <article
              key={item.id}
              id={`product-card-${item.id}`}
              onClick={() => onSelectProduct?.(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectProduct?.(item);
                }
              }}
              aria-label={`Ver detalles de ${item.nombre}`}
              className={`relative rounded-2xl border-2 transition-all duration-300 overflow-hidden shadow-md hover:shadow-lg flex flex-col justify-between cursor-pointer group hover:scale-[1.008] active:scale-[0.995] ${
                isDark ? 'bg-[#040706]' : 'bg-white shadow-xs'
              }`}
              style={{
                borderColor: cardColor,
              }}
            >
              {/* Card Body */}
              <div className="p-3.5">
                {/* Title and Pedir Button in the same row */}
                <div
                  className={`flex items-center justify-between gap-2.5 pb-2 border-b transition-colors duration-300 ${
                    isDark ? 'border-stone-800/80' : 'border-stone-200'
                  }`}
                >
                  <h3
                    className={`font-black text-base sm:text-lg leading-tight flex-1 min-w-0 transition-colors duration-300 group-hover:underline underline-offset-2 ${
                      isDark ? 'text-white' : 'text-stone-950'
                    }`}
                  >
                    {item.nombre}
                  </h3>

                  <button
                    id={`add-product-btn-${item.id}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(item);
                    }}
                    aria-label={`Agregar ${item.nombre} al carrito`}
                    className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-white font-black text-xs shadow-xs transition-all active:scale-95 cursor-pointer flex-shrink-0 min-h-[34px] ${
                      quantityInCart > 0
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'hover:opacity-95'
                    }`}
                    style={{
                      backgroundColor: quantityInCart > 0 ? undefined : cardColor,
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{quantityInCart > 0 ? 'Sumar' : 'Pedir'}</span>
                    {quantityInCart > 0 && (
                      <span
                        id={`product-qty-badge-${item.id}`}
                        className="min-w-[17px] h-[17px] px-1 rounded-full bg-white text-emerald-800 text-[10px] font-black flex items-center justify-center shadow-2xs leading-none"
                      >
                        {quantityInCart}
                      </span>
                    )}
                  </button>
                </div>

                {/* Details & Large Image Row */}
                <div className="pt-2.5 flex items-center justify-between gap-3">
                  {/* Left: Product Text Details & Price */}
                  <div className="flex-1 min-w-0 pr-1">
                    {(item.detalle_1 || item.detalle_2) && (
                      <div className="space-y-1 text-xs mb-2">
                        {item.detalle_1 && (
                          <p
                            className={`font-medium text-xs line-clamp-2 leading-relaxed transition-colors duration-300 ${
                              isDark ? 'text-stone-300' : 'text-stone-600'
                            }`}
                          >
                            {item.detalle_1}
                          </p>
                        )}
                        {item.detalle_2 && (
                          <p
                            className={`font-medium text-xs line-clamp-2 leading-relaxed transition-colors duration-300 ${
                              isDark ? 'text-stone-300' : 'text-stone-600'
                            }`}
                          >
                            {item.detalle_2}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Price Tag */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-black text-xl tracking-tight transition-colors duration-300 ${
                          isDark ? 'text-white' : 'text-stone-950'
                        }`}
                      >
                        {formatPriceARS(item.precio)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Big, spacious Image thumbnail with poster */}
                  <div className="flex-shrink-0">
                    <ProductImage
                      src={item.imagen}
                      alt={item.nombre}
                      posterSrc="/no-image.webp"
                      loading="eager"
                      containerClassName={`w-28 h-24 sm:w-32 sm:h-28 rounded-xl overflow-hidden border shadow-md transition-colors duration-300 ${
                        isDark
                          ? 'bg-stone-900 border-stone-800'
                          : 'bg-stone-100 border-stone-200'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default MenuSection;
