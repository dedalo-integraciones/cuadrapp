import React from 'react';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ToastProps {
  message: string | null;
  onOpenCart: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onOpenCart }) => {
  const { isDark } = useTheme();

  if (!message) return null;

  return (
    <div className="fixed top-4 left-0 right-0 z-50 max-w-[390px] mx-auto px-4 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-200">
      <div
        id="cart-toast-alert"
        className={`pointer-events-auto px-3.5 py-2.5 rounded-2xl shadow-2xl flex items-center justify-between gap-2 border backdrop-blur-md transition-colors ${
          isDark
            ? 'bg-[#0a0f0d] text-white border-[#C8180F]/40'
            : 'bg-white text-stone-900 border-stone-200 shadow-stone-300/40'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-[#C8180F] flex items-center justify-center text-white flex-shrink-0 shadow-xs">
            <ShoppingCart className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span
            className={`font-bold text-xs truncate ${
              isDark ? 'text-stone-100' : 'text-stone-800'
            }`}
          >
            {message}
          </span>
        </div>
        <button
          id="toast-open-cart-btn"
          type="button"
          onClick={onOpenCart}
          className={`flex-shrink-0 text-xs font-black text-[#C8180F] flex items-center gap-1 transition-colors px-2 py-1 rounded-lg cursor-pointer ${
            isDark
              ? 'hover:text-red-300 hover:bg-stone-900'
              : 'hover:text-[#a51410] hover:bg-stone-100'
          }`}
        >
          <span>Ver</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
