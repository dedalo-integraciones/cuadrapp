import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { ProductItem, CartItem, MasterCatalog } from './types';
import {
  FALLBACK_PRODUCTS,
  fetchMasterCatalog,
  groupByRubro,
} from './utils/csvParser';
import {
  COMPANY_NAME,
  ADDRESS,
  WHATSAPP_PHONE_DISPLAY,
  WHATSAPP_PHONE_NUMBER,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  MAPS_URL,
  DEDALO_URL,
} from './config';
import Header from './components/Header';
import MenuSection from './components/MenuSection';
import FloatingCart from './components/FloatingCart';
import { ThemeSwitch } from './components/ThemeSwitch';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { RefreshCw } from 'lucide-react';

// Lazy load non-critical interactive modal components
const CartModal = lazy(() => import('./components/CartModal'));
const Toast = lazy(() => import('./components/Toast'));
const CategoryDrawer = lazy(() => import('./components/CategoryDrawer'));
const ProductDetailModal = lazy(() => import('./components/ProductDetailModal'));

const CACHE_KEY = 'sabor_casero_master_catalog_v3';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos en milisegundos

interface CachedData {
  timestamp: number;
  data: MasterCatalog;
}

function MainAppContent() {
  const { isDark } = useTheme();
  const [catalog, setCatalog] = useState<MasterCatalog>(() => {
    return groupByRubro(FALLBACK_PRODUCTS);
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedRubro, setSelectedRubro] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<ProductItem | null>(null);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch data from Google Sheet with 5-min localStorage cache and fallback
  const fetchData = useCallback(async () => {
    // 1. Verificar si existe caché válido en localStorage
    try {
      const rawCache = localStorage.getItem(CACHE_KEY);
      if (rawCache) {
        const parsedCache: CachedData = JSON.parse(rawCache);
        const isFresh = Date.now() - parsedCache.timestamp < CACHE_TTL_MS;

        if (isFresh && parsedCache.data?.productos?.length > 0) {
          setCatalog(parsedCache.data);
          setIsLoading(false);

          // Pre-calentar imágenes en caché del navegador durante tiempo ocioso
          if (typeof window !== 'undefined') {
            const prewarm = () => {
              parsedCache.data.productos.forEach((p) => {
                if (p.imagen && p.imagen.trim()) {
                  const img = new Image();
                  img.src = p.imagen.trim();
                }
              });
            };
            if ('requestIdleCallback' in window) {
              (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(prewarm);
            } else {
              setTimeout(prewarm, 500);
            }
          }
          return;
        }
      }
    } catch {
      // Si falla localStorage, continuar con el fetch normal
    }

    // 2. Si el caché expiró o no existe, hacer el fetch a Google Sheets (solapas productos y rubros)
    try {
      const masterCatalog = await fetchMasterCatalog();

      if (masterCatalog.productos.length > 0) {
        setCatalog(masterCatalog);

        try {
          const cachePayload: CachedData = {
            timestamp: Date.now(),
            data: masterCatalog,
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));
        } catch {
          // Ignorar errores de cuota o restricción de almacenamiento
        }
      }
    } catch {
      // 3. Fallback de contingencia con los datos predefinidos
      const fallbackMaster = groupByRubro(FALLBACK_PRODUCTS);
      setCatalog(fallbackMaster);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toast feedback trigger
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Add product to Cart
  const handleAddToCart = (product: ProductItem, quantity: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.itemId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === existing.id ? { ...item, cantidad: item.cantidad + quantity } : item
        );
      } else {
        const partes = [product.detalle_1, product.detalle_2].filter(Boolean);
        const newItem: CartItem = {
          id: `${product.rubro}-${product.id}-${Date.now()}`,
          itemId: product.id,
          rubro: product.rubro,
          nombre: product.nombre,
          descripcion: partes.join(' · '),
          precio: product.precio,
          cantidad: quantity,
          color: product.color,
          imagen: product.imagen,
        };
        return [...prev, newItem];
      }
    });

    showToast(
      quantity > 1
        ? `¡${quantity}x ${product.nombre} agregados al carrito!`
        : `¡${product.nombre} agregado al carrito!`
    );
  };

  // Cart operations
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
  const totalPrice = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  return (
    <div
      className={`min-h-screen font-poppins flex justify-center selection:bg-rose-500 selection:text-white transition-colors duration-300 ${
        isDark ? 'bg-[#000000]' : 'bg-[#e4e4e7]'
      }`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <Suspense fallback={null}>
          <Toast message={toastMessage} onOpenCart={() => setIsCartOpen(true)} />
        </Suspense>
      )}

      {/* Main Mobile App Frame */}
      <main
        className={`w-full max-w-[390px] min-h-screen shadow-2xl relative flex flex-col pb-24 overflow-x-hidden border-x transition-colors duration-300 ${
          isDark
            ? 'bg-[#040706] border-stone-800/80 text-white'
            : 'bg-[#fafafa] border-stone-300 text-stone-900'
        }`}
      >
        {/* Full-width Hero and Action Buttons (Rubros & Carrito) */}
        <Header
          onOpenCart={() => setIsCartOpen(true)}
          itemCount={totalItemsCount}
          onOpenMenu={() => setIsMenuOpen(true)}
          activeRubroFilter={selectedRubro}
        />

        {/* Outer Decorative Border Frame (Contenedor de las tarjetas) */}
        <div className="p-2.5 pt-1.5">
          <div
            className={`rounded-[28px] border-[3.5px] p-2 sm:p-2.5 shadow-2xl relative transition-all duration-300 ${
              isDark
                ? 'border-white bg-[#040706]'
                : 'border-stone-900 bg-white'
            }`}
          >
            {/* NUESTRO MENÚ Title Banner */}
            <div className="mt-1 mb-2 text-center select-none">
              <h2
                className={`font-black text-2xl sm:text-3xl uppercase tracking-tight font-poppins transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-stone-950'
                }`}
              >
                Nuestro Menú
              </h2>
            </div>

            {/* Active Filter Pill (if a category is filtered) */}
            {selectedRubro && (
              <div
                className={`mt-1 mb-2 flex items-center justify-between border px-3 py-1.5 rounded-full transition-colors duration-300 ${
                  isDark
                    ? 'bg-stone-900/90 border-stone-700'
                    : 'bg-stone-100 border-stone-300'
                }`}
              >
                <span
                  className={`text-xs font-black uppercase tracking-wide transition-colors duration-300 ${
                    isDark ? 'text-stone-100' : 'text-stone-900'
                  }`}
                >
                  Filtrando: {selectedRubro}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedRubro(null)}
                  className={`text-[11px] font-bold underline cursor-pointer transition-colors duration-300 ${
                    isDark ? 'text-stone-400 hover:text-white' : 'text-stone-600 hover:text-stone-950'
                  }`}
                >
                  Ver todos
                </button>
              </div>
            )}

            {/* Menu Sections - 1 section per rubro */}
            <div className="mt-2 space-y-5">
              {isLoading ? (
                // Loading Skeleton
                <div className="space-y-5 animate-pulse">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="space-y-3">
                      <div
                        className={`h-7 w-40 mx-auto rounded-full ${
                          isDark ? 'bg-stone-800' : 'bg-stone-200'
                        }`}
                      ></div>
                      <div
                        className={`h-40 rounded-3xl border-2 p-3 flex flex-col justify-between ${
                          isDark
                            ? 'border-stone-800 bg-[#040706]'
                            : 'border-stone-200 bg-white'
                        }`}
                      >
                        <div
                          className={`h-6 rounded w-full -mx-3 mb-2 ${
                            isDark ? 'bg-stone-800' : 'bg-stone-200'
                          }`}
                        ></div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <div
                              className={`h-3 rounded w-3/4 ${
                                isDark ? 'bg-stone-800' : 'bg-stone-200'
                              }`}
                            ></div>
                            <div
                              className={`h-7 rounded-full w-28 mt-2 ${
                                isDark ? 'bg-stone-800' : 'bg-stone-200'
                              }`}
                            ></div>
                          </div>
                          <div
                            className={`w-24 h-20 rounded-xl ${
                              isDark ? 'bg-stone-800' : 'bg-stone-200'
                            }`}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                catalog.rubros
                  .filter((rubro) => !selectedRubro || rubro === selectedRubro)
                  .map((rubro) => {
                    const rubroInfo = catalog.rubrosMap[rubro];
                    return (
                      <MenuSection
                        key={rubro}
                        rubro={rubro}
                        rubroColor={rubroInfo?.color}
                        items={catalog.productosPorRubro[rubro] || []}
                        cart={cart}
                        onAddToCart={handleAddToCart}
                        onSelectProduct={(item) => setSelectedProductForDetail(item)}
                      />
                    );
                  })
              )}
            </div>

          </div>
        </div>

        {/* Subtle Brand Divider Bar */}
        <div
          className={`w-full h-px my-2 transition-colors duration-300 ${
            isDark ? 'bg-stone-800' : 'bg-stone-200'
          }`}
        ></div>

        {/* Contact Section */}
        <div className="px-3 py-1">
          <a
            id="footer-whatsapp-card"
            href={`https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodeURIComponent(
              '¡Hola Sabor Casero! Quiero consultar sobre el menú y los pedidos.'
            )}`}
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
                {WHATSAPP_PHONE_DISPLAY}
              </div>
              <div
                className={`text-[11px] uppercase tracking-wider font-bold mt-0.5 whitespace-nowrap transition-colors duration-300 ${
                  isDark ? 'text-emerald-400' : 'text-emerald-800'
                }`}
              >
                Pedidos y consultas por WhatsApp
              </div>
            </div>
          </a>
        </div>

        {/* Selector de modo claro / oscuro: Sol y Luna */}
        <ThemeSwitch />

        {/* Bottom Credits / Note */}
        <footer
          className={`mt-2 pb-4 text-center text-[11px] space-y-1.5 px-3 transition-colors duration-300 ${
            isDark ? 'text-stone-400' : 'text-stone-600'
          }`}
        >
          <p className="font-bold">
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 transition-colors ${
                isDark ? 'text-stone-200 hover:text-white' : 'text-stone-800 hover:text-stone-950'
              }`}
            >
              <span>{COMPANY_NAME} © {ADDRESS}</span>
            </a>
          </p>
          <p>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-pink-500 hover:text-pink-600 transition-colors"
            >
              <span>{INSTAGRAM_HANDLE}</span>
            </a>
          </p>
          <p className={isDark ? 'text-stone-400' : 'text-stone-600'}>
            Los pedidos se envían directamente por WhatsApp desde el carrito.
          </p>
          <p className={`pt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            <a
              id="powered-by-dedalo"
              href={DEDALO_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="powered by Dédalo"
              className="group inline-flex items-center gap-1 transition-all duration-300 cursor-pointer select-none hover:scale-105 active:scale-95"
            >
              <span>powered by</span>
              <strong
                className={`font-bold transition-colors duration-300 ${
                  isDark ? 'text-stone-200 group-hover:text-white' : 'text-stone-900 group-hover:text-black'
                }`}
              >
                Dédalo
              </strong>
            </a>
          </p>
          <p className="pt-1">
            <button
              id="refresh-cache-button"
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem(CACHE_KEY);
                } catch {
                  // Ignorar errores de localStorage
                }
                window.location.reload();
              }}
              title="Actualizar precios manualmente"
              aria-label="Actualizar precios manualmente"
              className={`inline-flex items-center gap-1 text-[11px] cursor-pointer select-none transition-colors ${
                isDark ? 'text-stone-400 hover:text-white' : 'text-stone-600 hover:text-stone-950'
              }`}
            >
              <RefreshCw className="w-3 h-3" />
              <span className="uppercase tracking-widest font-bold">Actualizar</span>
            </button>
          </p>
        </footer>

        {/* Floating Dock: WhatsApp, Instagram & Cart */}
        <FloatingCart
          itemCount={totalItemsCount}
          totalPrice={totalPrice}
          onOpenCart={() => setIsCartOpen(true)}
        />

        {/* Cart Drawer / Modal - Lazy loaded */}
        {isCartOpen && (
          <Suspense fallback={null}>
            <CartModal
              isOpen={isCartOpen}
              onClose={() => setIsCartOpen(false)}
              items={cart}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
            />
          </Suspense>
        )}

        {/* Category Hamburger Drawer - Lazy loaded */}
        {isMenuOpen && (
          <Suspense fallback={null}>
            <CategoryDrawer
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              rubros={catalog.rubros}
              rubrosMap={catalog.rubrosMap}
              selectedRubro={selectedRubro}
              onSelectRubro={(r) => setSelectedRubro(r)}
              productosPorRubro={Object.fromEntries(
                catalog.rubros.map((r) => [r, catalog.productosPorRubro[r]?.length || 0])
              )}
              totalProductsCount={catalog.productos.length}
            />
          </Suspense>
        )}

        {/* Product Detail Modal - Lazy loaded */}
        {selectedProductForDetail && (
          <Suspense fallback={null}>
            <ProductDetailModal
              isOpen={Boolean(selectedProductForDetail)}
              product={selectedProductForDetail}
              onClose={() => setSelectedProductForDetail(null)}
              onAddToCart={handleAddToCart}
              quantityInCart={
                cart.find((c) => String(c.itemId) === String(selectedProductForDetail.id))?.cantidad || 0
              }
              rubroColor={
                selectedProductForDetail.color ||
                catalog.rubrosMap[selectedProductForDetail.rubro]?.color
              }
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