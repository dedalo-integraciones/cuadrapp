import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  FolderTree,
  Layers,
  Loader2,
  LogIn,
  LogOut,
  Package,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  Settings,
  Store,
  Trash2,
} from 'lucide-react';
import type {
  CategoriaAdmin,
  ParametrosAdmin,
  ProductoAdmin,
  ResumenAdmin,
  RubroAdmin,
} from '../types';
import { tenantActual } from '../config';
import {
  ErrorAdmin,
  actualizarCategoria,
  actualizarProducto,
  actualizarRubro,
  borrarCategoria,
  borrarProducto,
  borrarRubro,
  crearCategoria,
  crearProducto,
  crearRubro,
  guardarParametros,
  latido,
  listarCategorias,
  listarProductos,
  listarRubros,
  obtenerParametros,
  obtenerResumen,
  subirImagen as subirImagenApi,
  verificarLogin,
} from '../services/adminService';
import { comprimirImagen } from '../utils/imagen';
import {
  borrarSesion as borrarSesionGuardada,
  guardarSesion as guardarSesionGuardada,
  leerSesion as leerSesionGuardada,
  type SesionAdmin,
} from '../utils/sesionAdmin';
import { formatPrecio } from '../utils/csvParser';
import { ProductImage } from '../components/ProductImage';
import { ProductoForm } from '../components/admin/ProductoForm';
import { CategoriaForm } from '../components/admin/CategoriaForm';
import { RubroForm } from '../components/admin/RubroForm';
import { ConfiguracionPanel } from '../components/admin/ConfiguracionPanel';
import {
  AdminToast,
  Cargando,
  ConfirmDialog,
  btnPrimary,
  btnSecondary,
  inputClass,
  labelClass,
} from '../components/admin/ui';

const TENANT = tenantActual();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DURACION_INACTIVIDAD_MS = 30 * 60 * 1000;
const RENOVACION_ACTIVIDAD_MS = 10 * 60 * 1000;
const iconBtn =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-100 hover:text-stone-900 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

type Pestana = 'productos' | 'categorias' | 'rubros' | 'configuracion';

interface ModalState {
  tipo: 'producto' | 'categoria' | 'rubro';
  producto: ProductoAdmin | null;
  categoria: CategoriaAdmin | null;
  rubro: RubroAdmin | null;
}

interface Confirmacion {
  titulo: string;
  mensaje: string;
  etiqueta: string;
  peligro: boolean;
  doble: boolean;
  accion: () => Promise<unknown>;
  exito: string;
}

interface Aviso {
  tipo: 'exito' | 'error';
  mensaje: string;
}

function leerSesion(): SesionAdmin | null {
  return leerSesionGuardada(TENANT);
}

function guardarSesion(sesion: SesionAdmin) {
  guardarSesionGuardada(TENANT, sesion);
}

function borrarSesion() {
  borrarSesionGuardada(TENANT);
}

function mensajeDe(error: unknown, respaldo = 'No se pudo completar la operación.'): string {
  if (error instanceof ErrorAdmin) return error.message;
  if (error instanceof Error) return error.message;
  return respaldo;
}

function sesionVencida(error: unknown): boolean {
  return error instanceof ErrorAdmin && error.status === 401;
}

function sesionInactiva(error: unknown): boolean {
  return error instanceof ErrorAdmin && error.codigo === 'SESION_INACTIVA';
}

function datosProducto(producto: ProductoAdmin, cambios: Record<string, unknown> = {}) {
  return {
    id_categoria: producto.id_categoria,
    nombre: producto.nombre,
    detalle_1: producto.detalle_1,
    detalle_2: producto.detalle_2,
    precio_cents: producto.precio_cents,
    color: producto.color,
    activo: producto.activo,
    destacado: producto.destacado,
    popular: producto.popular,
    orden: producto.orden,
    imagen: producto.imagen,
    ...cambios,
  };
}

interface TarjetaProps {
  etiqueta: string;
  valor: number | string;
  icono: ReactNode;
  tono: string;
}

function TarjetaResumen({ etiqueta, valor, icono, tono }: TarjetaProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tono}`}>{icono}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">{etiqueta}</p>
        <p className="text-lg font-black leading-tight text-stone-900">{valor}</p>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const [arranque, setArranque] = useState(true);
  const [sesion, setSesion] = useState<SesionAdmin | null>(null);
  const ultimaRenovacion = useRef(0);

  // Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [errorLogin, setErrorLogin] = useState('');
  const [entrando, setEntrando] = useState(false);
  const [avisoInactividad, setAvisoInactividad] = useState(false);

  // Panel
  const [pestana, setPestana] = useState<Pestana>('productos');
  const [resumen, setResumen] = useState<ResumenAdmin | null>(null);
  const [parametros, setParametros] = useState<ParametrosAdmin | null>(null);
  const [rubros, setRubros] = useState<RubroAdmin[]>([]);
  const [categorias, setCategorias] = useState<CategoriaAdmin[]>([]);
  const [productos, setProductos] = useState<ProductoAdmin[]>([]);
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Filtros de productos
  const [busqueda, setBusqueda] = useState('');
  const [filtroRubro, setFiltroRubro] = useState(0);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activos' | 'inactivos'>('todos');

  // Edición
  const [modal, setModal] = useState<ModalState | null>(null);
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [errorConfig, setErrorConfig] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [refrescando, setRefrescando] = useState(false);

  const simbolo = parametros?.moneda_simbolo || '$';

  useEffect(() => {
    if (!aviso) return;
    const temporizador = window.setTimeout(() => setAviso(null), 4200);
    return () => window.clearTimeout(temporizador);
  }, [aviso]);

  const avisar = useCallback((tipo: Aviso['tipo'], mensaje: string) => {
    setAviso({ tipo, mensaje });
  }, []);

  const cerrarSesion = useCallback(() => {
    borrarSesion();
    setSesion(null);
    setResumen(null);
    setParametros(null);
    setRubros([]);
    setCategorias([]);
    setProductos([]);
    setModal(null);
    setConfirmacion(null);
    setPestana('productos');
    setPassword('');
    setAvisoInactividad(false);
  }, []);

  // Inactividad: 30 minutos sin tocar nada cierran la sesión y muestran el aviso.
  // Al cerrar la pestaña o el navegador, sessionStorage se vacía solo.
  useEffect(() => {
    if (!sesion) return;
    if (ultimaRenovacion.current === 0) ultimaRenovacion.current = Date.now();
    let temporizador: ReturnType<typeof setTimeout>;
    const reiniciar = () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => {
        cerrarSesion();
        setAvisoInactividad(true);
      }, DURACION_INACTIVIDAD_MS);
      // Mantiene vivo el token del servidor mientras hay actividad, sin
      // esperar a que el owner guarde algo.
      if (Date.now() - ultimaRenovacion.current >= RENOVACION_ACTIVIDAD_MS) {
        ultimaRenovacion.current = Date.now();
        void latido(TENANT).catch(() => {
          // Sin red: el temporizador local sigue controlando el cierre.
        });
      }
    };
    reiniciar();
    window.addEventListener('pointerdown', reiniciar);
    window.addEventListener('keydown', reiniciar);
    window.addEventListener('wheel', reiniciar, { passive: true });
    return () => {
      clearTimeout(temporizador);
      window.removeEventListener('pointerdown', reiniciar);
      window.removeEventListener('keydown', reiniciar);
      window.removeEventListener('wheel', reiniciar);
    };
  }, [sesion, cerrarSesion]);

  useEffect(() => {
    const guardada = leerSesion();
    if (!guardada) {
      setArranque(false);
      return;
    }
    let cancelado = false;
    void (async () => {
      try {
        await obtenerParametros(TENANT);
        if (!cancelado) {
          ultimaRenovacion.current = Date.now();
          setSesion(guardada);
        }
      } catch (error) {
        if (error instanceof ErrorAdmin && error.status === 401) {
          borrarSesion();
          if (!cancelado) setAvisoInactividad(sesionInactiva(error));
        } else if (!cancelado) {
          // Error de red: se conserva la sesión y el panel muestra el aviso de carga.
          setSesion(guardada);
        }
      } finally {
        if (!cancelado) setArranque(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  const cargarDatos = useCallback(
    async (silencioso = false) => {
      if (!sesion) return;
      if (!silencioso) setCargandoDatos(true);
      setErrorCarga(null);
      try {
        const [resumenResp, rubrosResp, categoriasResp, productosResp, parametrosResp] =
          await Promise.all([
            obtenerResumen(TENANT),
            listarRubros(TENANT),
            listarCategorias(TENANT),
            listarProductos(TENANT),
            obtenerParametros(TENANT),
          ]);
        setResumen(resumenResp.resumen);
        setRubros(rubrosResp.rubros);
        setCategorias(categoriasResp.categorias);
        setProductos(productosResp.productos);
        setParametros(parametrosResp.parametros);
      } catch (error) {
        if (sesionVencida(error)) {
          const inactiva = sesionInactiva(error);
          cerrarSesion();
          setAvisoInactividad(inactiva);
          avisar(
            'error',
            inactiva
              ? 'La sesión se cerró por inactividad. Ingrese de nuevo.'
              : 'La sesión venció. Ingrese nuevamente.'
          );
          return;
        }
        setErrorCarga(mensajeDe(error, 'No se pudieron cargar los datos del panel.'));
      } finally {
        if (!silencioso) setCargandoDatos(false);
      }
    },
    [sesion, cerrarSesion, avisar]
  );

  useEffect(() => {
    if (!sesion) return;
    void cargarDatos();
  }, [sesion, cargarDatos]);

  const refrescar = async () => {
    setRefrescando(true);
    try {
      await cargarDatos(true);
    } finally {
      setRefrescando(false);
    }
  };

  const ingresar = async (evento: FormEvent) => {
    evento.preventDefault();
    setErrorLogin('');
    const correo = email.trim().toLowerCase();
    if (!EMAIL_RE.test(correo)) {
      setErrorLogin('Ingrese un email válido.');
      return;
    }
    if (password.length < 8) {
      setErrorLogin('La clave debe tener entre 8 y 72 caracteres.');
      return;
    }
    setEntrando(true);
    try {
      const respuesta = await verificarLogin(correo, password, TENANT);
      if (!respuesta.sesion) {
        setErrorLogin('No se pudo iniciar la sesión. Intente de nuevo.');
        return;
      }
      const nueva: SesionAdmin = {
        email: respuesta.email || correo,
        nombre: respuesta.nombre || '',
        token: respuesta.sesion,
      };
      guardarSesion(nueva);
      ultimaRenovacion.current = Date.now();
      setSesion(nueva);
      setPassword('');
      setAvisoInactividad(false);
    } catch (error) {
      setErrorLogin(mensajeDe(error, 'No se pudo iniciar sesión.'));
    } finally {
      setEntrando(false);
    }
  };

  const ejecutar = async (accion: () => Promise<unknown>, exito: string) => {
    setGuardando(true);
    setErrorModal(null);
    try {
      await accion();
      setModal(null);
      avisar('exito', exito);
      await cargarDatos(true);
    } catch (error) {
      if (sesionVencida(error)) {
        const inactiva = sesionInactiva(error);
        cerrarSesion();
        setAvisoInactividad(inactiva);
        avisar(
          'error',
          inactiva
            ? 'La sesión se cerró por inactividad. Ingrese de nuevo.'
            : 'La sesión venció. Ingrese nuevamente.'
        );
        return;
      }
      setErrorModal(mensajeDe(error));
    } finally {
      setGuardando(false);
    }
  };

  const accionRapida = async (accion: () => Promise<unknown>, exito: string) => {
    setGuardando(true);
    try {
      await accion();
      avisar('exito', exito);
      await cargarDatos(true);
    } catch (error) {
      if (sesionVencida(error)) {
        const inactiva = sesionInactiva(error);
        cerrarSesion();
        setAvisoInactividad(inactiva);
        avisar(
          'error',
          inactiva
            ? 'La sesión se cerró por inactividad. Ingrese de nuevo.'
            : 'La sesión venció. Ingrese nuevamente.'
        );
        return;
      }
      avisar('error', mensajeDe(error));
    } finally {
      setGuardando(false);
    }
  };

  const abrirModal = (estado: ModalState) => {
    setErrorModal(null);
    setModal(estado);
  };

  const cerrarModal = () => {
    if (guardando) return;
    setModal(null);
    setErrorModal(null);
  };

  const guardarRubro = (datos: Record<string, unknown>) => {
    if (!sesion || !modal) return;
    const actual = modal.rubro;
    void ejecutar(
      () =>
        actual
          ? actualizarRubro(TENANT, actual.id, datos)
          : crearRubro(TENANT, datos),
      actual ? 'Rubro actualizado.' : 'Rubro creado.'
    );
  };

  const guardarCategoria = (datos: Record<string, unknown>) => {
    if (!sesion || !modal) return;
    const actual = modal.categoria;
    void ejecutar(
      () =>
        actual
          ? actualizarCategoria(TENANT, actual.id, datos)
          : crearCategoria(TENANT, datos),
      actual ? 'Categoría actualizada.' : 'Categoría creada.'
    );
  };

  const guardarProducto = (datos: Record<string, unknown>) => {
    if (!sesion || !modal) return;
    const actual = modal.producto;
    void ejecutar(
      () =>
        actual
          ? actualizarProducto(TENANT, actual.id, datos)
          : crearProducto(TENANT, datos),
      actual ? 'Producto actualizado.' : 'Producto creado.'
    );
  };

  const alternarProducto = (producto: ProductoAdmin) => {
    if (!sesion || guardando) return;
    void accionRapida(
      () =>
        actualizarProducto(
          TENANT,
          producto.id,
          datosProducto(producto, { activo: !producto.activo })
        ),
      producto.activo ? 'Producto desactivado.' : 'Producto activado.'
    );
  };

  const pedirBorrarProducto = (producto: ProductoAdmin) => {
    if (!sesion) return;
    setConfirmacion({
      titulo: 'Eliminar producto',
      mensaje: `Se eliminará definitivamente «${producto.nombre}». Esta acción no se puede deshacer.`,
      etiqueta: 'Eliminar producto',
      peligro: true,
      doble: true,
      accion: () => borrarProducto(TENANT, producto.id),
      exito: 'Producto eliminado.',
    });
  };

  const pedirBorrarCategoria = (categoria: CategoriaAdmin) => {
    if (!sesion) return;
    setConfirmacion({
      titulo: 'Eliminar categoría',
      mensaje: `Se eliminará la categoría «${categoria.categoria}». Solo es posible si no tiene productos.`,
      etiqueta: 'Eliminar categoría',
      peligro: true,
      doble: false,
      accion: () => borrarCategoria(TENANT, categoria.id),
      exito: 'Categoría eliminada.',
    });
  };

  const pedirBorrarRubro = (rubro: RubroAdmin) => {
    if (!sesion) return;
    setConfirmacion({
      titulo: 'Eliminar rubro',
      mensaje: `Se eliminará el rubro «${rubro.rubro}». Solo es posible si no tiene categorías.`,
      etiqueta: 'Eliminar rubro',
      peligro: true,
      doble: false,
      accion: () => borrarRubro(TENANT, rubro.id),
      exito: 'Rubro eliminado.',
    });
  };

  const confirmarAccion = () => {
    if (!confirmacion) return;
    const { accion, exito } = confirmacion;
    setConfirmacion(null);
    void ejecutar(accion, exito);
  };

  const guardarConfiguracion = async (datos: Record<string, unknown>) => {
    if (!sesion) return;
    setGuardando(true);
    setErrorConfig(null);
    try {
      const respuesta = await guardarParametros(TENANT, datos);
      setParametros(respuesta.parametros);
      avisar('exito', 'Configuración guardada.');
    } catch (error) {
      if (sesionVencida(error)) {
        const inactiva = sesionInactiva(error);
        cerrarSesion();
        setAvisoInactividad(inactiva);
        avisar(
          'error',
          inactiva
            ? 'La sesión se cerró por inactividad. Ingrese de nuevo.'
            : 'La sesión venció. Ingrese nuevamente.'
        );
        return;
      }
      setErrorConfig(mensajeDe(error));
    } finally {
      setGuardando(false);
    }
  };

  const subirImagen = async (archivo: File): Promise<string> => {
    if (!sesion) throw new Error('La sesión está cerrada.');
    const datos = await comprimirImagen(archivo);
    const respuesta = await subirImagenApi(TENANT, datos, archivo.name);
    if (!respuesta.url) throw new Error('El servidor no devolvió la URL de la imagen.');
    return respuesta.url;
  };

  const productosFiltrados = useMemo(() => {
    const consulta = busqueda.trim().toLowerCase();
    return productos.filter((producto) => {
      if (filtroRubro && producto.id_rubro !== filtroRubro) return false;
      if (filtroEstado === 'activos' && !producto.activo) return false;
      if (filtroEstado === 'inactivos' && producto.activo) return false;
      if (!consulta) return true;
      const texto = `${producto.nombre} ${producto.categoria} ${producto.rubro} ${producto.detalle_1} ${producto.detalle_2}`;
      return texto.toLowerCase().includes(consulta);
    });
  }, [productos, busqueda, filtroRubro, filtroEstado]);

  const productosPorCategoria = useMemo(() => {
    const mapa = new Map<number, number>();
    productos.forEach((producto) => {
      mapa.set(producto.id_categoria, (mapa.get(producto.id_categoria) || 0) + 1);
    });
    return mapa;
  }, [productos]);

  const categoriasPorRubro = useMemo(() => {
    const mapa = new Map<number, number>();
    categorias.forEach((categoria) => {
      mapa.set(categoria.id_rubro, (mapa.get(categoria.id_rubro) || 0) + 1);
    });
    return mapa;
  }, [categorias]);

  if (arranque) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 font-poppins">
        <Cargando texto="Verificando sesión…" />
      </div>
    );
  }

  if (!sesion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4 py-8 font-poppins">
        <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <img
              src="/logo-b.webp"
              alt="Cuadra"
              width={64}
              height={64}
              className="mb-3 h-16 w-16 object-contain"
            />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C8180F]">
              Cuadra · Administración
            </p>
            <h1 className="mt-1 text-2xl font-black text-stone-900">Panel del negocio</h1>
            <p className="mt-1 text-xs text-stone-500">
              Ingrese con su cuenta para administrar el catálogo y la tienda.
            </p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-600">
              <Store className="h-3 w-3" />
              {TENANT}
            </span>
          </div>

          {avisoInactividad && (
            <div
              role="status"
              className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>La sesión se cerró por inactividad. Ingrese de nuevo.</span>
            </div>
          )}

          <form onSubmit={ingresar} className="space-y-3" noValidate>
            {errorLogin && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{errorLogin}</span>
              </div>
            )}

            <label className="block">
              <span className={labelClass}>Email</span>
              <input
                className={inputClass}
                type="email"
                autoComplete="username"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                placeholder="admin@cuadra.app"
                maxLength={254}
                autoFocus
              />
            </label>

            <label className="block">
              <span className={labelClass}>Clave</span>
              <div className="relative">
                <input
                  className={`${inputClass} pr-10`}
                  type={verClave ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(evento) => setPassword(evento.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  maxLength={72}
                />
                <button
                  type="button"
                  onClick={() => setVerClave((valor) => !valor)}
                  aria-label={verClave ? 'Ocultar clave' : 'Mostrar clave'}
                  className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
                >
                  {verClave ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <button type="submit" className={`${btnPrimary} w-full py-2.5 text-sm`} disabled={entrando}>
              {entrando ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {entrando ? 'Ingresando…' : 'Ingresar al panel'}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-center border-t border-stone-100 pt-4">
            <a
              href={`/?tenant=${encodeURIComponent(TENANT)}`}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-500 transition hover:text-stone-900"
            >
              <Store className="h-3.5 w-3.5" />
              Volver a la tienda
            </a>
          </div>
        </div>
      </div>
    );
  }

  const pestanas: Array<{ id: Pestana; etiqueta: string; icono: ReactNode }> = [
    { id: 'productos', etiqueta: 'Productos', icono: <Package className="h-3.5 w-3.5" /> },
    { id: 'categorias', etiqueta: 'Categorías', icono: <FolderTree className="h-3.5 w-3.5" /> },
    { id: 'rubros', etiqueta: 'Rubros', icono: <Layers className="h-3.5 w-3.5" /> },
    { id: 'configuracion', etiqueta: 'Configuración', icono: <Settings className="h-3.5 w-3.5" /> },
  ];

  const productoEditando = modal?.producto ?? null;
  const categoriaEditando = modal?.categoria ?? null;
  const rubroEditando = modal?.rubro ?? null;

  return (
    <div className="min-h-screen bg-stone-100 font-poppins text-stone-900">
      {aviso && <AdminToast tipo={aviso.tipo} mensaje={aviso.mensaje} onClose={() => setAviso(null)} />}

      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2.5 sm:px-6">
          <img src="/logo-b.webp" alt="Cuadra" width={38} height={38} className="h-9 w-9 object-contain" />
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#C8180F]">
              Cuadra · Administración
            </p>
            <h1 className="truncate text-sm font-black leading-tight text-stone-900 sm:text-base">
              {parametros?.nombre_comercial || TENANT}
            </h1>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Sesión</p>
            <p className="max-w-[180px] truncate text-[11px] font-bold text-stone-700">
              {sesion.nombre || sesion.email}
            </p>
          </div>
          <a
            href={`/?tenant=${encodeURIComponent(TENANT)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${btnSecondary} hidden sm:inline-flex`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver tienda
          </a>
          <button
            type="button"
            className={btnSecondary}
            onClick={cerrarSesion}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>

        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 pb-2 sm:px-6">
          {pestanas.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPestana(item.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-black uppercase tracking-wide transition cursor-pointer ${
                pestana === item.id
                  ? 'bg-[#C8180F] text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {item.icono}
              {item.etiqueta}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 px-3 py-4 sm:px-6 sm:py-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <TarjetaResumen
            etiqueta="Productos"
            valor={resumen?.productos ?? productos.length}
            icono={<Package className="h-4 w-4" />}
            tono="bg-[#C8180F]/10 text-[#C8180F]"
          />
          <TarjetaResumen
            etiqueta="Activos"
            valor={resumen?.productos_activos ?? productos.filter((p) => p.activo).length}
            icono={<CheckCircle2 className="h-4 w-4" />}
            tono="bg-emerald-100 text-emerald-700"
          />
          <TarjetaResumen
            etiqueta="Categorías"
            valor={resumen?.categorias ?? categorias.length}
            icono={<FolderTree className="h-4 w-4" />}
            tono="bg-sky-100 text-sky-700"
          />
          <TarjetaResumen
            etiqueta="Rubros"
            valor={resumen?.rubros ?? rubros.length}
            icono={<Layers className="h-4 w-4" />}
            tono="bg-amber-100 text-amber-700"
          />
        </div>

        {errorCarga && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{errorCarga}</span>
            <button
              type="button"
              onClick={() => void refrescar()}
              className="underline cursor-pointer disabled:opacity-50"
              disabled={refrescando}
            >
              Reintentar
            </button>
          </div>
        )}

        {cargandoDatos && !parametros ? (
          <Cargando texto="Cargando catálogo…" />
        ) : (
          <>
            {pestana === 'productos' && (
              <section className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-black text-stone-900">Productos</h2>
                    <p className="text-[11px] font-medium text-stone-500">
                      {productosFiltrados.length} de {productos.length} productos
                      {resumen ? ` · límite ${resumen.max_registros}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className={btnSecondary}
                      onClick={() => void refrescar()}
                      disabled={refrescando || guardando}
                      title="Actualizar"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${refrescando ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Actualizar</span>
                    </button>
                    <button
                      type="button"
                      className={btnPrimary}
                      onClick={() => abrirModal({ tipo: 'producto', producto: null, categoria: null, rubro: null })}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Nuevo producto
                    </button>
                  </div>
                </div>

                <div className="grid gap-2 rounded-2xl border border-stone-200 bg-white p-2.5 shadow-sm sm:grid-cols-[1fr_auto_auto]">
                  <label className="relative block">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                    <input
                      className={`${inputClass} pl-8`}
                      value={busqueda}
                      onChange={(evento) => setBusqueda(evento.target.value)}
                      placeholder="Buscar por nombre, categoría o detalle…"
                    />
                  </label>
                  <select
                    className={`${inputClass} sm:w-48`}
                    value={filtroRubro}
                    onChange={(evento) => setFiltroRubro(Number(evento.target.value))}
                    aria-label="Filtrar por rubro"
                  >
                    <option value={0}>Todos los rubros</option>
                    {rubros.map((rubro) => (
                      <option key={rubro.id} value={rubro.id}>
                        {rubro.rubro}
                      </option>
                    ))}
                  </select>
                  <select
                    className={`${inputClass} sm:w-40`}
                    value={filtroEstado}
                    onChange={(evento) =>
                      setFiltroEstado(evento.target.value as 'todos' | 'activos' | 'inactivos')
                    }
                    aria-label="Filtrar por estado"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="activos">Solo activos</option>
                    <option value="inactivos">Solo inactivos</option>
                  </select>
                </div>

                <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                  {productosFiltrados.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <p className="text-sm font-black text-stone-800">No hay productos para mostrar</p>
                      <p className="mt-1 text-xs text-stone-500">
                        Ajuste la búsqueda o cree un producto nuevo.
                      </p>
                    </div>
                  ) : (
                    productosFiltrados.map((producto) => {
                      const detalles = [producto.detalle_1, producto.detalle_2].filter(Boolean).join(' · ');
                      return (
                        <div
                          key={producto.id}
                          className="flex flex-wrap items-center gap-3 border-b border-stone-100 px-3 py-3 last:border-0"
                        >
                          <ProductImage
                            src={producto.imagen}
                            alt={producto.nombre}
                            loading="lazy"
                            containerClassName="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-stone-200"
                          />
                          <div className="min-w-0 flex-1 basis-40">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="truncate text-sm font-black text-stone-900">{producto.nombre}</p>
                              {producto.destacado && (
                                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-800">
                                  Destacado
                                </span>
                              )}
                              {producto.popular && (
                                <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-sky-800">
                                  Popular
                                </span>
                              )}
                              {!producto.activo && (
                                <span className="rounded-full bg-stone-200 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-stone-700">
                                  Inactivo
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-[11px] font-bold text-stone-500">
                              {producto.rubro} · {producto.categoria}
                            </p>
                            {detalles && (
                              <p className="truncate text-[11px] text-stone-400">{detalles}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-stone-900">
                              {formatPrecio(producto.precio, simbolo)}
                            </p>
                            <p className="text-[10px] font-bold text-stone-400">Orden {producto.orden}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className={iconBtn}
                              title={producto.activo ? 'Desactivar' : 'Activar'}
                              aria-label={producto.activo ? 'Desactivar producto' : 'Activar producto'}
                              onClick={() => alternarProducto(producto)}
                              disabled={guardando}
                            >
                              <Power className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              className={iconBtn}
                              title="Editar"
                              aria-label="Editar producto"
                              onClick={() =>
                                abrirModal({ tipo: 'producto', producto, categoria: null, rubro: null })
                              }
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              className={`${iconBtn} text-rose-600 hover:bg-rose-50 hover:text-rose-700`}
                              title="Eliminar"
                              aria-label="Eliminar producto"
                              onClick={() => pedirBorrarProducto(producto)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            )}

            {pestana === 'categorias' && (
              <section className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-black text-stone-900">Categorías</h2>
                    <p className="text-[11px] font-medium text-stone-500">
                      {categorias.length} categorías agrupadas por rubro.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={btnPrimary}
                    onClick={() => abrirModal({ tipo: 'categoria', producto: null, categoria: null, rubro: null })}
                    disabled={rubros.length === 0}
                    title={rubros.length === 0 ? 'Cree primero un rubro' : 'Nueva categoría'}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Nueva categoría
                  </button>
                </div>

                <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                  {categorias.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <p className="text-sm font-black text-stone-800">Todavía no hay categorías</p>
                      <p className="mt-1 text-xs text-stone-500">
                        Cree un rubro y luego agrúpele categorías.
                      </p>
                    </div>
                  ) : (
                    categorias.map((categoria) => (
                      <div
                        key={categoria.id}
                        className="flex flex-wrap items-center gap-3 border-b border-stone-100 px-3 py-3 last:border-0"
                      >
                        <span
                          className="h-9 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: categoria.color }}
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1 basis-40">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="truncate text-sm font-black text-stone-900">{categoria.categoria}</p>
                            {!categoria.activo && (
                              <span className="rounded-full bg-stone-200 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-stone-700">
                                Inactiva
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-[11px] font-bold text-stone-500">
                            {categoria.rubro}
                            {categoria.descripcion ? ` · ${categoria.descripcion}` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-stone-800">
                            {productosPorCategoria.get(categoria.id) || 0} productos
                          </p>
                          <p className="text-[10px] font-bold text-stone-400">Orden {categoria.orden}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className={iconBtn}
                            title="Editar"
                            aria-label="Editar categoría"
                            onClick={() =>
                              abrirModal({ tipo: 'categoria', producto: null, categoria, rubro: null })
                            }
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className={`${iconBtn} text-rose-600 hover:bg-rose-50 hover:text-rose-700`}
                            title="Eliminar"
                            aria-label="Eliminar categoría"
                            onClick={() => pedirBorrarCategoria(categoria)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            {pestana === 'rubros' && (
              <section className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-black text-stone-900">Rubros</h2>
                    <p className="text-[11px] font-medium text-stone-500">
                      {rubros.length} rubros de la carta.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={btnPrimary}
                    onClick={() => abrirModal({ tipo: 'rubro', producto: null, categoria: null, rubro: null })}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Nuevo rubro
                  </button>
                </div>

                {rubros.length === 0 ? (
                  <div className="rounded-2xl border border-stone-200 bg-white px-4 py-10 text-center shadow-sm">
                    <p className="text-sm font-black text-stone-800">Todavía no hay rubros</p>
                    <p className="mt-1 text-xs text-stone-500">
                      Cree el primer rubro para ordenar categorías y productos.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {rubros.map((rubro) => (
                      <article
                        key={rubro.id}
                        className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
                      >
                        <div className="h-1.5 w-full" style={{ backgroundColor: rubro.color }} />
                        <div className="space-y-2 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h3 className="truncate text-sm font-black text-stone-900">{rubro.rubro}</h3>
                                {!rubro.activo && (
                                  <span className="rounded-full bg-stone-200 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-stone-700">
                                    Inactivo
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 line-clamp-2 text-[11px] text-stone-500">
                                {rubro.descripcion || 'Sin descripción'}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                className={iconBtn}
                                title="Editar"
                                aria-label="Editar rubro"
                                onClick={() =>
                                  abrirModal({ tipo: 'rubro', producto: null, categoria: null, rubro })
                                }
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                className={`${iconBtn} text-rose-600 hover:bg-rose-50 hover:text-rose-700`}
                                title="Eliminar"
                                aria-label="Eliminar rubro"
                                onClick={() => pedirBorrarRubro(rubro)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 border-t border-stone-100 pt-2 text-[10px] font-bold uppercase tracking-wide text-stone-500">
                            <span>{categoriasPorRubro.get(rubro.id) || 0} categorías</span>
                            <span>Orden {rubro.orden}</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {pestana === 'configuracion' && (
              <section className="space-y-3">
                <div>
                  <h2 className="text-lg font-black text-stone-900">Configuración</h2>
                  <p className="text-[11px] font-medium text-stone-500">
                    Datos de contacto, dirección y textos que se muestran en la tienda.
                  </p>
                </div>
                {parametros ? (
                  <ConfiguracionPanel
                    parametros={parametros}
                    guardando={guardando}
                    error={errorConfig}
                    onGuardar={(datos) => void guardarConfiguracion(datos)}
                  />
                ) : (
                  <Cargando texto="Cargando configuración…" />
                )}
              </section>
            )}
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[10px] text-stone-400">
          <span>
            Negocio: <strong className="text-stone-600">{TENANT}</strong> · Sesión: {sesion.email}
          </span>
          <a
            href={`/?tenant=${encodeURIComponent(TENANT)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold text-stone-500 hover:text-stone-900 sm:hidden"
          >
            <Store className="h-3.5 w-3.5" />
            Ver tienda
          </a>
        </div>
      </main>

      {modal?.tipo === 'producto' && (
        <ProductoForm
          producto={productoEditando}
          categorias={categorias}
          rubros={rubros}
          simbolo={simbolo}
          guardando={guardando}
          error={errorModal}
          onClose={cerrarModal}
          onGuardar={guardarProducto}
          onEliminar={productoEditando ? () => pedirBorrarProducto(productoEditando) : undefined}
          onSubirImagen={subirImagen}
        />
      )}

      {modal?.tipo === 'categoria' && (
        <CategoriaForm
          categoria={categoriaEditando}
          rubros={rubros}
          guardando={guardando}
          error={errorModal}
          onClose={cerrarModal}
          onGuardar={guardarCategoria}
          onEliminar={categoriaEditando ? () => pedirBorrarCategoria(categoriaEditando) : undefined}
        />
      )}

      {modal?.tipo === 'rubro' && (
        <RubroForm
          rubro={rubroEditando}
          guardando={guardando}
          error={errorModal}
          onClose={cerrarModal}
          onGuardar={guardarRubro}
          onEliminar={rubroEditando ? () => pedirBorrarRubro(rubroEditando) : undefined}
        />
      )}

      {confirmacion && (
        <ConfirmDialog
          titulo={confirmacion.titulo}
          mensaje={confirmacion.mensaje}
          etiqueta={confirmacion.etiqueta}
          peligro={confirmacion.peligro}
          doble={confirmacion.doble}
          procesando={guardando}
          onCancel={() => setConfirmacion(null)}
          onConfirm={confirmarAccion}
        />
      )}
    </div>
  );
}
