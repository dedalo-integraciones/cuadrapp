import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
} from 'lucide-react';
import { btnPrimary, inputClass, labelClass } from '../components/admin/ui';

const MINIMO_CLAVE = 8;
const MAXIMO_CLAVE = 72;

export default function RestablecerClave() {
  const token = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get('token') || '';
    } catch {
      return '';
    }
  }, []);

  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [verNueva, setVerNueva] = useState(false);
  const [verConfirmacion, setVerConfirmacion] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);
  const [estadoLink, setEstadoLink] = useState<'verificando' | 'valido' | 'invalido'>(
    token ? 'verificando' : 'invalido'
  );

  useEffect(() => {
    if (!token) {
      setError(
        'El link de recuperación no es válido o le falta el token. Pida uno nuevo.'
      );
      return;
    }

    // Se consulta la vigencia al abrir la pantalla: si el link ya se usó o
    // venció, se avisa antes de que la persona escriba la clave nueva.
    const control = new AbortController();
    fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, verificar: true }),
      signal: control.signal,
    })
      .then((respuesta) => respuesta.json())
      .then((datos) => {
        if (datos?.ok === true && datos?.valido === true) {
          setEstadoLink('valido');
          return;
        }
        setEstadoLink('invalido');
        setError(
          'El link de recuperación es inválido, ya se usó o venció. Pida uno nuevo.'
        );
      })
      .catch(() => {
        // Si falla la consulta por red, se permite intentar el cambio igual.
        if (!control.signal.aborted) setEstadoLink('valido');
      });

    return () => control.abort();
  }, [token]);

  useEffect(() => {
    if (!listo) return;
    const temporizador = window.setTimeout(() => {
      window.location.assign('/admin');
    }, 2000);
    return () => window.clearTimeout(temporizador);
  }, [listo]);

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    setError(null);

    if (nueva.length < MINIMO_CLAVE) {
      setError(`La clave debe tener al menos ${MINIMO_CLAVE} caracteres.`);
      return;
    }
    if (nueva.length > MAXIMO_CLAVE) {
      setError(`La clave no puede superar ${MAXIMO_CLAVE} caracteres.`);
      return;
    }
    if (nueva !== confirmacion) {
      setError('Las claves no coinciden.');
      return;
    }

    setCargando(true);
    try {
      const respuesta = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          nueva_password: nueva,
          website_url: websiteUrl,
        }),
      });
      const datos = await respuesta.json().catch(() => null);

      if (datos?.ok) {
        setListo(true);
        return;
      }

      setError(
        datos?.mensaje ||
          'No pudimos actualizar la clave. Pida un link nuevo e intente otra vez.'
      );
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
          <h1 className="mt-1 text-2xl font-black text-stone-900">Nueva clave</h1>
          <p className="mt-1 text-xs text-stone-500">
            Elija una clave de al menos {MINIMO_CLAVE} caracteres.
          </p>
        </div>

        {listo ? (
          <div
            role="status"
            className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-800"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1 whitespace-normal break-words">
              Clave actualizada. Redirigiendo al login...
            </span>
          </div>
        ) : (
          <>
            {estadoLink === 'verificando' && (
              <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-bold text-stone-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Validando el link...
              </div>
            )}

            {estadoLink === 'invalido' && error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-700">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 whitespace-normal break-words">{error}</span>
              </div>
            )}

            {estadoLink === 'valido' && (
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
                  <span className={labelClass}>Nueva clave</span>
                  <div className="relative">
                    <input
                      className={`${inputClass} pr-10`}
                      type={verNueva ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={nueva}
                      onChange={(evento) => setNueva(evento.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      maxLength={MAXIMO_CLAVE}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setVerNueva((valor) => !valor)}
                      aria-label={verNueva ? 'Ocultar clave' : 'Mostrar clave'}
                      className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
                    >
                      {verNueva ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>

                <label className="block">
                  <span className={labelClass}>Confirmar clave</span>
                  <div className="relative">
                    <input
                      className={`${inputClass} pr-10`}
                      type={verConfirmacion ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmacion}
                      onChange={(evento) => setConfirmacion(evento.target.value)}
                      placeholder="Repita la clave"
                      maxLength={MAXIMO_CLAVE}
                    />
                    <button
                      type="button"
                      onClick={() => setVerConfirmacion((valor) => !valor)}
                      aria-label={verConfirmacion ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                      className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
                    >
                      {verConfirmacion ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </label>

                <button
                  type="submit"
                  className={`${btnPrimary} w-full py-2.5 text-sm`}
                  disabled={cargando || !token}
                >
                  {cargando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4" />
                  )}
                  {cargando ? 'Actualizando.' : 'Restablecer clave'}
                </button>
              </form>
            )}
          </>
        )}

        <div className="mt-5 flex items-center justify-center border-t border-stone-100 pt-4">
          <a
            href="/recuperar-clave"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-500 transition hover:text-stone-900"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Pedir un link nuevo
          </a>
        </div>
      </div>
    </div>
  );
}
