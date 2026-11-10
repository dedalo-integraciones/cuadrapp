import React from 'react';
import { CartItem, Categoria, Producto } from '../types';
import { colorSeguro, formatPrecio, RUBRO_COLORS } from '../utils/csvParser';
import { Plus } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ProductImage } from './ProductImage';

interface MenuSectionProps {
  categoria: Categoria;
  rubroNombre?: string;
  items: Producto[];
  cart: CartItem[];
  onAddToCart: (product: Producto) => void;
  onSelectProduct?: (product: Producto) => void;
  simbolo?: string;
  mostrarPrecios?: boolean;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  categoria,
  rubroNombre,
  items,
  cart,
  onAddToCart,
  onSelectProduct,
  simbolo = '$',
  mostrarPrecios = true,
}) => {
  const { isDark } = useTheme();

  const sectionColor = colorSeguro(
    categoria.color,
    RUBRO_COLORS[categoria.categoria] || '#C91810'
  );
  const slug = categoria.categoria.toLowerCase().replace(/[^a-z0-9]/g, '-');

  if (!items || items.length === 0) return null;

  return (
    <section id={`section-${slug}`} aria-labelledby={`heading-${slug}`} className="space-y-3 pt-2">
      {/* Banner de categoría, con el rubro padre como referencia */}
      <div className="flex items-start gap-2 px-1">
        <div className="h-7 w-2 rounded-full mt-0.5" style={{ backgroundColor: sectionColor }} />
        <div className="min-w-0">
          {rubroNombre && (
            <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
              {rubroNombre}
            </p>
          )}
          <h2
            id={`heading-${slug}`}
            className={`font-black text-lg sm:text-xl tracking-wider uppercase font-poppins transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-stone-950'
            }`}
          >
            {categoria.categoria}
          </h2>
        </div>
        <span
          className="ml-auto text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white shadow-2xs mt-1"
          style={{ backgroundColor: sectionColor }}
        >
          {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
        </span>
      </div>

      {/* Tarjetas de producto */}
      <div className="space-y-3">
        {items.map((item) => {
          const itemInCart = cart.find((c) => c.itemId === item.id);
          const quantityInCart = itemInCart ? itemInCart.cantidad : 0;
          const cardColor = colorSeguro(item.color, sectionColor);

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
              style={{ borderColor: cardColor }}
            >
              <div className="p-3.5">
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
                      quantityInCart > 0 ? 'bg-emerald-600 hover:bg-emerald-700' : 'hover:opacity-95'
                    }`}
                    style={{ backgroundColor: quantityInCart > 0 ? undefined : cardColor }}
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

                <div className="pt-2.5 flex items-center justify-between gap-3">
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

                    <div className="flex items-center gap-2">
                      <span
                        className={`font-black text-xl tracking-tight transition-colors duration-300 ${
                          isDark ? 'text-white' : 'text-stone-950'
                        }`}
                      >
                        {mostrarPrecios ? formatPrecio(item.precio, simbolo) : 'Consultar'}
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <ProductImage
                      src={item.imagen}
                      alt={item.nombre}
                      posterSrc="/no-image.webp"
                      loading="eager"
                      containerClassName={`w-28 h-24 sm:w-32 sm:h-28 rounded-xl overflow-hidden border shadow-md transition-colors duration-300 ${
                        isDark ? 'bg-stone-900 border-stone-800' : 'bg-stone-100 border-stone-200'
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
