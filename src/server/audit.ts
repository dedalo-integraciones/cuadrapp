import { getCoreClient } from "../db/core";

/** Auditoría best-effort: nunca rompe la operación principal. */
export async function auditar(
  tenantId: string | null,
  userId: number | null,
  accion: string,
  detalle: Record<string, unknown> = {}
): Promise<void> {
  try {
    await getCoreClient().execute({
      sql: "INSERT INTO audit_log (tenant_id, user_id, accion, detalle) VALUES (?, ?, ?, ?)",
      args: [tenantId, userId, accion, JSON.stringify(detalle)],
    });
  } catch {
    // La auditoría no debe bloquear la operación.
  }
}
