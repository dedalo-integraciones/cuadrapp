import {
  buscarTenant,
  datosPublicosTenant,
  getTenantClient,
  tenantVigente,
} from "../../src/db/tenant.js";
import { encabezado, metodo, responder } from "../../src/server/http.js";

/**
 * GET /api/catalog/:slug
 * Devuelve el catálogo activo del negocio. El precio viaja en centavos y en
 * pesos; la UI decide cómo mostrarlo. Nunca expone turso_db ni tokens.
 */
export default async function handler(req: any, res: any) {
  if (metodo(req) !== "GET") {
    return responder(res, 405, { ok: false, error: "METODO_NO_PERMITIDO" });
  }

  try {
    const slugRaw = req?.params?.slug || req?.query?.slug;
    const slug = String(Array.isArray(slugRaw) ? slugRaw[0] : slugRaw || "").trim().toLowerCase();
    if (!slug) return responder(res, 404, { ok: false, error: "TENANT_NO_ENCONTRADO" });

    const tenant = await buscarTenant(slug);
    if (!tenant) return responder(res, 404, { ok: false, error: "TENANT_NO_ENCONTRADO" });
    if (!tenantVigente(tenant)) {
      return responder(res, 403, { ok: false, error: "TENANT_BLOQUEADO" });
    }

    const db = getTenantClient(tenant);
    const [rubrosRs, categoriasRs, productosRs] = await Promise.all([
      db.execute(
        "SELECT id, rubro, descripcion, orden, color FROM rubros WHERE activo = 1 ORDER BY orden, id"
      ),
      db.execute(
        `SELECT c.id, c.id_rubro, c.categoria, c.descripcion, c.orden, c.color
         FROM categorias c
         JOIN rubros r ON r.id = c.id_rubro
         WHERE c.activo = 1 AND r.activo = 1
         ORDER BY r.orden, c.orden, c.id`
      ),
      db.execute(
        `SELECT p.id, p.id_categoria, p.nombre, p.detalle_1, p.detalle_2,
                p.precio_cents, p.color, p.destacado, p.popular, p.orden, p.imagen,
                c.categoria, c.id_rubro, c.color AS categoria_color,
                r.rubro, r.color AS rubro_color
         FROM productos p
         JOIN categorias c ON c.id = p.id_categoria
         JOIN rubros r ON r.id = c.id_rubro
         WHERE p.activo = 1 AND c.activo = 1 AND r.activo = 1
         ORDER BY r.orden, c.orden, p.orden, p.id`
      ),
    ]);

    const rubros = rubrosRs.rows.map((fila) => ({
      id: Number(fila["id"]),
      rubro: String(fila["rubro"] || ""),
      descripcion: fila["descripcion"] ? String(fila["descripcion"]) : "",
      orden: Number(fila["orden"] || 0),
      color: fila["color"] ? String(fila["color"]) : "#C91810",
    }));

    const categorias = categoriasRs.rows.map((fila) => ({
      id: Number(fila["id"]),
      id_rubro: Number(fila["id_rubro"]),
      categoria: String(fila["categoria"] || ""),
      descripcion: fila["descripcion"] ? String(fila["descripcion"]) : "",
      orden: Number(fila["orden"] || 0),
      color: fila["color"] ? String(fila["color"]) : "#C91810",
    }));

    const productos = productosRs.rows.map((fila) => {
      const cents = Number(fila["precio_cents"] || 0);
      return {
        id: Number(fila["id"]),
        id_categoria: Number(fila["id_categoria"]),
        id_rubro: Number(fila["id_rubro"]),
        nombre: String(fila["nombre"] || ""),
        detalle_1: fila["detalle_1"] ? String(fila["detalle_1"]) : "",
        detalle_2: fila["detalle_2"] ? String(fila["detalle_2"]) : "",
        precio_cents: cents,
        precio: Math.round((cents / 100) * 100) / 100,
        color: String(fila["color"] || fila["categoria_color"] || fila["rubro_color"] || "#C91810"),
        destacado: Number(fila["destacado"] || 0) === 1,
        popular: Number(fila["popular"] || 0) === 1,
        orden: Number(fila["orden"] || 0),
        imagen: fila["imagen"] ? String(fila["imagen"]) : "",
        categoria: String(fila["categoria"] || ""),
        rubro: String(fila["rubro"] || ""),
      };
    });

    encabezado(res, "Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return responder(res, 200, {
      ok: true,
      tenant: datosPublicosTenant(tenant),
      rubros,
      categorias,
      productos,
      generado_en: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[api/catalog] error", error);
    return responder(res, 500, { ok: false, error: "ERROR_INTERNO" });
  }
}
