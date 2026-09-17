import mimgi_20_default from './mimgi_20_default.webp';
import mimgi_21_default from './mimgi_21_default.webp';
import mimgi_22_default from './mimgi_22_default.webp';
import mimgi_23_default from './mimgi_23_default.webp';
import mimgi_24_default from './mimgi_24_default.webp';
import mimgi_25_default from './mimgi_25_default.webp';
import mimgi_26_default from './mimgi_26_default.webp';
import mimgi_27_default from './mimgi_27_default.webp';
import mimgi_28_default from './mimgi_28_default.webp';
import mimgi_29_default from './mimgi_29_default.webp';
import mimgi_30_default from './mimgi_30_default.webp';
import mimgi_31_default from './mimgi_31_default.webp';
import mimgi_32_default from './mimgi_32_default.webp';
import mimgi_33_default from './mimgi_33_default.webp';
import mimgi_34_default from './mimgi_34_default.webp';
import mimgi_35_default from './mimgi_35_default.webp';
import mimgi_36_default from './mimgi_36_default.webp';
import mimgi_37_default from './mimgi_37_default.webp';

export const GALLERY_MAP: Record<string, string> = {
  'mimgi_20_default.webp': mimgi_20_default,
  'mimgi_21_default.webp': mimgi_21_default,
  'mimgi_22_default.webp': mimgi_22_default,
  'mimgi_23_default.webp': mimgi_23_default,
  'mimgi_24_default.webp': mimgi_24_default,
  'mimgi_25_default.webp': mimgi_25_default,
  'mimgi_26_default.webp': mimgi_26_default,
  'mimgi_27_default.webp': mimgi_27_default,
  'mimgi_28_default.webp': mimgi_28_default,
  'mimgi_29_default.webp': mimgi_29_default,
  'mimgi_30_default.webp': mimgi_30_default,
  'mimgi_31_default.webp': mimgi_31_default,
  'mimgi_32_default.webp': mimgi_32_default,
  'mimgi_33_default.webp': mimgi_33_default,
  'mimgi_34_default.webp': mimgi_34_default,
  'mimgi_35_default.webp': mimgi_35_default,
  'mimgi_36_default.webp': mimgi_36_default,
  'mimgi_37_default.webp': mimgi_37_default,
};

/**
 * Convierte el nombre de imagen asignado en la Google Sheet (ej. ".../imgi_26_default.jpg" o "imgi-26-default.jpg")
 * a la imagen correspondiente de la galería local con prefijo 'm' y extensión '.webp' ("mimgi_26_default.webp").
 */
export function resolveGalleryImage(sheetImageUrl?: string | null): string | undefined {
  if (!sheetImageUrl || sheetImageUrl.trim().length === 0) return undefined;

  const clean = sheetImageUrl.trim();
  const filename = clean.split('/').pop()?.split('?')[0] || clean;
  const normalized = filename.replace(/-/g, '_');

  // Caso 1: imgi_XX_default.jpg / jpeg / png / webp
  const match = normalized.match(/imgi_(\d+)_default/i);
  if (match && match[1]) {
    const key = `mimgi_${match[1]}_default.webp`;
    if (GALLERY_MAP[key]) {
      return GALLERY_MAP[key];
    }
    return `/gallery/${key}`;
  }

  // Caso 2: ya tiene prefijo mimgi_XX_default.webp
  const matchM = normalized.match(/mimgi_(\d+)_default/i);
  if (matchM && matchM[1]) {
    const key = `mimgi_${matchM[1]}_default.webp`;
    if (GALLERY_MAP[key]) {
      return GALLERY_MAP[key];
    }
    return `/gallery/${key}`;
  }

  return clean;
}
