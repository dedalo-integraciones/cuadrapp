import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { tenantActual } from '../config';
import { fetchTenant } from '../services/catalogoService';
import type { TenantPublico } from '../types';

const TENANT = tenantActual();
const DEDALO_URL = 'https://dedalointegraciones.vercel.app/';

export function direccionCompleta(tenant: TenantPublico): string {
  const partes = [
    tenant.direccion?.linea1,
    tenant.direccion?.linea2,
    tenant.direccion?.localidad,
    tenant.direccion?.provincia,
    tenant.direccion?.pais,
  ];
  // Evita repetir "Mendoza, Mendoza" cuando ciudad y provincia se llaman igual.
  const vistas = new Set<string>();
  return partes
    .filter((parte) => {
      const limpio = String(parte || '').trim();
      const clave = limpio.toLowerCase();
      if (!limpio || vistas.has(clave)) return false;
      vistas.add(clave);
      return true;
    })
    .join(', ');
}

export function fechaLegible(valor: string): string {
  const fecha = String(valor || '').slice(0, 10);
  const partes = fecha.split('-');
  if (partes.length !== 3) return '';
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export function precioEnPesos(cents: number | null, simbolo = '$'): string {
  if (cents === null || cents === undefined) return '';
  if (cents === 0) return 'sin cargo';
  return `${simbolo} ${(cents / 100).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

interface LegalShellProps {
  titulo: string;
  children: (tenant: TenantPublico) => React.ReactNode;
}

/**
 * Marco común de las páginas legales. Si el negocio todavía no cargó los datos
 * obligatorios, no se publica contenido inventado: se muestra un aviso.
 */
const LegalShell: React.FC<LegalShellProps> = ({ titulo, children }) => {
  const [tenant, setTenant] = useState<TenantPublico | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const control = new AbortController();
    fetchTenant(TENANT, control.signal)
      .then(setTenant)
      .catch((e) => {
        if (!control.signal.aborted) {
          setError(e instanceof Error ? e.message : 'No se pudo cargar la información.');
        }
      });
    return () => control.abort();
  }, []);

  const completo = Boolean(tenant?.legal?.completo);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      <div className="mx-auto w-full max-w-[390px] px-4 py-5">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a la tienda
        </a>

        <h1 className="mt-3 text-xl font-black leading-tight text-stone-900">{titulo}</h1>
        {tenant?.legal?.actualizado_en && completo && (
          <p className="mt-1 text-[11px] text-stone-500">
            Última actualización: {fechaLegible(tenant.legal.actualizado_en)}
          </p>
        )}

        {!tenant && !error && (
          <div className="mt-6 flex items-center gap-2 text-sm font-bold text-stone-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando…
          </div>
        )}

        {error && (
          <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
            {error}
          </p>
        )}

        {tenant && !completo && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
            <p className="font-black">Documentos en preparación</p>
            <p className="mt-1">
              {tenant.name} todavía no publicó sus datos legales. Cuando estén cargados,
              esta página mostrará el documento correspondiente.
            </p>
          </div>
        )}

        {tenant && completo && (
          <div className="legal mt-4 space-y-4 text-[13px] leading-relaxed text-stone-700">
            {children(tenant)}
          </div>
        )}

        <footer className="mt-8 border-t border-stone-200 pt-4 text-center text-[11px] text-stone-500">
          <p>
            {tenant?.name || 'Cuadra'} · Pedidos por WhatsApp
          </p>
          <p className="mt-1">
            powered by{' '}
            <a
              href={DEDALO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-stone-600 hover:text-stone-900"
            >
              Dédalo
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LegalShell;
