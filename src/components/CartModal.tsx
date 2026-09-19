import React, { useEffect, useState } from 'react';
import { CartItem, OrderCustomerInfo } from '../types';
import { formatPriceARS } from '../utils/csvParser';
import { WHATSAPP_PHONE_NUMBER, WHATSAPP_MESSAGE_ORDER } from '../config';
import { useTheme } from '../context/ThemeContext';
import { X, Trash2, Plus, Minus, ShoppingCart, MapPin, Store, User, ArrowRight } from 'lucide-react';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const { isDark } = useTheme();
  const [customer, setCustomer] = useState<OrderCustomerInfo>({
    nombre: '',
    metodoEntrega: 'domicilio',
    direccion: '',
    aclaraciones: '',
    metodoPago: 'efectivo',
  });

  // Lock body scroll and listen for Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalItemsCount = items.reduce((sum, item) => sum + item.cantidad, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  const handleSendWhatsApp = () => {
    if (items.length === 0) return;

    let message = `${WHATSAPP_MESSAGE_ORDER}\n\n`;

    items.forEach((item, index) => {
      message += `*${index + 1}. ${item.nombre}* (x${item.cantidad})\n`;
      if (item.descripcion) {
        message += `   _${item.descripcion}_\n`;
      }
      message += `   Subtotal: ${formatPriceARS(item.precio * item.cantidad)}\n\n`;
    });

    message += `━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `*TOTAL A PAGAR: ${formatPriceARS(totalPrice)}*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (customer.nombre.trim()) {
      message += `👤 *Cliente:* ${customer.nombre.trim()}\n`;
    }

    message += `🛵 *Entrega:* ${customer.metodoEntrega === 'domicilio' ? 'Envío a domicilio' : 'Retiro en el local'}\n`;

    if (customer.metodoEntrega === 'domicilio' && customer.direccion.trim()) {
      message += `📍 *Dirección:* ${customer.direccion.trim()}\n`;
    }

    if (customer.aclaraciones.trim()) {
      message += `📝 *Aclaraciones:* ${customer.aclaraciones.trim()}\n`;
    }

    message += `\n_Muchas gracias!_`;

    const encodedText = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodedText}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overscroll-contain animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        id="cart-modal-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-300 cursor-pointer"
        aria-hidden="true"
      />

      {/* Mobile Modal Drawer Container */}
      <div
        id="cart-modal-container"
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 w-full max-w-[390px] max-h-[90vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 border ${
          isDark
            ? 'bg-[#040706] text-white border-stone-800'
            : 'bg-stone-50 text-stone-900 border-stone-200 shadow-stone-400/20'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#C8180F] text-white border-b border-red-900/40 shadow-sm shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white text-[#C8180F] flex items-center justify-center shadow-xs">
              <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 id="cart-modal-title" className="font-extrabold text-base leading-tight">
                Carrito de Pedidos
              </h3>
              <p className="text-[11px] text-red-100 font-medium">
                {totalItemsCount} {totalItemsCount === 1 ? 'producto' : 'productos'} seleccionados
              </p>
            </div>
          </div>
          <button
            id="close-cart-modal-btn"
            type="button"
            onClick={onClose}
            aria-label="Cerrar carrito"
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 active:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Body with smooth scrolling */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 space-y-4">
          {items.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              <div
                className={`w-16 h-16 rounded-full text-[#C8180F] flex items-center justify-center mx-auto shadow-inner border ${
                  isDark
                    ? 'bg-stone-900 border-stone-800'
                    : 'bg-stone-100 border-stone-200'
                }`}
              >
                <ShoppingCart className="w-8 h-8 opacity-80" />
              </div>
              <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-stone-900'}`}>
                Tu carrito está vacío
              </h4>
              <p className={`text-xs max-w-[240px] mx-auto ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                Toca cualquier Combo o producto del menú para agregarlo a tu pedido.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#C8180F] text-white font-bold text-xs tracking-wide shadow-sm hover:bg-[#a51410] transition-colors cursor-pointer"
              >
                <span>Ver productos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="space-y-2">
                <div
                  className={`flex items-center justify-between text-xs font-bold px-1 ${
                    isDark ? 'text-stone-400' : 'text-stone-600'
                  }`}
                >
                  <span>Productos</span>
                  <button
                    id="clear-cart-btn"
                    type="button"
                    onClick={onClearCart}
                    className={`active:underline flex items-center gap-1 text-[11px] cursor-pointer transition-colors ${
                      isDark
                        ? 'text-rose-400 hover:text-rose-300'
                        : 'text-rose-600 hover:text-rose-700'
                    }`}
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Vaciar</span>
                  </button>
                </div>

                {items.map((item) => (
                  <div
                    key={item.id}
                    id={`cart-item-${item.id}`}
                    className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 shadow-xs transition-colors ${
                      isDark
                        ? 'border-stone-800 bg-stone-900/90 text-white'
                        : 'border-stone-200 bg-white text-stone-900'
                    }`}
                  >
                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color || '#C8180F' }}
                        ></span>
                        <h4
                          className={`font-extrabold text-sm truncate ${
                            isDark ? 'text-white' : 'text-stone-900'
                          }`}
                        >
                          {item.nombre}
                        </h4>
                      </div>
                      {item.descripcion && (
                        <p
                          className={`text-[11px] line-clamp-1 mt-0.5 ${
                            isDark ? 'text-stone-400' : 'text-stone-500'
                          }`}
                        >
                          {item.descripcion}
                        </p>
                      )}
                      <p
                        className={`text-xs font-bold mt-1 ${
                          isDark ? 'text-emerald-400' : 'text-emerald-600'
                        }`}
                      >
                        {formatPriceARS(item.precio * item.cantidad)}
                        {item.cantidad > 1 && (
                          <span
                            className={`text-[10px] font-normal ml-1 ${
                              isDark ? 'text-stone-400' : 'text-stone-500'
                            }`}
                          >
                            ({formatPriceARS(item.precio)} c/u)
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Quantity Selector */}
                    <div
                      className={`flex items-center gap-1.5 border rounded-full px-2 py-1 shadow-xs flex-shrink-0 ${
                        isDark
                          ? 'bg-stone-800 border-stone-700'
                          : 'bg-stone-100 border-stone-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                          isDark
                            ? 'hover:bg-stone-700 active:bg-stone-600 text-white'
                            : 'hover:bg-stone-200 active:bg-stone-300 text-stone-800'
                        }`}
                        aria-label="Disminuir"
                      >
                        <Minus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                      <span
                        className={`font-extrabold text-xs min-w-[14px] text-center ${
                          isDark ? 'text-white' : 'text-stone-900'
                        }`}
                      >
                        {item.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                          isDark
                            ? 'hover:bg-stone-700 active:bg-stone-600 text-white'
                            : 'hover:bg-stone-200 active:bg-stone-300 text-stone-800'
                        }`}
                        aria-label="Aumentar"
                      >
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className={`p-1.5 transition-colors cursor-pointer ${
                        isDark
                          ? 'text-stone-400 hover:text-rose-400'
                          : 'text-stone-400 hover:text-rose-600'
                      }`}
                      title="Eliminar"
                      aria-label={`Eliminar ${item.nombre}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Order Details Form */}
              <div
                className={`pt-2 border-t space-y-2.5 ${
                  isDark ? 'border-stone-800' : 'border-stone-200'
                }`}
              >
                <div
                  className={`text-xs font-bold flex items-center gap-1.5 ${
                    isDark ? 'text-stone-300' : 'text-stone-700'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-[#C8180F]" />
                  <span>Datos de tu pedido (opcional)</span>
                </div>

                {/* Name */}
                <div>
                  <input
                    id="cart-customer-name"
                    type="text"
                    value={customer.nombre}
                    onChange={(e) => setCustomer({ ...customer, nombre: e.target.value })}
                    placeholder="Tu nombre (ej. Nelson)"
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#C8180F] transition-colors ${
                      isDark
                        ? 'bg-stone-900 text-white placeholder:text-stone-500 border-stone-700'
                        : 'bg-white text-stone-900 placeholder:text-stone-400 border-stone-300'
                    }`}
                  />
                </div>

                {/* Delivery Options */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    id="cart-delivery-home"
                    onClick={() => setCustomer({ ...customer, metodoEntrega: 'domicilio' })}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      customer.metodoEntrega === 'domicilio'
                        ? isDark
                          ? 'bg-red-950/80 border-[#C8180F] text-red-200 shadow-xs'
                          : 'bg-red-50 border-[#C8180F] text-[#C8180F] shadow-xs'
                        : isDark
                        ? 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-800'
                        : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>A Domicilio</span>
                  </button>

                  <button
                    type="button"
                    id="cart-delivery-pickup"
                    onClick={() => setCustomer({ ...customer, metodoEntrega: 'retiro' })}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      customer.metodoEntrega === 'retiro'
                        ? isDark
                          ? 'bg-red-950/80 border-[#C8180F] text-red-200 shadow-xs'
                          : 'bg-red-50 border-[#C8180F] text-[#C8180F] shadow-xs'
                        : isDark
                        ? 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-800'
                        : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Retiro en Local</span>
                  </button>
                </div>

                {/* Address (if delivery) */}
                {customer.metodoEntrega === 'domicilio' && (
                  <div>
                    <input
                      id="cart-customer-address"
                      type="text"
                      value={customer.direccion}
                      onChange={(e) => setCustomer({ ...customer, direccion: e.target.value })}
                      placeholder="Dirección completa y barrio"
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#C8180F] transition-colors ${
                        isDark
                          ? 'bg-stone-900 text-white placeholder:text-stone-500 border-stone-700'
                          : 'bg-white text-stone-900 placeholder:text-stone-400 border-stone-300'
                      }`}
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <input
                    id="cart-customer-notes"
                    type="text"
                    value={customer.aclaraciones}
                    onChange={(e) => setCustomer({ ...customer, aclaraciones: e.target.value })}
                    placeholder="Aclaraciones (ej. con limón, pago en efectivo)"
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#C8180F] transition-colors ${
                      isDark
                        ? 'bg-stone-900 text-white placeholder:text-stone-500 border-stone-700'
                        : 'bg-white text-stone-900 placeholder:text-stone-400 border-stone-300'
                    }`}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer with Total & WhatsApp Action */}
        {items.length > 0 && (
          <div
            className={`p-3.5 border-t space-y-2.5 shrink-0 ${
              isDark
                ? 'bg-stone-900 border-stone-800'
                : 'bg-stone-100 border-stone-200'
            }`}
          >
            <div className="flex items-baseline justify-between px-1">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'text-stone-400' : 'text-stone-600'
                }`}
              >
                Total estimado:
              </span>
              <span
                id="cart-modal-total-price"
                className={`text-xl font-black ${
                  isDark ? 'text-white' : 'text-stone-950'
                }`}
              >
                {formatPriceARS(totalPrice)}
              </span>
            </div>

            {/* Big WhatsApp CTA Button */}
            <button
              id="cart-whatsapp-submit-btn"
              type="button"
              onClick={handleSendWhatsApp}
              className="w-full py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20be5b] active:scale-[0.98] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <span>Enviar Pedido por WhatsApp</span>
            </button>
            <p
              className={`text-center text-[10px] font-medium ${
                isDark ? 'text-stone-400' : 'text-stone-500'
              }`}
            >
              Al tocar se abrirá WhatsApp con tu pedido armado listo para enviar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;

