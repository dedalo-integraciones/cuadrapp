import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';

// Registro global de URLs verificadas y disponibles en caché de la sesión
const LOADED_IMAGE_CACHE = new Set<string>();
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
  loading = 'lazy',
  objectFit = 'cover',
  width,
  height,
  id,
}) => {
  const cleanSrc = src && src.trim().length > 0 ? src.trim() : null;

  // PRIORIDAD AL CACHÉ: Si la URL ya está registrada en la caché activa, iniciamos directamente como cargada
  const [isLoaded, setIsLoaded] = useState<boolean>(() => {
    if (!cleanSrc) return false;
    return LOADED_IMAGE_CACHE.has(cleanSrc);
  });

  const [hasError, setHasError] = useState<boolean>(() => {
    if (!cleanSrc) return false;
    return FAILED_IMAGE_CACHE.has(cleanSrc);
  });

  const imgRef = useRef<HTMLImageElement>(null);
  const prevSrcRef = useRef<string | null>(cleanSrc);

  const fitClass = objectFit === 'contain' ? 'object-contain' : 'object-cover';

  // Sincronización inmediata con el estado de caché en memoria del navegador
  useLayoutEffect(() => {
    if (cleanSrc && imgRef.current) {
      if (imgRef.current.complete && imgRef.current.naturalWidth > 0) {
        LOADED_IMAGE_CACHE.add(cleanSrc);
        if (!isLoaded) setIsLoaded(true);
        if (hasError) setHasError(false);
      }
    }
  }, [cleanSrc, isLoaded, hasError]);

  // SOLO si ha cambiado la imagen se evalúa si se dispone del caché o se ajusta /no-image.webp
  useEffect(() => {
    if (prevSrcRef.current !== cleanSrc) {
      prevSrcRef.current = cleanSrc;

      if (!cleanSrc) {
        // Sin imagen definida: ajustar a no-image
        setIsLoaded(false);
        setHasError(false);
        return;
      }

      // Si la nueva imagen YA está en caché, darle prioridad absoluta de inmediato
      if (LOADED_IMAGE_CACHE.has(cleanSrc)) {
        setIsLoaded(true);
        setHasError(false);
        return;
      }

      if (FAILED_IMAGE_CACHE.has(cleanSrc)) {
        setIsLoaded(false);
        setHasError(true);
        return;
      }

      // Si no disponemos del caché para la nueva imagen, ajustamos para mostrar /no-image.webp mientras descarga
      setIsLoaded(false);
      setHasError(false);
    }
  }, [cleanSrc]);

  // Manejador cuando la imagen completa su descarga y se incorpora al caché
  const handleLoad = () => {
    if (cleanSrc) {
      LOADED_IMAGE_CACHE.add(cleanSrc);
      FAILED_IMAGE_CACHE.delete(cleanSrc);
    }
    setIsLoaded(true);
    setHasError(false);
  };

  // Manejador en caso de falla de red o URL rota
  const handleError = () => {
    if (cleanSrc) {
      FAILED_IMAGE_CACHE.add(cleanSrc);
      LOADED_IMAGE_CACHE.delete(cleanSrc);
    }
    setHasError(true);
    setIsLoaded(false);
  };

  // CASO 1: No hay URL o falló la carga -> Mostrar /no-image.webp ajustada
  if (!cleanSrc || hasError) {
    return (
      <div
        className={`relative overflow-hidden flex items-center justify-center select-none bg-stone-900/40 ${containerClassName}`}
        style={{ width, height }}
      >
        <img
          src={posterSrc}
          alt={alt ? `${alt} (no disponible)` : 'Imagen no disponible'}
          loading="lazy"
          decoding="async"
          className={`w-full h-full ${fitClass} ${className}`}
        />
      </div>
    );
  }

  // CASO 2: Disponemos del caché y la imagen está lista -> PRIORIDAD: Mostrar directamente la imagen sin poster
  if (isLoaded) {
    return (
      <div
        className={`relative overflow-hidden flex items-center justify-center select-none bg-stone-900/40 ${containerClassName}`}
        style={{ width, height }}
      >
        <img
          ref={imgRef}
          id={id}
          src={cleanSrc}
          alt={alt}
          loading={loading}
          referrerPolicy="no-referrer"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full ${fitClass} ${className}`}
        />
      </div>
    );
  }

  // CASO 3: La imagen cambió o no disponemos del caché aún -> Mostrar /no-image.webp de póster mientras carga la nueva
  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center select-none bg-stone-900/40 ${containerClassName}`}
      style={{ width, height }}
    >
      {/* Póster /no-image.webp visible durante la primera descarga */}
      <img
        src={posterSrc}
        alt={alt ? `${alt} (cargando)` : 'Cargando imagen'}
        loading="eager"
        decoding="async"
        className={`w-full h-full ${fitClass}`}
      />

      {/* Imagen real en proceso de carga por primera vez */}
      <img
        ref={imgRef}
        id={id}
        src={cleanSrc}
        alt={alt}
        loading={loading}
        referrerPolicy="no-referrer"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className="hidden"
      />
    </div>
  );
};

export default ProductImage;

