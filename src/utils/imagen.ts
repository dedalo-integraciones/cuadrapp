/**
 * Reduce una imagen en el navegador antes de subirla.
 * El resultado siempre es JPEG para mantener el peso bajo; el fondo blanco
 * evita transparencias negras al convertir PNG con canal alfa.
 */
export function comprimirImagen(file: File, maxLado = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo debe ser una imagen.'));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error('La imagen original no puede superar los 8 MB.'));
      return;
    }

    const lector = new FileReader();
    lector.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    lector.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('No se pudo interpretar la imagen.'));
      img.onload = () => {
        const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
        const ancho = Math.max(1, Math.round(img.width * escala));
        const alto = Math.max(1, Math.round(img.height * escala));
        const lienzo = document.createElement('canvas');
        lienzo.width = ancho;
        lienzo.height = alto;
        const ctx = lienzo.getContext('2d');
        if (!ctx) {
          reject(new Error('El navegador no pudo procesar la imagen.'));
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, ancho, alto);
        ctx.drawImage(img, 0, 0, ancho, alto);
        resolve(lienzo.toDataURL('image/jpeg', 0.82));
      };
      img.src = String(lector.result || '');
    };
    lector.readAsDataURL(file);
  });
}
