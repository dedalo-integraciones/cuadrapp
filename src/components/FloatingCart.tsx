import React from 'react';
import { ShoppingCart, Facebook, MapPin } from 'lucide-react';
import {
  WHATSAPP_PHONE_NUMBER,
  WHATSAPP_MESSAGE_CONSULTATION,
  FACEBOOK_URL,
  MAPS_URL,
} from '../config';

interface FloatingCartProps {
  itemCount: number;
  totalPrice?: number;
  onOpenCart: () => void;
}

export const FloatingCart: React.FC<FloatingCartProps> = ({
  itemCount,
  onOpenCart,
}) => {
  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 max-w-[390px] mx-auto px-3 pointer-events-none">
      <div className="flex items-center justify-between gap-2">
        {/* Floating Action Buttons: WhatsApp, Facebook & Google Maps */}
        <div className="flex items-center gap-2">
          {/* WhatsApp Button */}
          <a
            id="floating-whatsapp-button"
            href={`https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodeURIComponent(
              WHATSAPP_MESSAGE_CONSULTATION
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto w-[42px] h-[42px] rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all flex-shrink-0"
            title="Consultar por WhatsApp"
            aria-label="Consultar por WhatsApp"
          >
            <svg className="w-[21px] h-[21px] fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
          </a>

          {/* Facebook Button */}
          <a
            id="floating-facebook-button"
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto w-[42px] h-[42px] rounded-full bg-[#1877F2] hover:bg-[#166fe5] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all flex-shrink-0"
            title="Seguinos en Facebook"
            aria-label="Seguinos en Facebook"
          >
            <Facebook className="w-[21px] h-[21px] stroke-[2.2]" />
          </a>

          {/* Google Maps Button */}
          <a
            id="floating-maps-button"
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto w-[42px] h-[42px] rounded-full bg-[#EA4335] hover:bg-[#d33828] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all flex-shrink-0"
            title="Ver ubicación en Google Maps"
            aria-label="Ver ubicación en Google Maps"
          >
            <MapPin className="w-[21px] h-[21px] stroke-[2.2]" />
          </a>
        </div>

        {/* Floating Cart Button - Exact replica of the Header Top Cart Button */}
        <button
          id="floating-cart-button"
          type="button"
          onClick={onOpenCart}
          aria-label="Ver carrito de compras"
          className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 h-7.5 rounded-full bg-[#C8180F] hover:bg-[#a51410] text-white shadow-lg transition-all active:scale-95 group focus:outline-none cursor-pointer border border-white/20 shrink-0"
        >
          <div className="relative flex items-center">
            <ShoppingCart className="w-3.5 h-3.5 stroke-[2.5] transition-transform group-hover:scale-105" />
            {itemCount > 0 && (
              <span
                id="floating-cart-badge"
                className="absolute -top-2 -right-2.5 bg-white text-[#C8180F] text-[9px] font-black min-w-[15px] h-[15px] px-0.5 rounded-full flex items-center justify-center shadow-xs"
              >
                {itemCount}
              </span>
            )}
          </div>
          <span className="font-black text-xs tracking-wider uppercase whitespace-nowrap">
            Carrito
          </span>
        </button>
      </div>
    </div>
  );
};

export default FloatingCart;
