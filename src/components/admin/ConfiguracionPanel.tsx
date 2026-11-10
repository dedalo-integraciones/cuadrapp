import React, { useEffect, useState } from 'react';
import type { ParametrosAdmin } from '../../types';
import { Campo, btnPrimary, inputClass } from './ui';
import { Loader2, Save } from 'lucide-react';

interface ConfiguracionPanelProps {
  parametros: ParametrosAdmin;
  guardando: boolean;
  error: string | null;
  onGuardar: (datos: Record<string, unknown>) => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const [errorLocal, setErrorLocal] = useState('');

  useEffect(() => {
    setForm(parametros);
    setRedes({
      facebook: String(parametros.redes?.facebook || ''),
      instagram: String(parametros.redes?.instagram || ''),
      tiktok: String(parametros.redes?.tiktok || ''),
    });
  }, [parametros]);

  const cambiar = (campo: keyof ParametrosAdmin, valor: string) => {
    setForm((actual) => ({ ...actual, [campo]: valor }));
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
    });
  };

  return (
    <form onSubmit={enviar} className="space-y-4">
      {(error || errorLocal) && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          {error || errorLocal}
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
          <Campo label="Documento fiscal">
            <input
              className={inputClass}
              value={form.documento_fiscal}
              onChange={(e) => cambiar('documento_fiscal', e.target.value)}
              maxLength={40}
            />
          </Campo>
          <Campo label="Teléfono">
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
          <Campo label="Horario de atención">
            <input
              className={inputClass}
              value={form.horario_atencion}
              onChange={(e) => cambiar('horario_atencion', e.target.value)}
              maxLength={120}
              placeholder="Ej.: Lunes a sábado de 11:00 a 23:00"
            />
          </Campo>
          <Campo label="Email de contacto">
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
          <Campo label="Línea 1">
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
          <Campo label="Localidad">
            <input
              className={inputClass}
              value={form.localidad}
              onChange={(e) => cambiar('localidad', e.target.value)}
              maxLength={80}
            />
          </Campo>
          <Campo label="Provincia o estado">
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
          <Campo label="País">
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
