import React, { useEffect, useState } from 'react';
import { ProductItem } from '../types';
import { formatPriceARS } from '../utils/csvParser';
import { useTheme } from '../context/ThemeContext';
import { X, Plus, Minus, ShoppingBag, Check } from 'lucide-react';

interface ProductDetailModalProps {
  isOpen: boolean;
  product: ProductItem | null;
  onClose: () => void;
  onAddToCart: (product: ProductItem, quantity: number) => void;
  quantityInCart?: number;
  rubroColor?: string;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  product,
  onClose,
  onAddToCart,
  quantityInCart = 0,
  rubroColor,
}) => {
  const { isDark } = useTheme();
  const [quantity, setQuantity] = useState(1);
  const [imgError, setImgError] = useState(false);

  // Reset quantity and image error state when a new product is loaded
  useEffect(() => {
    if (product) {
      setQuantity(1);
      setImgError(false);
    }
  }, [product]);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const cardColor = product.color || rubroColor || '#C91810';
  const hasImage = Boolean(product.imagen && product.imagen.trim().length > 0 && !imgError);

  const handleAdd = () => {
    onAddToCart(product, quantity);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        id="product-modal-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity cursor-pointer"
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        id={`product-detail-modal-${product.id}`}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-[370px] sm:max-w-[400px] max-h-[90vh] flex flex-col rounded-3xl border-2 shadow-2xl overflow-hidden transition-all duration-300 z-10 ${
          isDark
            ? 'bg-[#0a0f0d] border-stone-800 text-white'
            : 'bg-white border-stone-300 text-stone-900'
        }`}
        style={{
          boxShadow: `0 20px 40px -15px ${cardColor}25, 0 10px 25px -5px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Floating Top Close Button */}
        <button
          id="close-product-modal-btn"
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalle"
          className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-md border border-white/20"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto overscroll-contain flex-1 p-4 pt-3 pb-3 space-y-3.5">
          {/* Rubro Pill */}
          <div className="flex items-center gap-2 pr-10">
            <span
              className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full text-white shadow-xs"
              style={{ backgroundColor: cardColor }}
            >
              {product.rubro}
            </span>

            {quantityInCart > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                <Check className="w-3 h-3 stroke-[3]" />
                <span>{quantityInCart} en tu carrito</span>
              </span>
            )}
          </div>

          {/* Product Image Section */}
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-inner border border-stone-700/50 bg-stone-900/60 flex items-center justify-center">
            {hasImage ? (
              <img
                src={product.imagen}
                alt={product.nombre}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div
                className={`w-full h-full flex flex-col items-center justify-center p-4 text-center select-none ${
                  isDark ? 'bg-stone-900/80 text-stone-400' : 'bg-stone-100 text-stone-500'
                }`}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2 shadow-xs"
                  style={{ backgroundColor: `${cardColor}20`, color: cardColor }}
                >
                  <ShoppingBag className="w-7 h-7 stroke-[2]" />
                </div>
                <span className="text-xs font-bold tracking-wide">
                  Imagen ilustrativa próximamente
                </span>
              </div>
            )}
          </div>

          {/* Product Title & Price Header */}
          <div className="space-y-1">
            <h3
              id="product-modal-title"
              className={`font-black text-xl leading-tight font-poppins transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-stone-950'
              }`}
            >
              {product.nombre}
            </h3>

            <div className="flex items-baseline gap-2 pt-0.5">
              <span
                className="font-black text-2xl tracking-tight"
                style={{ color: cardColor }}
              >
                {formatPriceARS(product.precio)}
              </span>
              <span
                className={`text-xs font-semibold ${
                  isDark ? 'text-stone-400' : 'text-stone-500'
                }`}
              >
                por unidad
              </span>
            </div>
          </div>

          {/* Product Description Details */}
          {(product.detalle_1 || product.detalle_2) && (
            <div
              className={`p-3 rounded-2xl border transition-colors duration-300 space-y-2 ${
                isDark
                  ? 'bg-stone-900/60 border-stone-800 text-stone-200'
                  : 'bg-stone-50 border-stone-200 text-stone-700'
              }`}
            >
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Detalles del producto
              </div>

              {product.detalle_1 && (
                <div className="flex items-start gap-2 text-sm leading-relaxed">
                  <span
                    className="text-base leading-none select-none font-bold mt-0.5"
                    style={{ color: cardColor }}
                  >
                    •
                  </span>
                  <p className="font-medium flex-1">{product.detalle_1}</p>
                </div>
              )}

              {product.detalle_2 && (
                <div className="flex items-start gap-2 text-sm leading-relaxed">
                  <span
                    className="text-base leading-none select-none font-bold mt-0.5"
                    style={{ color: cardColor }}
                  >
                    •
                  </span>
                  <p className="font-medium flex-1">{product.detalle_2}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Bottom Bar */}
        <div
          className={`p-3.5 border-t space-y-2.5 transition-colors duration-300 ${
            isDark
              ? 'bg-[#070b09] border-stone-800'
              : 'bg-stone-50 border-stone-200'
          }`}
        >
          {/* Quantity Stepper */}
          <div className="flex items-center justify-between gap-3">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-stone-400' : 'text-stone-600'
              }`}
            >
              Cantidad:
            </span>

            <div
              className={`inline-flex items-center rounded-full border p-1 ${
                isDark
                  ? 'bg-stone-900 border-stone-700'
                  : 'bg-white border-stone-300'
              }`}
            >
              <button
                type="button"
                id="modal-decrease-qty-btn"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Disminuir cantidad"
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  quantity <= 1
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:bg-stone-700 active:scale-90 text-stone-200'
                }`}
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              <span
                id="modal-qty-display"
                className={`w-9 text-center font-black text-sm select-none ${
                  isDark ? 'text-white' : 'text-stone-950'
                }`}
              >
                {quantity}
              </span>

              <button
                type="button"
                id="modal-increase-qty-btn"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Aumentar cantidad"
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-stone-700 active:scale-90 transition-all cursor-pointer text-stone-200"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Add to Order Button */}
          <button
            id="modal-add-to-cart-btn"
            type="button"
            onClick={handleAdd}
            aria-label={`Agregar ${quantity} ${product.nombre} al pedido`}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-white font-black text-sm sm:text-base tracking-wide shadow-lg transition-all active:scale-[0.98] cursor-pointer hover:opacity-95"
            style={{ backgroundColor: cardColor }}
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
            <span className="whitespace-nowrap">
              {quantityInCart > 0 ? 'Sumar al pedido' : 'Agregar al pedido'}
            </span>
          </button>

          {/* Close Text Button */}
          <button
            id="modal-cancel-btn"
            type="button"
            onClick={onClose}
            className={`w-full py-1 text-center text-xs font-bold underline cursor-pointer transition-colors ${
              isDark ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-950'
            }`}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
