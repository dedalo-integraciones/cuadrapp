import bcrypt from "bcryptjs";
import { getCoreClient } from "../../src/db/core";
import {
  buscarTenant,
  parametrosTenant,
  parseJsonSeguro,
  resolverTenantSlug,
  tenantVigente,
} from "../../src/db/tenant";
import { autenticarAdmin } from "../../src/server/admin-auth";
import { auditar } from "../../src/server/audit";
import {
  booleanoInt,
  colorHex,
  entero,
  imagenSegura,
  ipCliente,
  leerBody,
  metodo,
  responder,
  texto,
} from "../../src/server/http";
import {
  estadoRateLimit,
  limpiarRateLimit,
  registrarFallo,
} from "../../src/server/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class ErrorApi extends Error {
  status: number;
  codigo: string;
  constructor(status: number, codigo: string, mensaje: string) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
  }
}

function fallo(res: any, status: number, error: string, mensaje: string) {
  return responder(res, status, { ok: false, error, mensaje });
}

function requerido(valor: unknown, campo: string, max = 120): string {
  const limpio = texto(valor, max);
  if (!limpio) throw new ErrorApi(400, "VALIDACION", `El campo ${campo} es obligatorio.`);
  return limpio;
}

function idValido(valor: unknown, campo = "id"): number {
  const n = entero(valor, 0);
  if (n <= 0) throw new ErrorApi(400, "VALIDACION", `El campo ${campo} no es válido.`);
  return n;
}

function estadoDesdeFila(fila: Record<string, unknown>) {
  return {
    activo: Number(fila["activo"] || 0) === 1,
  };
}

function filaRubro(fila: Record<string, unknown>) {
  return {
    id: Number(fila["id"]),
    rubro: String(fila["rubro"] || ""),
    descripcion: fila["descripcion"] ? String(fila["descripcion"]) : "",
    orden: Number(fila["orden"] || 0),
    color: fila["color"] ? String(fila["color"]) : "#C91810",
    ...estadoDesdeFila(fila),
  };
}

function filaCategoria(fila: Record<string, unknown>) {
  return {
    id: Number(fila["id"]),
    id_rubro: Number(fila["id_rubro"]),
    rubro: fila["rubro"] ? String(fila["rubro"]) : "",
    categoria: String(fila["categoria"] || ""),
    descripcion: fila["descripcion"] ? String(fila["descripcion"]) : "",
    orden: Number(fila["orden"] || 0),
    color: fila["color"] ? String(fila["color"]) : "#C91810",
    ...estadoDesdeFila(fila),
  };
}

function filaProducto(fila: Record<string, unknown>) {
  const cents = Number(fila["precio_cents"] || 0);
  return {
    id: Number(fila["id"]),
    id_categoria: Number(fila["id_categoria"]),
    id_rubro: Number(fila["id_rubro"] || 0),
    categoria: fila["categoria"] ? String(fila["categoria"]) : "",
    rubro: fila["rubro"] ? String(fila["rubro"]) : "",
    nombre: String(fila["nombre"] || ""),
    detalle_1: fila["detalle_1"] ? String(fila["detalle_1"]) : "",
    detalle_2: fila["detalle_2"] ? String(fila["detalle_2"]) : "",
    precio_cents: cents,
    precio: Math.round((cents / 100) * 100) / 100,
    color: fila["color"] ? String(fila["color"]) : "#C91810",
    imagen: fila["imagen"] ? String(fila["imagen"]) : "",
    orden: Number(fila["orden"] || 0),
    activo: Number(fila["activo"] || 0) === 1,
    destacado: Number(fila["destacado"] || 0) === 1,
    popular: Number(fila["popular"] || 0) === 1,
  };
}

function validarEmail(valor: unknown, campo: string): string {
  const limpio = texto(valor, 254).toLowerCase();
  if (limpio && !EMAIL_RE.test(limpio)) {
    throw new ErrorApi(400, "VALIDACION", `El campo ${campo} no tiene un email válido.`);
  }
  return limpio;
}

function validarColor(valor: unknown): string {
  const color = colorHex(valor);
  if (!color) throw new ErrorApi(400, "VALIDACION", "El color debe ser hexadecimal (#RRGGBB).");
  return color;
}

function validarImagen(valor: unknown): string | null {
  const limpio = texto(valor, 600);
  if (!limpio) return null;
  const imagen = imagenSegura(limpio);
  if (!imagen) {
    throw new ErrorApi(400, "VALIDACION", "La imagen debe ser una URL http(s) o una ruta interna.");
  }
  return imagen;
}

type AuthOk = Extract<Awaited<ReturnType<typeof autenticarAdmin>>, { ok: true }>;

async function verificarLogin(req: any, res: any, body: Record<string, any>, slug: string) {
  const ip = ipCliente(req);
  if (texto(body.sitio_web, 80)) {
    return fallo(res, 401, "TOKEN_INVALIDO", "Email o clave incorrectos.");
  }

  const email = texto(body.email, 254).toLowerCase();
  const password = String(body.password ?? "");
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return fallo(res, 400, "VALIDACION", "El email no tiene un formato válido.");
  }
  if (password.length < 8 || password.length > 72) {
    return fallo(res, 400, "VALIDACION", "La clave debe tener entre 8 y 72 caracteres.");
  }

  const estado = await estadoRateLimit(ip);
  if (!estado.permitido) {
    return fallo(
      res,
      429,
      "RATE_LIMIT",
      `Demasiados intentos. Espere ${estado.minutosRestantes} minuto(s) e intente de nuevo.`
    );
  }

  const tenant = await buscarTenant(slug);
  if (!tenant) return fallo(res, 404, "TENANT_NO_ENCONTRADO", "El negocio no existe.");
  if (!tenantVigente(tenant)) {
    return fallo(
      res,
      403,
      "TENANT_BLOQUEADO",
      "El negocio está suspendido o vencido. Contacte al administrador de la plataforma."
    );
  }

  const core = getCoreClient();
  const usuarioRs = await core.execute({
    sql: "SELECT id, email, name, password_hash FROM users WHERE email = ? LIMIT 1",
    args: [email],
  });
  const usuario = usuarioRs.rows[0] as unknown as Record<string, unknown> | undefined;
  const claveValida = usuario
    ? await bcrypt.compare(password, String(usuario["password_hash"] || ""))
    : false;

  if (!usuario || !claveValida) {
    await registrarFallo(ip);
    await auditar(tenant.id, usuario ? Number(usuario["id"]) : null, "LOGIN_FALLIDO", {
      email,
      ip,
    });
    return fallo(res, 401, "TOKEN_INVALIDO", "Email o clave incorrectos.");
  }

  const membership = await core.execute({
    sql: "SELECT role FROM memberships WHERE user_id = ? AND tenant_id = ? LIMIT 1",
    args: [Number(usuario["id"]), tenant.id],
  });
  if (membership.rows.length === 0) {
    await auditar(tenant.id, Number(usuario["id"]), "LOGIN_SIN_PERMISO", { email, ip });
    return fallo(res, 403, "SIN_PERMISO", "La cuenta no tiene acceso a este negocio.");
  }

  await limpiarRateLimit(ip);
  await auditar(tenant.id, Number(usuario["id"]), "LOGIN_OK", { email, ip });
  return responder(res, 200, {
    ok: true,
    email: String(usuario["email"]),
    nombre: String(usuario["name"]),
    tenant: { id: tenant.id, nombre: tenant.name, mode: tenant.mode },
  });
}

async function guardarParametros(auth: AuthOk, datos: Record<string, unknown>) {
  const actual = parametrosTenant(auth.tenant);
  const nombre = requerido(datos.nombre_comercial ?? actual.nombre_comercial, "nombre comercial", 120);
  const whatsappPedidos = requerido(
    datos.whatsapp_pedidos ?? actual.whatsapp_pedidos,
    "WhatsApp de pedidos",
    40
  );

  const brandActual = parseJsonSeguro(auth.tenant.brand);
  const redesEntrada = (datos.redes && typeof datos.redes === "object" ? datos.redes : {}) as Record<
    string,
    unknown
  >;
  const brand = {
    ...brandActual,
    facebook: texto(redesEntrada.facebook, 300),
    instagram: texto(redesEntrada.instagram, 300),
    tiktok: texto(redesEntrada.tiktok, 300),
  };

  const emailContacto = validarEmail(datos.email_contacto ?? actual.email_contacto, "email de contacto");
  const emailPedidos = validarEmail(datos.email_pedidos ?? actual.email_pedidos, "email de pedidos");

  await getCoreClient().execute({
    sql: `UPDATE tenants SET
      name = ?, documento_fiscal = ?, telefono = ?, whatsapp = ?, whatsapp_pedidos = ?,
      email_contacto = ?, email_pedidos = ?, horario_atencion = ?, direccion_linea1 = ?,
      direccion_linea2 = ?, localidad = ?, provincia_estado = ?, codigo_postal = ?, pais = ?,
      moneda_simbolo = ?, texto_atencion = ?, texto_hero = ?, texto_hero_bajada = ?,
      texto_footer = ?, brand = ?
      WHERE id = ?`,
    args: [
      nombre,
      texto(datos.documento_fiscal ?? actual.documento_fiscal, 40),
      texto(datos.telefono ?? actual.telefono, 40),
      texto(datos.whatsapp ?? actual.whatsapp, 40),
      whatsappPedidos,
      emailContacto,
      emailPedidos,
      texto(datos.horario_atencion ?? actual.horario_atencion, 120),
      texto(datos.direccion_linea1 ?? actual.direccion_linea1, 160),
      texto(datos.direccion_linea2 ?? actual.direccion_linea2, 160),
      texto(datos.localidad ?? actual.localidad, 80),
      texto(datos.provincia_estado ?? actual.provincia_estado, 80),
      texto(datos.codigo_postal ?? actual.codigo_postal, 20),
      texto(datos.pais ?? actual.pais, 60),
      texto(datos.moneda_simbolo ?? actual.moneda_simbolo, 3) || "$",
      texto(datos.texto_atencion ?? actual.texto_atencion, 200),
      texto(datos.texto_hero ?? actual.texto_hero, 80),
      texto(datos.texto_hero_bajada ?? actual.texto_hero_bajada, 160),
      texto(datos.texto_footer ?? actual.texto_footer, 300),
      JSON.stringify(brand),
      auth.tenant.id,
    ],
  });

  const actualizado = await buscarTenant(auth.tenant.id);
  return parametrosTenant(actualizado || auth.tenant);
}

export default async function handler(req: any, res: any) {
  if (metodo(req) !== "POST") {
    return fallo(res, 405, "METODO_NO_PERMITIDO", "Use POST.");
  }

  const body = await leerBody(req);
  const accion = texto(body.accion, 60);
  const slug = resolverTenantSlug({ ...req, body });
  if (!accion) return fallo(res, 400, "VALIDACION", "Falta la acción.");

  try {
    if (accion === "estado_login") {
      const estado = await estadoRateLimit(ipCliente(req));
      return responder(res, 200, { ok: true, ...estado, max: 5 });
    }
    if (accion === "verificar") {
      return await verificarLogin(req, res, body, slug);
    }
    if (accion === "listar_publico") {
      const tenant = await buscarTenant(slug);
      if (!tenant) return fallo(res, 404, "TENANT_NO_ENCONTRADO", "El negocio no existe.");
      return responder(res, 200, { ok: true, tenant: parametrosTenant(tenant) });
    }

    const auth = await autenticarAdmin(slug, body.email);
    if (auth.ok === false) {
      return fallo(res, auth.status, auth.error, auth.mensaje);
    }
    const { usuario, tenant, db } = auth;

    switch (accion) {
      case "get_parametros": {
        return responder(res, 200, { ok: true, parametros: parametrosTenant(tenant) });
      }

      case "set_parametros": {
        const datos = (body.datos || {}) as Record<string, unknown>;
        const parametros = await guardarParametros(auth, datos);
        await auditar(tenant.id, usuario.id, "PARAMETROS_ACTUALIZADOS");
        return responder(res, 200, { ok: true, parametros });
      }

      case "resumen": {
        const [r, c, p] = await Promise.all([
          db.execute("SELECT COUNT(*) AS total FROM rubros"),
          db.execute("SELECT COUNT(*) AS total FROM categorias"),
          db.execute("SELECT COUNT(*) AS total, SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) AS activos FROM productos"),
        ]);
        return responder(res, 200, {
          ok: true,
          resumen: {
            rubros: Number(r.rows[0]?.["total"] || 0),
            categorias: Number(c.rows[0]?.["total"] || 0),
            productos: Number(p.rows[0]?.["total"] || 0),
            productos_activos: Number(p.rows[0]?.["activos"] || 0),
            max_registros: Number(tenant.max_registros) || 150,
          },
        });
      }

      // ── Rubros ─────────────────────────────────────────────────────────────
      case "listar_rubros": {
        const rs = await db.execute(
          "SELECT id, rubro, descripcion, orden, color, activo FROM rubros ORDER BY orden, id"
        );
        return responder(res, 200, { ok: true, rubros: rs.rows.map((f) => filaRubro(f)) });
      }

      case "crear_rubro": {
        const datos = (body.datos || {}) as Record<string, unknown>;
        const total = await db.execute("SELECT COUNT(*) AS total FROM rubros");
        if (Number(total.rows[0]?.["total"] || 0) >= 50) {
          throw new ErrorApi(409, "LIMITE", "Se alcanzó el máximo de 50 rubros.");
        }
        const rs = await db.execute({
          sql: `INSERT INTO rubros (rubro, descripcion, orden, color, activo)
                VALUES (?, ?, ?, ?, ?)`,
          args: [
            requerido(datos.rubro, "rubro", 60),
            texto(datos.descripcion, 200),
            entero(datos.orden, 0),
            validarColor(datos.color),
            booleanoInt(datos.activo, 1),
          ],
        });
        await auditar(tenant.id, usuario.id, "RUBRO_CREADO", { id: Number(rs.lastInsertRowid) });
        return responder(res, 200, { ok: true, id: Number(rs.lastInsertRowid) });
      }

      case "actualizar_rubro": {
        const datos = (body.datos || {}) as Record<string, unknown>;
        const id = idValido(body.id);
        const existe = await db.execute({ sql: "SELECT id FROM rubros WHERE id = ?", args: [id] });
        if (existe.rows.length === 0) throw new ErrorApi(404, "NO_ENCONTRADO", "El rubro no existe.");
        await db.execute({
          sql: `UPDATE rubros SET rubro = ?, descripcion = ?, orden = ?, color = ?, activo = ?,
                updated_at = datetime('now') WHERE id = ?`,
          args: [
            requerido(datos.rubro, "rubro", 60),
            texto(datos.descripcion, 200),
            entero(datos.orden, 0),
            validarColor(datos.color),
            booleanoInt(datos.activo, 1),
            id,
          ],
        });
        await auditar(tenant.id, usuario.id, "RUBRO_ACTUALIZADO", { id });
        return responder(res, 200, { ok: true });
      }

      case "borrar_rubro": {
        const id = idValido(body.id);
        const hijos = await db.execute({
          sql: "SELECT COUNT(*) AS total FROM categorias WHERE id_rubro = ?",
          args: [id],
        });
        if (Number(hijos.rows[0]?.["total"] || 0) > 0) {
          throw new ErrorApi(409, "REFERENCIA", "No se puede borrar un rubro que tiene categorías.");
        }
        await db.execute({ sql: "DELETE FROM rubros WHERE id = ?", args: [id] });
        await auditar(tenant.id, usuario.id, "RUBRO_BORRADO", { id });
        return responder(res, 200, { ok: true });
      }

      // ── Categorías ─────────────────────────────────────────────────────────
      case "listar_categorias": {
        const rs = await db.execute(
          `SELECT c.*, r.rubro FROM categorias c
           JOIN rubros r ON r.id = c.id_rubro
           ORDER BY r.orden, c.orden, c.id`
        );
        return responder(res, 200, { ok: true, categorias: rs.rows.map((f) => filaCategoria(f)) });
      }

      case "crear_categoria": {
        const datos = (body.datos || {}) as Record<string, unknown>;
        const idRubro = idValido(datos.id_rubro, "rubro");
        const rubro = await db.execute({ sql: "SELECT id FROM rubros WHERE id = ?", args: [idRubro] });
        if (rubro.rows.length === 0) throw new ErrorApi(404, "NO_ENCONTRADO", "El rubro no existe.");
        const rs = await db.execute({
          sql: `INSERT INTO categorias (id_rubro, categoria, descripcion, orden, color, activo)
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [
            idRubro,
            requerido(datos.categoria, "categoría", 80),
            texto(datos.descripcion, 200),
            entero(datos.orden, 0),
            validarColor(datos.color),
            booleanoInt(datos.activo, 1),
          ],
        });
        await auditar(tenant.id, usuario.id, "CATEGORIA_CREADA", { id: Number(rs.lastInsertRowid) });
        return responder(res, 200, { ok: true, id: Number(rs.lastInsertRowid) });
      }

      case "actualizar_categoria": {
        const datos = (body.datos || {}) as Record<string, unknown>;
        const id = idValido(body.id);
        const idRubro = idValido(datos.id_rubro, "rubro");
        const rubro = await db.execute({ sql: "SELECT id FROM rubros WHERE id = ?", args: [idRubro] });
        if (rubro.rows.length === 0) throw new ErrorApi(404, "NO_ENCONTRADO", "El rubro no existe.");
        await db.execute({
          sql: `UPDATE categorias SET id_rubro = ?, categoria = ?, descripcion = ?, orden = ?,
                color = ?, activo = ?, updated_at = datetime('now') WHERE id = ?`,
          args: [
            idRubro,
            requerido(datos.categoria, "categoría", 80),
            texto(datos.descripcion, 200),
            entero(datos.orden, 0),
            validarColor(datos.color),
            booleanoInt(datos.activo, 1),
            id,
          ],
        });
        await auditar(tenant.id, usuario.id, "CATEGORIA_ACTUALIZADA", { id });
        return responder(res, 200, { ok: true });
      }

      case "borrar_categoria": {
        const id = idValido(body.id);
        const hijos = await db.execute({
          sql: "SELECT COUNT(*) AS total FROM productos WHERE id_categoria = ?",
          args: [id],
        });
        if (Number(hijos.rows[0]?.["total"] || 0) > 0) {
          throw new ErrorApi(409, "REFERENCIA", "No se puede borrar una categoría que tiene productos.");
        }
        await db.execute({ sql: "DELETE FROM categorias WHERE id = ?", args: [id] });
        await auditar(tenant.id, usuario.id, "CATEGORIA_BORRADA", { id });
        return responder(res, 200, { ok: true });
      }

      // ── Productos ──────────────────────────────────────────────────────────
      case "listar_productos": {
        const rs = await db.execute(
          `SELECT p.*, c.categoria, c.id_rubro, r.rubro FROM productos p
           JOIN categorias c ON c.id = p.id_categoria
           JOIN rubros r ON r.id = c.id_rubro
           ORDER BY r.orden, c.orden, p.orden, p.id`
        );
        return responder(res, 200, { ok: true, productos: rs.rows.map((f) => filaProducto(f)) });
      }

      case "crear_producto": {
        const datos = (body.datos || {}) as Record<string, unknown>;
        const idCategoria = idValido(datos.id_categoria, "categoría");
        const categoria = await db.execute({
          sql: "SELECT id FROM categorias WHERE id = ?",
          args: [idCategoria],
        });
        if (categoria.rows.length === 0) {
          throw new ErrorApi(404, "NO_ENCONTRADO", "La categoría no existe.");
        }
        const total = await db.execute("SELECT COUNT(*) AS total FROM productos");
        const limite = Number(tenant.max_registros) || 150;
        if (Number(total.rows[0]?.["total"] || 0) >= limite) {
          throw new ErrorApi(409, "LIMITE", `Se alcanzó el máximo de ${limite} productos.`);
        }
        const precioCents = entero(datos.precio_cents, -1);
        if (precioCents < 0) throw new ErrorApi(400, "VALIDACION", "El precio no es válido.");
        const rs = await db.execute({
          sql: `INSERT INTO productos
                (id_categoria, nombre, detalle_1, detalle_2, precio_cents, color, activo,
                 destacado, popular, orden, imagen)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            idCategoria,
            requerido(datos.nombre, "nombre", 120),
            texto(datos.detalle_1, 200),
            texto(datos.detalle_2, 200),
            precioCents,
            validarColor(datos.color),
            booleanoInt(datos.activo, 1),
            booleanoInt(datos.destacado, 0),
            booleanoInt(datos.popular, 0),
            entero(datos.orden, 0),
            validarImagen(datos.imagen),
          ],
        });
        await auditar(tenant.id, usuario.id, "PRODUCTO_CREADO", { id: Number(rs.lastInsertRowid) });
        return responder(res, 200, { ok: true, id: Number(rs.lastInsertRowid) });
      }

      case "actualizar_producto": {
        const datos = (body.datos || {}) as Record<string, unknown>;
        const id = idValido(body.id);
        const idCategoria = idValido(datos.id_categoria, "categoría");
        const categoria = await db.execute({
          sql: "SELECT id FROM categorias WHERE id = ?",
          args: [idCategoria],
        });
        if (categoria.rows.length === 0) {
          throw new ErrorApi(404, "NO_ENCONTRADO", "La categoría no existe.");
        }
        const precioCents = entero(datos.precio_cents, -1);
        if (precioCents < 0) throw new ErrorApi(400, "VALIDACION", "El precio no es válido.");
        await db.execute({
          sql: `UPDATE productos SET id_categoria = ?, nombre = ?, detalle_1 = ?, detalle_2 = ?,
                precio_cents = ?, color = ?, activo = ?, destacado = ?, popular = ?, orden = ?,
                imagen = ?, updated_at = datetime('now') WHERE id = ?`,
          args: [
            idCategoria,
            requerido(datos.nombre, "nombre", 120),
            texto(datos.detalle_1, 200),
            texto(datos.detalle_2, 200),
            precioCents,
            validarColor(datos.color),
            booleanoInt(datos.activo, 1),
            booleanoInt(datos.destacado, 0),
            booleanoInt(datos.popular, 0),
            entero(datos.orden, 0),
            validarImagen(datos.imagen),
            id,
          ],
        });
        await auditar(tenant.id, usuario.id, "PRODUCTO_ACTUALIZADO", { id });
        return responder(res, 200, { ok: true });
      }

      case "desactivar_producto": {
        const id = idValido(body.id);
        await db.execute({
          sql: "UPDATE productos SET activo = 0, updated_at = datetime('now') WHERE id = ?",
          args: [id],
        });
        await auditar(tenant.id, usuario.id, "PRODUCTO_DESACTIVADO", { id });
        return responder(res, 200, { ok: true });
      }

      case "borrar_producto": {
        const id = idValido(body.id);
        await db.execute({ sql: "DELETE FROM productos WHERE id = ?", args: [id] });
        await auditar(tenant.id, usuario.id, "PRODUCTO_BORRADO", { id });
        return responder(res, 200, { ok: true });
      }

      default:
        return fallo(res, 400, "ACCION_DESCONOCIDA", "La acción solicitada no existe.");
    }
  } catch (error) {
    if (error instanceof ErrorApi) {
      return fallo(res, error.status, error.codigo, error.message);
    }
    console.error("[api/admin] error", error);
    return fallo(res, 500, "ERROR_INTERNO", "Ocurrió un error interno.");
  }
}
