import React, { useState } from 'react';
import type { CategoriaAdmin, RubroAdmin } from '../../types';
import { Campo, Modal, btnDanger, btnPrimary, btnSecondary, inputClass } from './ui';
import { Loader2, Trash2 } from 'lucide-react';

interface CategoriaFormProps {
  categoria: CategoriaAdmin | null;
  rubros: RubroAdmin[];
  guardando: boolean;
  error: string | null;
  onClose: () => void;
  onGuardar: (datos: Record<string, unknown>) => void;
  onEliminar?: () => void;
}

export const CategoriaForm: React.FC<CategoriaFormProps> = ({
  categoria,
  rubros,
  guardando,
  error,
  onClose,
  onGuardar,
  onEliminar,
}) => {
  const [form, setForm] = useState({
    id_rubro: categoria?.id_rubro || rubros[0]?.id || 0,
    categoria: categoria?.categoria || '',
    descripcion: categoria?.descripcion || '',
    orden: categoria?.orden ?? 0,
    color: categoria?.color || '#C91810',
    activo: categoria?.activo ?? true,
  });
  const [errorLocal, setErrorLocal] = useState('');

  const cambiar = (campo: keyof typeof form, valor: string | number | boolean) => {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  };

  const enviar = (evento: React.FormEvent) => {
    evento.preventDefault();
    setErrorLocal('');
    if (!form.id_rubro) {
      setErrorLocal('Seleccione un rubro.');
      return;
    }
    if (!form.categoria.trim()) {
      setErrorLocal('El nombre de la categoría es obligatorio.');
      return;
    }
    onGuardar({
      id_rubro: Number(form.id_rubro),
      categoria: form.categoria.trim(),
      descripcion: form.descripcion.trim(),
      orden: Number(form.orden) || 0,
      color: form.color,
      activo: form.activo,
    });
  };

  return (
    <Modal
      titulo={categoria ? 'Editar categoría' : 'Nueva categoría'}
      subtitulo={categoria ? `ID ${categoria.id}` : 'Las categorías agrupan productos dentro de un rubro.'}
      onClose={onClose}
      ancho="max-w-xl"
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            {categoria && onEliminar && (
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
            <button type="submit" form="form-categoria" className={btnPrimary} disabled={guardando}>
              {guardando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Guardar categoría
            </button>
          </div>
        </div>
      }
    >
      <form id="form-categoria" onSubmit={enviar} className="space-y-4">
        {(error || errorLocal) && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
            {error || errorLocal}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Rubro" required>
            <select
              className={inputClass}
              value={form.id_rubro}
              onChange={(e) => cambiar('id_rubro', Number(e.target.value))}
            >
              <option value={0}>Seleccione un rubro…</option>
              {rubros.map((rubro) => (
                <option key={rubro.id} value={rubro.id}>
                  {rubro.rubro}
                </option>
              ))}
            </select>
          </Campo>

          <Campo label="Nombre" required>
            <input
              className={inputClass}
              value={form.categoria}
              onChange={(e) => cambiar('categoria', e.target.value)}
              maxLength={80}
              placeholder="Ej.: COMBOS"
            />
          </Campo>
        </div>

        <Campo label="Descripción" hint="Máximo 200 caracteres.">
          <input
            className={inputClass}
            value={form.descripcion}
            onChange={(e) => cambiar('descripcion', e.target.value)}
            maxLength={200}
            placeholder="Ej.: Combos completos"
          />
        </Campo>

        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Orden">
            <input
              className={inputClass}
              type="number"
              value={form.orden}
              onChange={(e) => cambiar('orden', Number(e.target.value))}
              min={0}
              max={9999}
            />
          </Campo>

          <Campo label="Color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.color}
                onChange={(e) => cambiar('color', e.target.value.toUpperCase())}
                className="h-10 w-14 cursor-pointer rounded-lg border border-stone-300 bg-white p-1"
                aria-label="Color de la categoría"
              />
              <span className="text-xs font-black text-stone-600">{form.color}</span>
            </div>
          </Campo>
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(e) => cambiar('activo', e.target.checked)}
            className="h-4 w-4 accent-[#C8180F] cursor-pointer"
          />
          Activa (visible en la tienda)
        </label>
      </form>
    </Modal>
  );
};

export default CategoriaForm;
