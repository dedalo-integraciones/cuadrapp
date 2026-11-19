import bcrypt from "bcryptjs";
import { getCoreClient } from "../../src/db/core.js";
import {
  buscarTenant,
  leerLegalTenant,
  parametrosTenant,
  parseJsonSeguro,
  resolverTenantSlug,
  tenantVigente,
  type TenantLegalRow,
} from "../../src/db/tenant.js";
import { autenticarAdmin } from "../../src/server/admin-auth.js";
import { crearSesion, renovarSesion } from "../../src/server/session.js";
import { auditar } from "../../src/server/audit.js";
import {
  booleanoInt,
  colorHex,
  encabezado,
  entero,
  imagenSegura,
  ipCliente,
  leerBody,
  metodo,
  responder,
  texto,
  urlSegura,
} from "../../src/server/http.js";
import {
  estadoRateLimit,
  limpiarRateLimit,
  registrarFallo,
} from "../../src/server/rate-limit.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Hash ficticio para que un email inexistente tarde lo mismo que uno real.
 * No corresponde a ninguna cuenta ni a una clave conocida.
 */
const HASH_FICTICIO = "$2b$12$S.kHH4FYbzIZRN/kBDbep.8T5yqlVlW4.bnnPlmGuDyvZ4ufwN9xy";

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

/** Email normalizado: "" si viene vacío, null si el formato es inválido. */
function emailNormalizado(valor: unknown): string | null {
  const limpio = texto(valor, 254).toLowerCase();
  if (!limpio) return "";
  return EMAIL_RE.test(limpio) ? limpio : null;
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

/** Enlace de red social: "" si viene vacío, null si no es http(s). */
function redNormalizada(valor: unknown): string | null {
  const limpio = texto(valor, 300);
  if (!limpio) return "";
  return urlSegura(limpio, 300);
}

type AuthOk = Extract<Awaited<ReturnType<typeof autenticarAdmin>>, { ok: true }>;

async function verificarLogin(req: any, res: any, body: Record<string, any>, slug: string) {
  const ip = ipCliente(req);
  if (texto(body.sitio_web, 80)) {
    return fallo(res, 401, "TOKEN_INVALIDO", "Email o clave incorrectos.");
  }

  // Un token de sesión no es un email: si llega solo eso, se responde como
  // sesión inválida en vez de acusar un formato de email incorrecto.
  if (!texto(body.email, 254) && texto(body.sesion, 400)) {
    return fallo(res, 401, "SESION_INVALIDA", "Sesión no válida.");
  }

  const email = texto(body.email, 254).toLowerCase();
  const password = String(body.password ?? "");
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return fallo(res, 400, "VALIDACION", "El email no tiene un formato válido.");
  }
  if (password.length < 8 || password.length > 72) {
    return fallo(res, 400, "VALIDACION", "La clave debe tener entre 8 y 72 caracteres.");
  }

  const [estadoIp, estadoEmail] = await Promise.all([
    estadoRateLimit("ip", ip),
    estadoRateLimit("email", email),
  ]);
  if (!estadoIp.permitido || !estadoEmail.permitido) {
    const minutos = Math.max(estadoIp.minutosRestantes, estadoEmail.minutosRestantes);
    return fallo(
      res,
      429,
      "RATE_LIMIT",
      `Demasiados intentos. Espere ${minutos} minuto(s) e intente de nuevo.`
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
  const hashGuardado =
    usuario && usuario["password_hash"] ? String(usuario["password_hash"]) : HASH_FICTICIO;
  const claveValida = await bcrypt.compare(password, hashGuardado);

  if (!usuario || !claveValida) {
    await Promise.all([
      registrarFallo("ip", ip),
      registrarFallo("email", email),
    ]);
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

  await Promise.all([
    limpiarRateLimit("ip", ip),
    limpiarRateLimit("email", email),
  ]);
  await auditar(tenant.id, Number(usuario["id"]), "LOGIN_OK", { email, ip });
  return responder(res, 200, {
    ok: true,
    email: String(usuario["email"]),
    nombre: String(usuario["name"]),
    tenant: { id: tenant.id, nombre: tenant.name, mode: tenant.mode },
    sesion: crearSesion(Number(usuario["id"]), String(usuario["email"]), tenant.id),
  });
}

async function guardarParametros(auth: AuthOk, datos: Record<string, unknown>) {
  const actual = parametrosTenant(auth.tenant);
  const legalActual = await leerLegalTenant(auth.tenant.id);
  const avisos: string[] = [];

  // Guardado parcial: cada campo válido se escribe y los obligatorios que
  // falten se devuelven en `legal_faltantes` para avisar en el panel.
  const nombre = texto(datos.nombre_comercial ?? actual.nombre_comercial, 120);
  const whatsappPedidos = texto(datos.whatsapp_pedidos ?? actual.whatsapp_pedidos, 40);
  if (!nombre) avisos.push("nombre comercial");
  if (!whatsappPedidos) avisos.push("WhatsApp de pedidos");

  const brandActual = parseJsonSeguro(auth.tenant.brand);
  const redesEntrada = (datos.redes && typeof datos.redes === "object" ? datos.redes : {}) as Record<
    string,
    unknown
  >;
  const red = (clave: "facebook" | "instagram" | "tiktok", etiqueta: string): string => {
    const entrada = clave in redesEntrada ? redesEntrada[clave] : brandActual[clave];
    const valor = redNormalizada(entrada);
    if (valor === null) {
      avisos.push(`enlace de ${etiqueta} (formato inválido)`);
      return String(brandActual[clave] ?? "");
    }
    return valor;
  };
  const brand = {
    ...brandActual,
    facebook: red("facebook", "Facebook"),
    instagram: red("instagram", "Instagram"),
    tiktok: red("tiktok", "TikTok"),
  };

  const correo = (clave: "email_contacto" | "email_pedidos", etiqueta: string): string => {
    const valor = emailNormalizado(datos[clave] ?? actual[clave]);
    if (valor === null) {
      avisos.push(`${etiqueta} (formato inválido)`);
      return String(actual[clave] || "");
    }
    return valor;
  };
  const emailContacto = correo("email_contacto", "email de contacto");
  const emailPedidos = correo("email_pedidos", "email de pedidos");

  const entradaLegal = (
    datos.legal && typeof datos.legal === "object" ? datos.legal : {}
  ) as Record<string, unknown>;
  const legal = <T extends keyof TenantLegalRow>(campo: T, valorActual: unknown, max: number): string =>
    texto(entradaLegal[campo] ?? valorActual ?? "", max);

  const legalNueva: TenantLegalRow = {
    tenant_id: auth.tenant.id,
    razon_social: legal("razon_social", legalActual?.razon_social, 120),
    // Columnas heredadas: ya no se editan, se conservan tal como están.
    jurisdiccion: texto(legalActual?.jurisdiccion ?? "", 120),
    entrega_retiro: booleanoInt(entradaLegal.entrega_retiro ?? legalActual?.entrega_retiro, 0),
    entrega_envio: booleanoInt(entradaLegal.entrega_envio ?? legalActual?.entrega_envio, 0),
    entrega_zonas: legal("entrega_zonas", legalActual?.entrega_zonas, 200),
    entrega_demora: legal("entrega_demora", legalActual?.entrega_demora, 120),
    envio_costo: legal("envio_costo", legalActual?.envio_costo, 120),
    envio_costo_cents: legalActual?.envio_costo_cents ?? null,
    cambios_plazo_dias: legalActual?.cambios_plazo_dias ?? null,
    cambios_condiciones: texto(legalActual?.cambios_condiciones ?? "", 600),
    medios_pago: legal("medios_pago", legalActual?.medios_pago, 200),
    condiciones_extra: legal("condiciones_extra", legalActual?.condiciones_extra, 800),
    vende_alcohol: booleanoInt(entradaLegal.vende_alcohol ?? legalActual?.vende_alcohol, 0),
    actualizado_en: legalActual?.actualizado_en || "",
  };

  const tenantNuevo = {
    ...auth.tenant,
    name: nombre || actual.nombre_comercial,
    documento_fiscal: texto(datos.documento_fiscal ?? actual.documento_fiscal, 40),
    telefono: texto(datos.telefono ?? actual.telefono, 40),
    whatsapp: texto(datos.whatsapp ?? actual.whatsapp, 40),
    whatsapp_pedidos: whatsappPedidos || actual.whatsapp_pedidos,
    email_contacto: emailContacto,
    email_pedidos: emailPedidos,
    horario_atencion: texto(datos.horario_atencion ?? actual.horario_atencion, 120),
    direccion_linea1: texto(datos.direccion_linea1 ?? actual.direccion_linea1, 160),
    direccion_linea2: texto(datos.direccion_linea2 ?? actual.direccion_linea2, 160),
    localidad: texto(datos.localidad ?? actual.localidad, 80),
    provincia_estado: texto(datos.provincia_estado ?? actual.provincia_estado, 80),
    codigo_postal: texto(datos.codigo_postal ?? actual.codigo_postal, 20),
    pais: texto(datos.pais ?? actual.pais, 60),
    moneda_simbolo: texto(datos.moneda_simbolo ?? actual.moneda_simbolo, 3) || "$",
    texto_atencion: texto(datos.texto_atencion ?? actual.texto_atencion, 200),
    texto_hero: texto(datos.texto_hero ?? actual.texto_hero, 80),
    texto_hero_bajada: texto(datos.texto_hero_bajada ?? actual.texto_hero_bajada, 160),
    texto_footer: texto(datos.texto_footer ?? actual.texto_footer, 300),
    brand: JSON.stringify(brand),
  };

  await getCoreClient().execute({
    sql: `UPDATE tenants SET
      name = ?, documento_fiscal = ?, telefono = ?, whatsapp = ?, whatsapp_pedidos = ?,
      email_contacto = ?, email_pedidos = ?, horario_atencion = ?, direccion_linea1 = ?,
      direccion_linea2 = ?, localidad = ?, provincia_estado = ?, codigo_postal = ?, pais = ?,
      moneda_simbolo = ?, texto_atencion = ?, texto_hero = ?, texto_hero_bajada = ?,
      texto_footer = ?, brand = ?
      WHERE id = ?`,
    args: [
      tenantNuevo.name,
      tenantNuevo.documento_fiscal,
      tenantNuevo.telefono,
      tenantNuevo.whatsapp,
      tenantNuevo.whatsapp_pedidos,
      tenantNuevo.email_contacto,
      tenantNuevo.email_pedidos,
      tenantNuevo.horario_atencion,
      tenantNuevo.direccion_linea1,
      tenantNuevo.direccion_linea2,
      tenantNuevo.localidad,
      tenantNuevo.provincia_estado,
      tenantNuevo.codigo_postal,
      tenantNuevo.pais,
      tenantNuevo.moneda_simbolo,
      tenantNuevo.texto_atencion,
      tenantNuevo.texto_hero,
      tenantNuevo.texto_hero_bajada,
      tenantNuevo.texto_footer,
      tenantNuevo.brand,
      auth.tenant.id,
    ],
  });

  await getCoreClient().execute({
    sql: `INSERT INTO tenant_legal (
        tenant_id, razon_social, jurisdiccion, entrega_retiro, entrega_envio,
        entrega_zonas, entrega_demora, envio_costo_cents, cambios_plazo_dias,
        cambios_condiciones, medios_pago, condiciones_extra, vende_alcohol, actualizado_en
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(tenant_id) DO UPDATE SET
        razon_social = excluded.razon_social,
        jurisdiccion = excluded.jurisdiccion,
        entrega_retiro = excluded.entrega_retiro,
        entrega_envio = excluded.entrega_envio,
        entrega_zonas = excluded.entrega_zonas,
        entrega_demora = excluded.entrega_demora,
        envio_costo_cents = excluded.envio_costo_cents,
        cambios_plazo_dias = excluded.cambios_plazo_dias,
        cambios_condiciones = excluded.cambios_condiciones,
        medios_pago = excluded.medios_pago,
        condiciones_extra = excluded.condiciones_extra,
        vende_alcohol = excluded.vende_alcohol,
        actualizado_en = datetime('now')`,
    args: [
      legalNueva.tenant_id,
      legalNueva.razon_social,
      legalNueva.jurisdiccion,
      legalNueva.entrega_retiro,
      legalNueva.entrega_envio,
      legalNueva.entrega_zonas,
      legalNueva.entrega_demora,
      legalNueva.envio_costo_cents,
      legalNueva.cambios_plazo_dias,
      legalNueva.cambios_condiciones,
      legalNueva.medios_pago,
      legalNueva.condiciones_extra,
      legalNueva.vende_alcohol,
    ],
  });

  await getCoreClient().execute({
    sql: `INSERT INTO tenant_legal_envio (tenant_id, envio_costo, actualizado_en)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(tenant_id) DO UPDATE SET
        envio_costo = excluded.envio_costo,
        actualizado_en = datetime('now')`,
    args: [legalNueva.tenant_id, legalNueva.envio_costo],
  });

  const actualizado = await buscarTenant(auth.tenant.id);
  const legalGuardada = await leerLegalTenant(auth.tenant.id);
  const parametros = parametrosTenant(actualizado || auth.tenant, legalGuardada);
  const faltantes = [...parametros.legal_faltantes];
  for (const aviso of avisos) {
    if (!faltantes.includes(aviso)) faltantes.push(aviso);
  }
  return { ...parametros, legal_faltantes: faltantes };
}

export default async function handler(req: any, res: any) {
  // Ninguna respuesta del panel (incluido el token de sesión) debe cachearse.
  encabezado(res, "Cache-Control", "no-store");

  if (metodo(req) !== "POST") {
    return fallo(res, 405, "METODO_NO_PERMITIDO", "Use POST.");
  }

  const body = await leerBody(req);
  const accion = texto(body.accion, 60);
  const slug = resolverTenantSlug({ ...req, body });
  if (!accion) return fallo(res, 400, "VALIDACION", "Falta la acción.");

  try {
    if (accion === "verificar") {
      return await verificarLogin(req, res, body, slug);
    }
    if (accion === "salir") {
      // El token vive en sessionStorage; el cliente lo borra. No hay estado en el servidor.
      return responder(res, 200, { ok: true });
    }

    const auth = await autenticarAdmin(slug, body.sesion ?? body.email);
    if (auth.ok === false) {
      return fallo(res, auth.status, auth.error, auth.mensaje);
    }
    const { usuario, tenant, db } = auth;
    const ok = (cuerpo: Record<string, unknown>) =>
      responder(res, 200, { ...cuerpo, sesion: renovarSesion(auth.sesion) });

    switch (accion) {
      case "latido": {
        // Actividad sin cambios de datos: solo renueva el vencimiento.
        return ok({ ok: true });
      }

      case "get_parametros": {
        const legal = await leerLegalTenant(tenant.id);
        return ok({ ok: true, parametros: parametrosTenant(tenant, legal) });
      }

      case "set_parametros": {
        const datos = (body.datos || {}) as Record<string, unknown>;
        const parametros = await guardarParametros(auth, datos);
        await auditar(tenant.id, usuario.id, "PARAMETROS_ACTUALIZADOS");
        return ok({ ok: true, parametros });
      }

      case "resumen": {
        const [r, c, p] = await Promise.all([
          db.execute("SELECT COUNT(*) AS total FROM rubros"),
          db.execute("SELECT COUNT(*) AS total FROM categorias"),
          db.execute("SELECT COUNT(*) AS total, SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) AS activos FROM productos"),
        ]);
        return ok({
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
        return ok({ ok: true, rubros: rs.rows.map((f) => filaRubro(f)) });
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
        return ok({ ok: true, id: Number(rs.lastInsertRowid) });
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
        return ok({ ok: true });
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
        return ok({ ok: true });
      }

      // ── Categorías ─────────────────────────────────────────────────────────
      case "listar_categorias": {
        const rs = await db.execute(
          `SELECT c.*, r.rubro FROM categorias c
           JOIN rubros r ON r.id = c.id_rubro
           ORDER BY r.orden, c.orden, c.id`
        );
        return ok({ ok: true, categorias: rs.rows.map((f) => filaCategoria(f)) });
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
        return ok({ ok: true, id: Number(rs.lastInsertRowid) });
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
        return ok({ ok: true });
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
        return ok({ ok: true });
      }

      // ── Productos ──────────────────────────────────────────────────────────
      case "listar_productos": {
        const rs = await db.execute(
          `SELECT p.*, c.categoria, c.id_rubro, r.rubro FROM productos p
           JOIN categorias c ON c.id = p.id_categoria
           JOIN rubros r ON r.id = c.id_rubro
           ORDER BY r.orden, c.orden, p.orden, p.id`
        );
        return ok({ ok: true, productos: rs.rows.map((f) => filaProducto(f)) });
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
        return ok({ ok: true, id: Number(rs.lastInsertRowid) });
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
        return ok({ ok: true });
      }

      case "desactivar_producto": {
        const id = idValido(body.id);
        await db.execute({
          sql: "UPDATE productos SET activo = 0, updated_at = datetime('now') WHERE id = ?",
          args: [id],
        });
        await auditar(tenant.id, usuario.id, "PRODUCTO_DESACTIVADO", { id });
        return ok({ ok: true });
      }

      case "borrar_producto": {
        const id = idValido(body.id);
        await db.execute({ sql: "DELETE FROM productos WHERE id = ?", args: [id] });
        await auditar(tenant.id, usuario.id, "PRODUCTO_BORRADO", { id });
        return ok({ ok: true });
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
