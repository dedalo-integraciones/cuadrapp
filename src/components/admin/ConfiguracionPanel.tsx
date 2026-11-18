import React, { useEffect, useState } from 'react';
import type { LegalTenant, ParametrosAdmin } from '../../types';
import { Campo, btnPrimary, inputClass } from './ui';
import { Loader2, Save } from 'lucide-react';

interface ConfiguracionPanelProps {
  parametros: ParametrosAdmin;
  guardando: boolean;
  error: string | null;
  onGuardar: (datos: Record<string, unknown>) => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mismos obligatorios que valida el servidor, para avisar antes de enviar. */
function faltantesCliente(form: ParametrosAdmin): string[] {
  const faltan: string[] = [];
  const agregar = (valor: unknown, etiqueta: string) => {
    if (!String(valor ?? '').trim()) faltan.push(etiqueta);
  };

  agregar(form.legal.razon_social, 'razón social');
  agregar(form.documento_fiscal, 'documento fiscal');
  agregar(form.direccion_linea1, 'dirección');
  agregar(form.localidad, 'localidad');
  agregar(form.provincia_estado, 'provincia');
  agregar(form.pais, 'país');
  agregar(form.email_contacto, 'email de contacto');
  agregar(form.telefono, 'teléfono');
  agregar(form.horario_atencion, 'horario de atención');
  agregar(form.legal.jurisdiccion, 'jurisdicción');
  agregar(form.legal.medios_pago, 'medios de pago');
  agregar(form.legal.cambios_condiciones, 'condiciones de cambios y devoluciones');

  if (!form.legal.entrega_retiro && !form.legal.entrega_envio) {
    faltan.push('forma de entrega (retiro o envío)');
  }
  if (form.legal.entrega_envio) {
    agregar(form.legal.entrega_zonas, 'zonas de envío');
    agregar(form.legal.entrega_demora, 'demora estimada de envío');
    if (form.legal.envio_costo_cents === null) faltan.push('costo de envío');
  }
  if (form.legal.cambios_plazo_dias === null) faltan.push('plazo de cambios');

  return faltan;
}

export const ConfiguracionPanel: React.FC<ConfiguracionPanelProps> = ({
  parametros,
  guardando,
  error,
  onGuardar,
}) => {
  const [form, setForm] = useState(parametros);
  const [redes, setRedes] = useState({
    facebook: String(parametros.redes?.facebook || ''),
    instagram: String(parametros.redes?.instagram || ''),
    tiktok: String(parametros.redes?.tiktok || ''),
  });
  const [costoEnvio, setCostoEnvio] = useState(
    parametros.legal?.envio_costo_cents === null || parametros.legal?.envio_costo_cents === undefined
      ? ''
      : String(parametros.legal.envio_costo_cents / 100)
  );
  const [errorLocal, setErrorLocal] = useState('');

  useEffect(() => {
    setForm(parametros);
    setRedes({
      facebook: String(parametros.redes?.facebook || ''),
      instagram: String(parametros.redes?.instagram || ''),
      tiktok: String(parametros.redes?.tiktok || ''),
    });
    setCostoEnvio(
      parametros.legal?.envio_costo_cents === null || parametros.legal?.envio_costo_cents === undefined
        ? ''
        : String(parametros.legal.envio_costo_cents / 100)
    );
  }, [parametros]);

  const cambiar = (campo: keyof ParametrosAdmin, valor: string) => {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  };

  const cambiarLegal = <K extends keyof LegalTenant>(campo: K, valor: LegalTenant[K]) => {
    setForm((actual) => ({ ...actual, legal: { ...actual.legal, [campo]: valor } }));
  };

  const enviar = (evento: React.FormEvent) => {
    evento.preventDefault();
    setErrorLocal('');
    if (!form.nombre_comercial.trim()) {
      setErrorLocal('El nombre comercial es obligatorio.');
      return;
    }
    if (!form.whatsapp_pedidos.trim()) {
      setErrorLocal('El WhatsApp de pedidos es obligatorio.');
      return;
    }
    if (form.email_contacto.trim() && !EMAIL_RE.test(form.email_contacto.trim())) {
      setErrorLocal('El email de contacto no tiene un formato válido.');
      return;
    }
    if (form.email_pedidos.trim() && !EMAIL_RE.test(form.email_pedidos.trim())) {
      setErrorLocal('El email de pedidos no tiene un formato válido.');
      return;
    }

    const costo = costoEnvio.trim() === '' ? null : Number(costoEnvio.replace(',', '.'));
    if (costo !== null && (!Number.isFinite(costo) || costo < 0)) {
      setErrorLocal('El costo de envío debe ser un número mayor o igual a 0.');
      return;
    }

    const faltan = faltantesCliente(form);
    if (faltan.length > 0) {
      setErrorLocal(`Complete los datos legales obligatorios: ${faltan.join(', ')}.`);
      return;
    }

    onGuardar({
      nombre_comercial: form.nombre_comercial.trim(),
      documento_fiscal: form.documento_fiscal.trim(),
      telefono: form.telefono.trim(),
      whatsapp: form.whatsapp.trim(),
      whatsapp_pedidos: form.whatsapp_pedidos.trim(),
      email_contacto: form.email_contacto.trim(),
      email_pedidos: form.email_pedidos.trim(),
      horario_atencion: form.horario_atencion.trim(),
      direccion_linea1: form.direccion_linea1.trim(),
      direccion_linea2: form.direccion_linea2.trim(),
      localidad: form.localidad.trim(),
      provincia_estado: form.provincia_estado.trim(),
      codigo_postal: form.codigo_postal.trim(),
      pais: form.pais.trim(),
      moneda_simbolo: form.moneda_simbolo.trim() || '$',
      redes: {
        facebook: redes.facebook.trim(),
        instagram: redes.instagram.trim(),
        tiktok: redes.tiktok.trim(),
      },
      legal: {
        ...form.legal,
        razon_social: form.legal.razon_social.trim(),
        jurisdiccion: form.legal.jurisdiccion.trim(),
        entrega_zonas: form.legal.entrega_zonas.trim(),
        entrega_demora: form.legal.entrega_demora.trim(),
        envio_costo_cents: costo === null ? null : Math.round(costo * 100),
        cambios_condiciones: form.legal.cambios_condiciones.trim(),
        medios_pago: form.legal.medios_pago.trim(),
        condiciones_extra: form.legal.condiciones_extra.trim(),
      },
    });
  };

  return (
    <form onSubmit={enviar} className="space-y-4">
      {(error || errorLocal) && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          {error || errorLocal}
        </div>
      )}

      {parametros.legal_faltantes.length > 0 && !errorLocal && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <p className="font-black">Faltan datos legales obligatorios</p>
          <p className="mt-1 leading-snug">
            Sin ellos no se pueden publicar los términos, la privacidad ni guardar la
            configuración: {parametros.legal_faltantes.join(', ')}.
          </p>
        </div>
      )}

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-black text-stone-900">Datos del negocio</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Campo label="Nombre comercial" required>
            <input
              className={inputClass}
              value={form.nombre_comercial}
              onChange={(e) => cambiar('nombre_comercial', e.target.value)}
              maxLength={120}
            />
          </Campo>
          <Campo label="Documento fiscal" required hint="CUIT del negocio. Se publica en los términos y condiciones.">
            <input
              className={inputClass}
              value={form.documento_fiscal}
              onChange={(e) => cambiar('documento_fiscal', e.target.value)}
              maxLength={40}
            />
          </Campo>
          <Campo label="Teléfono" required>
            <input
              className={inputClass}
              value={form.telefono}
              onChange={(e) => cambiar('telefono', e.target.value)}
              maxLength={40}
            />
          </Campo>
          <Campo label="WhatsApp general">
            <input
              className={inputClass}
              value={form.whatsapp}
              onChange={(e) => cambiar('whatsapp', e.target.value)}
              maxLength={40}
              placeholder="5492617202706"
            />
          </Campo>
          <Campo label="WhatsApp de pedidos" required hint="Número que recibe los pedidos del carrito.">
            <input
              className={inputClass}
              value={form.whatsapp_pedidos}
              onChange={(e) => cambiar('whatsapp_pedidos', e.target.value)}
              maxLength={40}
              placeholder="5492617202706"
            />
          </Campo>
          <Campo label="Horario de atención" required>
            <input
              className={inputClass}
              value={form.horario_atencion}
              onChange={(e) => cambiar('horario_atencion', e.target.value)}
              maxLength={120}
              placeholder="Ej.: Lunes a sábado de 11:00 a 23:00"
            />
          </Campo>
          <Campo label="Email de contacto" required>
            <input
              className={inputClass}
              type="email"
              value={form.email_contacto}
              onChange={(e) => cambiar('email_contacto', e.target.value)}
              maxLength={254}
            />
          </Campo>
          <Campo label="Email de pedidos">
            <input
              className={inputClass}
              type="email"
              value={form.email_pedidos}
              onChange={(e) => cambiar('email_pedidos', e.target.value)}
              maxLength={254}
            />
          </Campo>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-black text-stone-900">Dirección</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Campo label="Línea 1" required>
            <input
              className={inputClass}
              value={form.direccion_linea1}
              onChange={(e) => cambiar('direccion_linea1', e.target.value)}
              maxLength={160}
              placeholder="Calle y número"
            />
          </Campo>
          <Campo label="Línea 2">
            <input
              className={inputClass}
              value={form.direccion_linea2}
              onChange={(e) => cambiar('direccion_linea2', e.target.value)}
              maxLength={160}
              placeholder="Piso, departamento o referencia"
            />
          </Campo>
          <Campo label="Localidad" required>
            <input
              className={inputClass}
              value={form.localidad}
              onChange={(e) => cambiar('localidad', e.target.value)}
              maxLength={80}
            />
          </Campo>
          <Campo label="Provincia o estado" required>
            <input
              className={inputClass}
              value={form.provincia_estado}
              onChange={(e) => cambiar('provincia_estado', e.target.value)}
              maxLength={80}
            />
          </Campo>
          <Campo label="Código postal">
            <input
              className={inputClass}
              value={form.codigo_postal}
              onChange={(e) => cambiar('codigo_postal', e.target.value)}
              maxLength={20}
            />
          </Campo>
          <Campo label="País" required>
            <input
              className={inputClass}
              value={form.pais}
              onChange={(e) => cambiar('pais', e.target.value)}
              maxLength={60}
            />
          </Campo>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <h3 className="mb-1 text-sm font-black text-stone-900">Datos legales y comerciales</h3>
        <p className="mb-3 text-[11px] leading-snug text-stone-500">
          Se publican en los términos y condiciones y en la política de privacidad. Los
          campos con * son obligatorios: sin ellos el sitio no publica los documentos.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Razón social" required hint="Titular legal del negocio.">
            <input
              className={inputClass}
              value={form.legal.razon_social}
              onChange={(e) => cambiarLegal('razon_social', e.target.value)}
              maxLength={120}
            />
          </Campo>
          <Campo label="Jurisdicción" required hint="Por ejemplo: Mendoza, Argentina.">
            <input
              className={inputClass}
              value={form.legal.jurisdiccion}
              onChange={(e) => cambiarLegal('jurisdiccion', e.target.value)}
              maxLength={120}
            />
          </Campo>
          <Campo label="Medios de pago" required hint="Se muestran en los términos.">
            <input
              className={inputClass}
              value={form.legal.medios_pago}
              onChange={(e) => cambiarLegal('medios_pago', e.target.value)}
              maxLength={200}
            />
          </Campo>
          <Campo label="Plazo de cambios (días)" required>
            <input
              className={inputClass}
              type="number"
              min={0}
              step={1}
              value={form.legal.cambios_plazo_dias ?? ''}
              onChange={(e) =>
                cambiarLegal(
                  'cambios_plazo_dias',
                  e.target.value.trim() === '' ? null : Number(e.target.value)
                )
              }
            />
          </Campo>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="flex items-start gap-2 rounded-xl border border-stone-200 px-3 py-2 text-xs font-bold text-stone-700">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-[#C8180F]"
              checked={form.legal.entrega_retiro}
              onChange={(e) => cambiarLegal('entrega_retiro', e.target.checked)}
            />
            <span>
              Retiro en el local
              <span className="mt-0.5 block text-[10px] font-normal text-stone-500">
                El cliente retira el pedido en el domicilio del negocio.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 rounded-xl border border-stone-200 px-3 py-2 text-xs font-bold text-stone-700">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-[#C8180F]"
              checked={form.legal.entrega_envio}
              onChange={(e) => cambiarLegal('entrega_envio', e.target.checked)}
            />
            <span>
              Envío a domicilio
              <span className="mt-0.5 block text-[10px] font-normal text-stone-500">
                Se cobra o coordina según las zonas y el costo que cargues.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 rounded-xl border border-stone-200 px-3 py-2 text-xs font-bold text-stone-700">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-[#C8180F]"
              checked={form.legal.vende_alcohol}
              onChange={(e) => cambiarLegal('vende_alcohol', e.target.checked)}
            />
            <span>
              Vende alcohol
              <span className="mt-0.5 block text-[10px] font-normal text-stone-500">
                Agrega el aviso de 18+ y venta responsable.
              </span>
            </span>
          </label>
        </div>

        {form.legal.entrega_envio && (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Campo label="Zonas de envío" required>
              <input
                className={inputClass}
                value={form.legal.entrega_zonas}
                onChange={(e) => cambiarLegal('entrega_zonas', e.target.value)}
                maxLength={200}
              />
            </Campo>
            <Campo label="Demora estimada" required>
              <input
                className={inputClass}
                value={form.legal.entrega_demora}
                onChange={(e) => cambiarLegal('entrega_demora', e.target.value)}
                maxLength={120}
                placeholder="Ej.: 30 a 45 minutos"
              />
            </Campo>
            <Campo label="Costo de envío (pesos)" required hint="0 = sin cargo.">
              <input
                className={inputClass}
                type="number"
                min={0}
                step="0.01"
                value={costoEnvio}
                onChange={(e) => setCostoEnvio(e.target.value)}
              />
            </Campo>
          </div>
        )}

        <div className="mt-3 grid gap-3">
          <Campo label="Condiciones de cambios y devoluciones" required>
            <textarea
              className={inputClass}
              rows={3}
              value={form.legal.cambios_condiciones}
              onChange={(e) => cambiarLegal('cambios_condiciones', e.target.value)}
              maxLength={600}
              placeholder="Ej.: dentro de las 24 horas, con el producto en buen estado…"
            />
          </Campo>
          <Campo label="Condiciones adicionales" hint="Opcional. Se agrega al final de los términos.">
            <textarea
              className={inputClass}
              rows={2}
              value={form.legal.condiciones_extra}
              onChange={(e) => cambiarLegal('condiciones_extra', e.target.value)}
              maxLength={800}
            />
          </Campo>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-black text-stone-900">Redes sociales y moneda</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Facebook">
            <input
              className={inputClass}
              value={redes.facebook}
              onChange={(e) => setRedes({ ...redes, facebook: e.target.value })}
              maxLength={300}
              placeholder="https://facebook.com/…"
            />
          </Campo>
          <Campo label="Instagram">
            <input
              className={inputClass}
              value={redes.instagram}
              onChange={(e) => setRedes({ ...redes, instagram: e.target.value })}
              maxLength={300}
              placeholder="https://instagram.com/…"
            />
          </Campo>
          <Campo label="TikTok">
            <input
              className={inputClass}
              value={redes.tiktok}
              onChange={(e) => setRedes({ ...redes, tiktok: e.target.value })}
              maxLength={300}
              placeholder="https://tiktok.com/@…"
            />
          </Campo>
          <Campo label="Símbolo de moneda" hint="Máximo 3 caracteres.">
            <input
              className={inputClass}
              value={form.moneda_simbolo}
              onChange={(e) => cambiar('moneda_simbolo', e.target.value)}
              maxLength={3}
              placeholder="$"
            />
          </Campo>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <h3 className="mb-3 text-sm font-black text-stone-900">Estado del servicio</h3>
        <div className="grid gap-3 text-xs sm:grid-cols-3">
          <div>
            <p className="font-bold uppercase tracking-wide text-stone-500">Versión</p>
            <p className="mt-0.5 font-black text-stone-800">{form.mode || 'pedidos'}</p>
          </div>
          <div>
            <p className="font-bold uppercase tracking-wide text-stone-500">Límite de productos</p>
            <p className="mt-0.5 font-black text-stone-800">{form.max_registros}</p>
          </div>
          <div>
            <p className="font-bold uppercase tracking-wide text-stone-500">Vencimiento</p>
            <p className="mt-0.5 font-black text-stone-800">{form.fecha_vencimiento || 'Sin vencimiento'}</p>
            <p className="mt-0.5 text-[10px] leading-snug text-stone-500">
              Lo administra la plataforma. Al vencer, la tienda y el panel dejan de operar.
            </p>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button type="submit" className={btnPrimary} disabled={guardando}>
          {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Guardar configuración
        </button>
      </div>
    </form>
  );
};

export default ConfiguracionPanel;
