import React, { useState } from 'react';
import type { CategoriaAdmin, ProductoAdmin, RubroAdmin } from '../../types';
import { centavosAInput, inputACentavos, limpiarEntradaPrecio } from '../../utils/precio';
import { ProductImage } from '../ProductImage';
import { Campo, Modal, btnDanger, btnPrimary, btnSecondary, inputClass } from './ui';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';

interface ProductoFormProps {
  producto: ProductoAdmin | null;
  categorias: CategoriaAdmin[];
  rubros: RubroAdmin[];
  simbolo: string;
  guardando: boolean;
  error: string | null;
  onClose: () => void;
  onGuardar: (datos: Record<string, unknown>) => void;
  onEliminar?: () => void;
  onSubirImagen: (archivo: File) => Promise<string>;
}

export const ProductoForm: React.FC<ProductoFormProps> = ({
  producto,
  categorias,
  rubros,
  simbolo,
  guardando,
  error,
  onClose,
  onGuardar,
  onEliminar,
  onSubirImagen,
}) => {
  const [form, setForm] = useState({
    id_categoria: producto?.id_categoria || categorias[0]?.id || 0,
    nombre: producto?.nombre || '',
    detalle_1: producto?.detalle_1 || '',
    detalle_2: producto?.detalle_2 || '',
    precio: producto ? centavosAInput(producto.precio_cents) : '',
    color: producto?.color || '#C91810',
    activo: producto?.activo ?? true,
    destacado: producto?.destacado ?? false,
    popular: producto?.popular ?? false,
    orden: producto?.orden ?? 0,
    imagen: producto?.imagen || '',
  });
  const [errorLocal, setErrorLocal] = useState('');
  const [errorImagen, setErrorImagen] = useState('');
  const [subiendo, setSubiendo] = useState(false);

  const cambiar = (campo: keyof typeof form, valor: string | number | boolean) => {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  };

  const subir = async (evento: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!archivo) return;
    setErrorImagen('');
    setSubiendo(true);
    try {
      const url = await onSubirImagen(archivo);
      cambiar('imagen', url);
    } catch (fallo) {
      setErrorImagen(fallo instanceof Error ? fallo.message : 'No se pudo subir la imagen.');
    } finally {
      setSubiendo(false);
    }
  };

  const enviar = (evento: React.FormEvent) => {
    evento.preventDefault();
    setErrorLocal('');
    if (!form.id_categoria) {
      setErrorLocal('Seleccione una categoría.');
      return;
    }
    if (!form.nombre.trim()) {
      setErrorLocal('El nombre es obligatorio.');
      return;
    }
    onGuardar({
      id_categoria: Number(form.id_categoria),
      nombre: form.nombre.trim(),
      detalle_1: form.detalle_1.trim(),
      detalle_2: form.detalle_2.trim(),
      precio_cents: inputACentavos(form.precio),
      color: form.color,
      activo: form.activo,
      destacado: form.destacado,
      popular: form.popular,
      orden: Number(form.orden) || 0,
      imagen: form.imagen.trim(),
    });
  };

  const mensaje = error || errorLocal;

  return (
    <Modal
      titulo={producto ? 'Editar producto' : 'Nuevo producto'}
      subtitulo={producto ? `ID ${producto.id}` : 'Complete los datos y guarde.'}
      onClose={onClose}
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            {producto && onEliminar && (
              <button type="button" className={btnDanger} onClick={onEliminar} disabled={guardando}>
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </button>
            )}
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" className={btnSecondary} onClick={onClose} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" form="form-producto" className={btnPrimary} disabled={guardando}>
              {guardando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Guardar producto
            </button>
          </div>
        </div>
      }
    >
      <form id="form-producto" onSubmit={enviar} className="space-y-4">
        {mensaje && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
            {mensaje}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Categoría" required>
            <select
              className={inputClass}
              value={form.id_categoria}
              onChange={(e) => cambiar('id_categoria', Number(e.target.value))}
            >
              <option value={0}>Seleccione una categoría…</option>
              {rubros.map((rubro) => (
                <optgroup key={rubro.id} label={rubro.rubro}>
                  {categorias
                    .filter((categoria) => categoria.id_rubro === rubro.id)
                    .map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.categoria}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </Campo>

          <Campo label="Nombre" required>
            <input
              className={inputClass}
              value={form.nombre}
              onChange={(e) => cambiar('nombre', e.target.value)}
              maxLength={120}
              placeholder="Ej.: Lomo especial"
            />
          </Campo>

          <Campo label="Detalle 1" hint="Máximo 200 caracteres.">
            <input
              className={inputClass}
              value={form.detalle_1}
              onChange={(e) => cambiar('detalle_1', e.target.value)}
              maxLength={200}
              placeholder="Ej.: Pan francés o árabe"
            />
          </Campo>

          <Campo label="Detalle 2" hint="Máximo 200 caracteres.">
            <input
              className={inputClass}
              value={form.detalle_2}
              onChange={(e) => cambiar('detalle_2', e.target.value)}
              maxLength={200}
              placeholder="Ej.: lechuga, tomate y condimentos"
            />
          </Campo>

          <Campo label={`Precio (${simbolo})`} hint="Acepta coma o punto decimal. Vacío equivale a 0.">
            <input
              className={inputClass}
              value={form.precio}
              onChange={(e) => cambiar('precio', limpiarEntradaPrecio(e.target.value))}
              inputMode="decimal"
              placeholder="Ej.: 18000"
            />
          </Campo>

          <Campo label="Orden" hint="Número menor aparece primero dentro de la categoría.">
            <input
              className={inputClass}
              type="number"
              value={form.orden}
              onChange={(e) => cambiar('orden', Number(e.target.value))}
              min={0}
              max={9999}
            />
          </Campo>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Color de la tarjeta">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.color}
                onChange={(e) => cambiar('color', e.target.value.toUpperCase())}
                className="h-10 w-14 cursor-pointer rounded-lg border border-stone-300 bg-white p-1"
                aria-label="Color de la tarjeta"
              />
              <span className="text-xs font-black text-stone-600">{form.color}</span>
            </div>
          </Campo>

          <Campo label="Imagen">
            <div className="flex items-center gap-2">
              <input
                className={inputClass}
                value={form.imagen}
                onChange={(e) => cambiar('imagen', e.target.value)}
                placeholder="https://… o /gallery/…"
              />
              <label
                className={`${btnSecondary} shrink-0 ${subiendo ? 'opacity-50 pointer-events-none' : ''}`}
                title="Subir imagen"
              >
                {subiendo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Subir</span>
                <input type="file" accept="image/*" className="hidden" onChange={subir} />
              </label>
            </div>
          </Campo>
        </div>

        {errorImagen && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
            {errorImagen}
          </p>
        )}

        {form.imagen && (
          <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-2">
            <ProductImage
              src={form.imagen}
              alt="Vista previa"
              containerClassName="w-16 h-16 rounded-xl overflow-hidden border border-stone-200"
            />
            <div className="min-w-0 text-[11px] text-stone-500">
              <p className="font-bold text-stone-700">Vista previa</p>
              <p className="truncate">{form.imagen}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2.5">
          {[
            { clave: 'activo' as const, etiqueta: 'Activo (visible en la tienda)' },
            { clave: 'destacado' as const, etiqueta: 'Destacado' },
            { clave: 'popular' as const, etiqueta: 'Popular' },
          ].map((opcion) => (
            <label key={opcion.clave} className="inline-flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form[opcion.clave]}
                onChange={(e) => cambiar(opcion.clave, e.target.checked)}
                className="h-4 w-4 accent-[#C8180F] cursor-pointer"
              />
              {opcion.etiqueta}
            </label>
          ))}
        </div>
      </form>
    </Modal>
  );
};

export default ProductoForm;
