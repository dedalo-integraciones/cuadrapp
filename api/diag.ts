/**
 * Endpoint TEMPORAL de diagnóstico.
 *
 * No tiene imports estáticos: si la función responde, el problema está en
 * alguna dependencia; si también devuelve 500, el problema es del runtime.
 *
 * Se elimina en cuanto se identifique la causa.
 */
export default async function handler(_req: any, res: any) {
  const out: Record<string, unknown> = {
    ok: true,
    node: process.version,
    platform: process.platform,
    arch: process.arch,
  };

  const banderas: Record<string, string> = {};
  for (const clave of [
    "TURSO_CORE_URL",
    "TURSO_CORE_TOKEN",
    "TURSO_APP_URL",
    "TURSO_APP_TOKEN",
    "TENANT_OVERRIDE",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ]) {
    banderas[clave] = process.env[clave] ? "definida" : "falta";
  }
  out.env = banderas;

  try {
    const mod: any = await import("@libsql/client/web");
    out.libsql_client = typeof mod.createClient;
  } catch (e: any) {
    out.libsql_error = String((e && (e.stack || e.message)) || e);
  }

  try {
    const tenantMod: any = await import("../src/db/tenant");
    const tenant = await tenantMod.buscarTenant("cuadra");
    out.tenant = tenant ? { id: tenant.id, name: tenant.name } : null;
  } catch (e: any) {
    out.tenant_error = String((e && (e.stack || e.message)) || e);
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(out));
}
