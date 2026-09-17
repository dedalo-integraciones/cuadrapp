import React, { useState, useRef, useEffect } from 'react';

// Registro global de URLs verificadas
const FAILED_IMAGE_CACHE = new Set<string>();

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  posterSrc?: string;
  loading?: 'lazy' | 'eager';
  objectFit?: 'cover' | 'contain';
  width?: number | string;
  height?: number | string;
  id?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  className = '',
  containerClassName = '',
  posterSrc = '/no-image.webp',
  loading = 'eager',
  objectFit = 'cover',
  width,
  height,
  id,
}) => {
  const cleanSrc = src && src.trim().length > 0 ? src.trim() : null;
  const [hasError, setHasError] = useState<boolean>(() => {
    if (!cleanSrc) return true;
    return FAILED_IMAGE_CACHE.has(cleanSrc);
  });

  const imgRef = useRef<HTMLImageElement>(null);
  const fitClass = objectFit === 'contain' ? 'object-contain' : 'object-cover';

  // Si cambia la URL, reiniciar estado de error
  useEffect(() => {
    if (!cleanSrc) {
      setHasError(true);
    } else {
      setHasError(FAILED_IMAGE_CACHE.has(cleanSrc));
    }
  }, [cleanSrc]);

  const handleError = () => {
    if (cleanSrc) {
      FAILED_IMAGE_CACHE.add(cleanSrc);
    }
    setHasError(true);
  };

  // CASO 1: No hay URL o falló la carga (404/red) -> Mostrar póster de respaldo
  if (!cleanSrc || hasError) {
    return (
      <div
        className={`relative overflow-hidden flex items-center justify-center select-none bg-stone-900/30 ${containerClassName}`}
        style={{ width, height }}
      >
        <img
          src={posterSrc}
          alt={alt ? `${alt} (no disponible)` : 'Imagen no disponible'}
          loading="eager"
          decoding="async"
          className={`w-full h-full ${fitClass} ${className}`}
        />
      </div>
    );
  }

  // CASO 2: Con imagen válida -> Renderizado inmediato en el DOM sin pósters bloqueantes
  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center select-none bg-stone-900/20 ${containerClassName}`}
      style={{ width, height }}
    >
      <img
        ref={imgRef}
        id={id}
        src={cleanSrc}
        alt={alt}
        loading={loading}
        decoding="async"
        onError={handleError}
        className={`w-full h-full ${fitClass} ${className}`}
      />
    </div>
  );
};

export default ProductImage;

