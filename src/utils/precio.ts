/** Conversiones entre pesos visibles y centavos persistidos. */

/** Centavos → texto para un input de precio (sin símbolo ni separadores). */
export function centavosAInput(cents: number): string {
  const valor = Number.isFinite(cents) ? cents / 100 : 0;
  if (Number.isInteger(valor)) return String(valor);
  return valor.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

/** Texto del input → centavos. Acepta coma o punto decimal. */
export function inputACentavos(valor: string): number {
  const limpio = String(valor || '')
    .trim()
    .replace(/\s/g, '')
    .replace(',', '.')
    .replace(/[^0-9.]/g, '');
  if (!limpio) return 0;
  const partes = limpio.split('.');
  const entero = partes[0] || '0';
  const decimales = (partes[1] || '').slice(0, 2).padEnd(2, '0');
  return Math.max(0, Math.round(Number(`${entero}.${decimales}`) * 100));
}

/** Solo dígitos y un separador decimal, para el input del panel. */
export function limpiarEntradaPrecio(valor: string): string {
  return String(valor || '')
    .replace(',', '.')
    .replace(/[^0-9.]/g, '')
    .replace(/(\..*)\./g, '$1');
}
