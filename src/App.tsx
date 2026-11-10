import React, { useCallback, useEffect, useMemo, useState, Suspense, lazy } from 'react';
import type { CartItem, CatalogoRespuesta, FiltroCatalogo, Producto } from './types';
import { catalogoDeRespaldo } from './utils/csvParser';
import { fetchCatalogo, ErrorCatalogo } from './services/catalogoService';
import {
  ADDRESS,
  FACEBOOK_HANDLE,
  FACEBOOK_URL,
  MAPS_URL,
  tenantActual,
} from './config';
import Header from './components/Header';
import MenuSection from './components/MenuSection';
import FloatingCart from './components/FloatingCart';
import { ThemeSwitch } from './components/ThemeSwitch';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { RefreshCw, WifiOff } from 'lucide-react';

const CartModal = lazy(() => import('./components/CartModal'));
const Toast = lazy(() => import('./components/Toast'));
const CategoryDrawer = lazy(() => import('./components/CategoryDrawer'));
const ProductDetailModal = lazy(() => import('./components/ProductDetailModal'));

const TENANT = tenantActual();
const CACHE_KEY = `cuadra_catalog_v2_${TENANT}`;
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CachedData {
  timestamp: number;
  data: CatalogoRespuesta;
}

function leerCache(): CatalogoRespuesta | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedData = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
    if (!Array.isArray(parsed.data?.productos) || !parsed.data?.tenant) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function MainAppContent() {
  const { isDark } = useTheme();

  const [catalog, setCatalog] = useState<CatalogoRespuesta>(() => leerCache() || catalogoDeRespaldo());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroCatalogo>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Producto | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const cargar = useCallback(async (forzar = false) => {
    if (!forzar) {
      const cache = leerCache();
      if (cache) {
        setCatalog(cache);
        return;
      }
    }

    setIsLoading(true);
    try {
      const datos = await fetchCatalogo(TENANT);
      setCatalog(datos);
      setAviso(null);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: datos }));
      } catch {
        // Sin almacenamiento: la tienda sigue funcionando con la respuesta viva.
      }
    } catch (error) {
      const mensaje =
        error instanceof ErrorCatalogo ? error.message : 'No se pudo cargar el catálogo.';
      setAviso(mensaje);
      setCatalog((actual) => (actual.productos.length > 0 ? actual : catalogoDeRespaldo()));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2800);
  };

  const handleAddToCart = (product: Producto, quantity: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.itemId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === existing.id ? { ...item, cantidad: item.cantidad + quantity } : item
        );
      }
      const partes = [product.detalle_1, product.detalle_2].filter(Boolean);
      const newItem: CartItem = {
        id: `${product.id_categoria}-${product.id}-${Date.now()}`,
        itemId: product.id,
        rubro: product.rubro,
        categoria: product.categoria,
        nombre: product.nombre,
        descripcion: partes.join(' · '),
        precio: product.precio,
        cantidad: quantity,
        color: product.color,
        imagen: product.imagen,
      };
      return [...prev, newItem];
    });

    showToast(
      quantity > 1
        ? `¡${quantity}x ${product.nombre} agregados al carrito!`
        : `¡${product.nombre} agregado al carrito!`
    );
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.cantidad + delta;
            return newQty > 0 ? { ...item, cantidad: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const handleRemoveItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const totalItemsCount = cart.reduce((sum, item) => sum + item.cantidad, 0);

  const tenant = catalog.tenant;
  const simbolo = tenant.moneda_simbolo || '$';
  const mostrarPrecios = tenant.mostrar_precios !== false;
  const numeroWhatsapp = tenant.whatsapp_pedidos || tenant.whatsapp || '';
  const direccionTexto =
    [
      tenant.direccion.linea1,
      tenant.direccion.linea2,
      tenant.direccion.localidad,
      tenant.direccion.provincia,
      tenant.direccion.pais,
    ]
      .filter(Boolean)
      .join(', ') || ADDRESS;
  const facebookUrl =
    typeof tenant.brand.facebook === 'string' && tenant.brand.facebook
      ? tenant.brand.facebook
      : FACEBOOK_URL;
  const mapsUrl = direccionTexto
    ? `https://maps.google.com/?q=${encodeURIComponent(direccionTexto)}`
    : MAPS_URL;
  const mensajeConsulta = `¡Hola ${tenant.name}! Quiero hacer una consulta.`;

  const rubrosPorId = useMemo(() => {
    const mapa = new Map<number, string>();
    catalog.rubros.forEach((rubro) => mapa.set(rubro.id, rubro.rubro));
    return mapa;
  }, [catalog.rubros]);

  const productosPorCategoria = useMemo(() => {
    const mapa = new Map<number, Producto[]>();
    catalog.productos.forEach((producto) => {
      const lista = mapa.get(producto.id_categoria) || [];
      lista.push(producto);
      mapa.set(producto.id_categoria, lista);
    });
    return mapa;
  }, [catalog.productos]);

  const categoriasVisibles = useMemo(() => {
    return catalog.categorias.filter((categoria) => {
      if (!filtro) return true;
      if (filtro.tipo === 'rubro') return categoria.id_rubro === filtro.id;
      return categoria.id === filtro.id;
    });
  }, [catalog.categorias, filtro]);

  const secciones = categoriasVisibles.filter(
    (categoria) => (productosPorCategoria.get(categoria.id)?.length || 0) > 0
  );

  return (
    <div
      id="app-root-container"
      className={`min-h-screen font-poppins flex justify-center selection:bg-rose-500 selection:text-white transition-colors duration-300 w-full overflow-x-hidden ${
        isDark ? 'bg-[#000000]' : 'bg-[#e4e4e7]'
      }`}
    >
      {toastMessage && (
        <Suspense fallback={null}>
          <Toast message={toastMessage} onOpenCart={() => setIsCartOpen(true)} />
        </Suspense>
      )}

      <main
        id="main-app-frame"
        className={`w-full max-w-[390px] min-h-screen shadow-2xl relative flex flex-col pb-20 overflow-x-hidden border-x transition-colors duration-300 mx-auto ${
          isDark
            ? 'bg-[#040706] border-stone-800/80 text-white'
            : 'bg-[#fafafa] border-stone-300 text-stone-900'
        }`}
      >
        <Header
          onOpenCart={() => setIsCartOpen(true)}
          itemCount={totalItemsCount}
          onOpenMenu={() => setIsMenuOpen(true)}
          activeRubroFilter={filtro?.etiqueta || null}
        />

        {aviso && (
          <div className="px-3 pt-2">
            <div
              className={`flex items-start gap-2 rounded-2xl border px-3 py-2 text-[11px] ${
                isDark
                  ? 'bg-amber-950/40 border-amber-700/50 text-amber-200'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              <WifiOff className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-bold">{aviso}</p>
                <p className="opacity-80">Se muestra el catálogo de respaldo.</p>
              </div>
              <button
                type="button"
                onClick={() => void cargar(true)}
                className="font-black underline shrink-0 cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        <div className="p-2.5 pt-1.5">
          <div
            className={`rounded-[28px] border-[3.5px] p-2 sm:p-2.5 shadow-2xl relative transition-all duration-300 ${
              isDark ? 'border-white bg-[#040706]' : 'border-stone-900 bg-white'
            }`}
          >
            <div className="mt-1 mb-2 text-center select-none">
              <h2
                className={`font-black text-2xl sm:text-3xl uppercase tracking-tight font-poppins transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-stone-950'
                }`}
              >
                {tenant.textos.hero || 'Nuestro Menú'}
              </h2>
              {tenant.textos.hero_bajada && (
                <p className={`text-[11px] font-medium mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  {tenant.textos.hero_bajada}
                </p>
              )}
            </div>

            {filtro && (
              <div
                className={`mt-1 mb-2 flex items-center justify-between border px-3 py-1.5 rounded-full transition-colors duration-300 ${
                  isDark ? 'bg-stone-900/90 border-stone-700' : 'bg-stone-100 border-stone-300'
                }`}
              >
                <span
                  className={`text-xs font-black uppercase tracking-wide transition-colors duration-300 ${
                    isDark ? 'text-stone-100' : 'text-stone-900'
                  }`}
                >
                  {filtro.tipo === 'rubro' ? 'Rubro' : 'Categoría'}: {filtro.etiqueta}
                </span>
                <button
                  type="button"
                  onClick={() => setFiltro(null)}
                  className={`text-[11px] font-bold underline cursor-pointer transition-colors duration-300 ${
                    isDark ? 'text-stone-400 hover:text-white' : 'text-stone-600 hover:text-stone-950'
                  }`}
                >
                  Ver todos
                </button>
              </div>
            )}

            <div className="mt-2 space-y-5">
              {isLoading && catalog.productos.length === 0 ? (
                <div className="space-y-5 animate-pulse">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="space-y-3">
                      <div className={`h-7 w-40 mx-auto rounded-full ${isDark ? 'bg-stone-800' : 'bg-stone-200'}`} />
                      <div
                        className={`h-40 rounded-3xl border-2 p-3 ${
                          isDark ? 'border-stone-800 bg-[#040706]' : 'border-stone-200 bg-white'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              ) : secciones.length === 0 ? (
                <div className="py-12 text-center space-y-2 px-4">
                  <p className={`font-black text-base ${isDark ? 'text-white' : 'text-stone-900'}`}>
                    No hay productos para mostrar
                  </p>
                  <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    Pruebe con otro rubro o categoría.
                  </p>
                  {filtro && (
                    <button
                      type="button"
                      onClick={() => setFiltro(null)}
                      className="mt-2 px-4 py-2 rounded-full bg-[#C8180F] text-white text-xs font-black cursor-pointer"
                    >
                      Ver toda la carta
                    </button>
                  )}
                </div>
              ) : (
                secciones.map((categoria) => (
                  <MenuSection
                    key={categoria.id}
                    categoria={categoria}
                    rubroNombre={rubrosPorId.get(categoria.id_rubro)}
                    items={productosPorCategoria.get(categoria.id) || []}
                    cart={cart}
                    onAddToCart={handleAddToCart}
                    onSelectProduct={(item) => setSelectedProductForDetail(item)}
                    simbolo={simbolo}
                    mostrarPrecios={mostrarPrecios}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div className={`w-full h-px my-2 transition-colors duration-300 ${isDark ? 'bg-stone-800' : 'bg-stone-200'}`} />

        <div className="px-3 py-1">
          <a
            id="footer-whatsapp-card"
            href={`https://wa.me/${String(numeroWhatsapp).replace(/\D/g, '')}?text=${encodeURIComponent(mensajeConsulta)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-3 px-3.5 py-2.5 rounded-2xl border transition-all duration-300 shadow-md group active:scale-[0.98] w-full ${
              isDark
                ? 'bg-[#0c1612] border-emerald-500/40 hover:border-emerald-400'
                : 'bg-emerald-50/90 border-emerald-500/60 hover:border-emerald-600 shadow-emerald-950/5'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shadow-md shadow-emerald-500/30 group-hover:scale-105 transition-transform shrink-0">
              <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
            </div>
            <div className="text-left leading-tight">
              <div
                className={`font-black text-[17px] tracking-tight font-poppins whitespace-nowrap transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-stone-950'
                }`}
              >
                {tenant.telefono || 'Pedidos por WhatsApp'}
              </div>
              <div
                className={`text-[11px] uppercase tracking-wider font-bold mt-0.5 whitespace-nowrap transition-colors duration-300 ${
                  isDark ? 'text-emerald-400' : 'text-emerald-800'
                }`}
              >
                {tenant.textos.atencion || 'Pedidos y consultas por WhatsApp'}
              </div>
            </div>
          </a>
        </div>

        <ThemeSwitch />

        <footer
          className={`mt-1 pb-1 text-center text-[11px] space-y-1 px-3 transition-colors duration-300 ${
            isDark ? 'text-stone-400' : 'text-stone-600'
          }`}
        >
          <p className="font-bold">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 transition-colors ${
                isDark ? 'text-stone-200 hover:text-white' : 'text-stone-800 hover:text-stone-950'
              }`}
            >
              <span>{tenant.name} © {direccionTexto}</span>
            </a>
          </p>
          <p>
            <a
              id="footer-facebook-link"
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-[#1877F2] hover:text-[#166fe5] transition-colors"
            >
              <span>{FACEBOOK_HANDLE}</span>
            </a>
          </p>

          <p className="pt-0.5">
            <button
              id="refresh-cache-button"
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem(CACHE_KEY);
                } catch {
                  // Sin almacenamiento: se recarga igual desde la API.
                }
                void cargar(true);
              }}
              title="Actualizar el catálogo"
              aria-label="Actualizar el catálogo"
              disabled={isLoading}
              className={`inline-flex items-center gap-1 text-[11px] cursor-pointer select-none transition-colors disabled:opacity-50 ${
                isDark ? 'text-stone-400 hover:text-white' : 'text-stone-600 hover:text-stone-950'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="uppercase tracking-widest font-bold">
                {isLoading ? 'Actualizando' : 'Actualizar'}
              </span>
            </button>
          </p>
        </footer>

        <FloatingCart
          itemCount={totalItemsCount}
          onOpenCart={() => setIsCartOpen(true)}
          whatsapp={numeroWhatsapp}
          mensajeConsulta={mensajeConsulta}
          facebookUrl={facebookUrl}
          mapsUrl={mapsUrl}
        />

        {isCartOpen && (
          <Suspense fallback={null}>
            <CartModal
              isOpen={isCartOpen}
              onClose={() => setIsCartOpen(false)}
              items={cart}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              nombreNegocio={tenant.name}
              whatsappPedidos={numeroWhatsapp}
              simbolo={simbolo}
              mostrarPrecios={mostrarPrecios}
            />
          </Suspense>
        )}

        {isMenuOpen && (
          <Suspense fallback={null}>
            <CategoryDrawer
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              rubros={catalog.rubros}
              categorias={catalog.categorias}
              productos={catalog.productos}
              selected={filtro}
              onSelect={setFiltro}
              totalProductsCount={catalog.productos.length}
            />
          </Suspense>
        )}

        {selectedProductForDetail && (
          <Suspense fallback={null}>
            <ProductDetailModal
              isOpen={Boolean(selectedProductForDetail)}
              product={selectedProductForDetail}
              onClose={() => setSelectedProductForDetail(null)}
              onAddToCart={handleAddToCart}
              quantityInCart={
                cart.find((c) => c.itemId === selectedProductForDetail.id)?.cantidad || 0
              }
              rubroColor={selectedProductForDetail.color}
              simbolo={simbolo}
              mostrarPrecios={mostrarPrecios}
            />
          </Suspense>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainAppContent />
    </ThemeProvider>
  );
}