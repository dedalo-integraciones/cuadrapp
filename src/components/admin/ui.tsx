import React, { useEffect } from 'react';
import { X, Loader2, AlertTriangle } from 'lucide-react';

export const inputClass =
  'w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C8180F] focus:border-transparent transition';

export const labelClass =
  'block text-[11px] font-bold uppercase tracking-wide text-stone-600 mb-1';

export const btnPrimary =
  'inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#C8180F] px-3.5 py-2 text-xs font-black text-white shadow-sm transition hover:bg-[#a51410] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

export const btnSecondary =
  'inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-black text-stone-700 shadow-sm transition hover:bg-stone-100 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

export const btnDanger =
  'inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-black text-white shadow-sm transition hover:bg-rose-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

interface CampoProps {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Campo: React.FC<CampoProps> = ({ label, hint, required, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className={labelClass}>
      {label}
      {required && <span className="text-[#C8180F]"> *</span>}
    </span>
    {children}
    {hint && <span className="mt-1 block text-[10px] leading-snug text-stone-500">{hint}</span>}
  </label>
);

interface ModalProps {
  titulo: string;
  subtitulo?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  ancho?: string;
}

export const Modal: React.FC<ModalProps> = ({
  titulo,
  subtitulo,
  onClose,
  children,
  footer,
  ancho = 'max-w-2xl',
}) => {
  useEffect(() => {
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', alPresionar);
    return () => {
      document.body.style.overflow = previo;
      window.removeEventListener('keydown', alPresionar);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`relative z-10 w-full ${ancho} max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl border border-stone-200 bg-white shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-stone-200 px-4 py-3 shrink-0">
          <div className="min-w-0">
            <h3 className="font-black text-base text-stone-900 leading-tight">{titulo}</h3>
            {subtitulo && <p className="text-[11px] text-stone-500 mt-0.5">{subtitulo}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">{children}</div>

        {footer && (
          <div className="border-t border-stone-200 bg-stone-50 px-4 py-3 shrink-0">{footer}</div>
        )}
      </div>
    </div>
  );
};

interface ConfirmDialogProps {
  titulo: string;
  mensaje: string;
  etiqueta: string;
  peligro?: boolean;
  doble?: boolean;
  procesando?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  titulo,
  mensaje,
  etiqueta,
  peligro = false,
  doble = false,
  procesando = false,
  onCancel,
  onConfirm,
}) => {
  const [paso, setPaso] = React.useState(1);

  const avanzar = () => {
    if (doble && paso === 1) {
      setPaso(2);
      return;
    }
    onConfirm();
  };

  return (
    <Modal
      titulo={titulo}
      onClose={procesando ? () => undefined : onCancel}
      ancho="max-w-md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button type="button" className={btnSecondary} onClick={onCancel} disabled={procesando}>
            Cancelar
          </button>
          <button
            type="button"
            className={peligro ? btnDanger : btnPrimary}
            onClick={avanzar}
            disabled={procesando}
          >
            {procesando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {doble && paso === 1 ? 'Continuar' : etiqueta}
          </button>
        </div>
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            peligro ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-2 text-sm text-stone-700">
          <p>{mensaje}</p>
          {doble && paso === 2 && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
              Esta acción es permanente y no se puede deshacer. Confirme una vez más para continuar.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};

interface AdminToastProps {
  tipo: 'exito' | 'error';
  mensaje: string;
  onClose: () => void;
}

export const AdminToast: React.FC<AdminToastProps> = ({ tipo, mensaje, onClose }) => (
  <div className="fixed top-4 right-4 z-[60] w-[min(360px,calc(100vw-2rem))]">
    <div
      className={`flex items-start gap-2 rounded-2xl border px-3.5 py-3 text-xs shadow-2xl ${
        tipo === 'exito'
          ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
          : 'border-rose-300 bg-rose-50 text-rose-900'
      }`}
    >
      <span className="flex-1 font-bold leading-snug">{mensaje}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar aviso"
        className="text-current opacity-60 hover:opacity-100 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
);

export const Cargando: React.FC<{ texto?: string }> = ({ texto = 'Cargando…' }) => (
  <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-stone-500">
    <Loader2 className="w-4 h-4 animate-spin" />
    <span>{texto}</span>
  </div>
);
