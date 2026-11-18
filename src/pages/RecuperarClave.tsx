import { useState, type FormEvent } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { btnPrimary, inputClass, labelClass } from '../components/admin/ui';

const MENSAJE_EXITO =
  'Si el email está registrado, recibirás instrucciones en los próximos minutos. El link expira en 1 hora.';

export default function RecuperarClave() {
  const [email, setEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Ingrese el email del administrador.');
      return;
    }

    setCargando(true);
    try {
      const respuesta = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), website_url: websiteUrl }),
      });
      const datos = await respuesta.json().catch(() => null);

      if (datos?.error === 'RATE_LIMIT') {
        setError(
          datos.mensaje ||
            'Demasiados pedidos seguidos. Espere unos minutos y vuelva a intentar.'
        );
        return;
      }

      // Por seguridad el backend responde igual exista o no el email.
      setEnviado(true);
    } catch {
      setError('No pudimos procesar el pedido. Intente de nuevo en unos segundos.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4 py-8 font-poppins">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <img
            src="/logo-b.webp"
            alt="Cuadra"
            width={64}
            height={64}
            className="mb-3 h-16 w-16 object-contain"
          />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C8180F]">
            Cuadra · Administración
          </p>
          <h1 className="mt-1 text-2xl font-black text-stone-900">Recuperar clave</h1>
          <p className="mt-1 text-xs text-stone-500">
            Le enviamos un link para crear una clave nueva.
          </p>
        </div>

        {enviado ? (
          <div className="space-y-4">
            <div
              role="status"
              className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-800"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1 whitespace-normal break-words">
                {MENSAJE_EXITO}
              </span>
            </div>
            <a href="/admin" className={`${btnPrimary} w-full py-2.5 text-sm`}>
              <ArrowLeft className="h-4 w-4" />
              Volver al login
            </a>
          </div>
        ) : (
          <form onSubmit={enviar} className="space-y-3" noValidate>
            {/* Honeypot: invisible para personas, tentador para bots. */}
            <input
              type="text"
              name="website_url"
              value={websiteUrl}
              onChange={(evento) => setWebsiteUrl(evento.target.value)}
              style={{ position: 'absolute', left: '-9999px' }}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 whitespace-normal break-words">{error}</span>
              </div>
            )}

            <label className="block">
              <span className={labelClass}>Email del administrador</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  className={`${inputClass} pl-9`}
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(evento) => setEmail(evento.target.value)}
                  placeholder="admin@cuadra.app"
                  maxLength={254}
                  autoFocus
                />
              </div>
            </label>

            <button
              type="submit"
              className={`${btnPrimary} w-full py-2.5 text-sm`}
              disabled={cargando}
            >
              {cargando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              {cargando ? 'Enviando.' : 'Enviar link de recuperación'}
            </button>
          </form>
        )}

        <div className="mt-5 flex items-center justify-center border-t border-stone-100 pt-4">
          <a
            href="/admin"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-500 transition hover:text-stone-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al login
          </a>
        </div>
      </div>
    </div>
  );
}
