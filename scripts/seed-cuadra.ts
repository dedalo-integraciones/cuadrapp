import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { crearClienteLibsql } from "../src/db/client";
import { asegurarTenant, migrarTenant } from "./db-utils";

type Fila = Array<string | number | null | undefined>;

const COLORES_POR_DEFECTO: Record<string, string> = {
  COMBOS: "#C91810",
  LOMOS: "#e84393",
  HAMBURGUESAS: "#00b6b6",
  PIZZAS: "#7c5cbf",
  EMPANADAS: "#5fbf8b",
  "MENÚ DEL DÍA": "#C91810",
  "MENU DEL DIA": "#C91810",
  BEBIDAS: "#0055A4",
  POSTRES: "#8E44AD",
};

function normalizar(valor: unknown): string {
  return String(valor ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function texto(valor: unknown): string {
  return String(valor ?? "").trim();
}

function colorHex(valor: unknown, respaldo: string): string {
  const limpio = texto(valor).replace(/['"]/g, "");
  return /^#[0-9A-Fa-f]{6}$/.test(limpio) ? limpio : respaldo;
}

function imagenLocal(url: string): string {
  const match = url.match(/imgi[-_](\d+)[-_]default/i);
  if (match && match[1]) return `/gallery/mimgi_${match[1]}_default.webp`;
  return url;
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--");
  const forzar = args.includes("--force");
  const posicionales = args.filter((a) => !a.startsWith("--"));
  const slug = String(posicionales[0] || process.env.TENANT_OVERRIDE || "")
    .trim()
    .toLowerCase();
  const archivo = String(posicionales[1] || "").trim();

  if (!/^[a-z0-9][a-z0-9-]{1,48}$/.test(slug)) {
    throw new Error(
      "Indique el negocio: npm run db:seed -- <slug> <archivo.xlsx> [--force]"
    );
  }
  if (!archivo) {
    throw new Error(
      "Indique el archivo .xlsx: npm run db:seed -- <slug> <archivo.xlsx> [--force]"
    );
  }
  if (path.extname(archivo).toLowerCase() !== ".xlsx") {
    throw new Error("El catálogo debe ser un archivo .xlsx");
  }

  const rutaXlsx = path.resolve(process.cwd(), archivo);
  if (!fs.existsSync(rutaXlsx)) {
    throw new Error(`No se encontró el archivo ${archivo}`);
  }

  const tenant = await asegurarTenant(slug);
  await migrarTenant(tenant.turso_db);
  const db = crearClienteLibsql(tenant.turso_db, process.env.TURSO_APP_TOKEN);

  const existentes = await db.execute("SELECT COUNT(*) AS total FROM productos");
  const totalProductos = Number(existentes.rows[0]?.["total"] || 0);
  if (totalProductos > 0 && !forzar) {
    console.log(`[seed] el tenant ${slug} ya tiene ${totalProductos} productos; no se toca.`);
    console.log("[seed] use npm run db:seed -- " + slug + " " + archivo + " --force para recargar desde cero.");
    return;
  }

  const libro = XLSX.read(fs.readFileSync(rutaXlsx), { type: "buffer" });
  const hojaRubros = libro.Sheets["rubros"];
  const hojaProductos = libro.Sheets["productos"];
  if (!hojaRubros || !hojaProductos) {
    throw new Error("El archivo .xlsx debe tener las solapas 'rubros' y 'productos'");
  }

  const filasRubros = XLSX.utils.sheet_to_json<Fila>(hojaRubros, { header: 1, blankrows: false });
  const filasProductos = XLSX.utils.sheet_to_json<Fila>(hojaProductos, { header: 1, blankrows: false });

  // ── Limpieza para recarga ──────────────────────────────────────────────────
  if (forzar) {
    await db.execute("DELETE FROM productos");
    await db.execute("DELETE FROM categorias");
    await db.execute("DELETE FROM rubros");
  }

  // ── Rubros de primer nivel ─────────────────────────────────────────────────
  const rubrosBase = [
    { rubro: "COMIDAS", descripcion: "Combos, platos y menú del día", orden: 1, color: "#C91810" },
    { rubro: "BEBIDAS", descripcion: "Bebidas y refrescos", orden: 2, color: "#0055A4" },
  ];
  const idRubro: Record<string, number> = {};
  for (const r of rubrosBase) {
    const rs = await db.execute({
      sql: "INSERT INTO rubros (rubro, descripcion, orden, color, activo) VALUES (?, ?, ?, ?, 1)",
      args: [r.rubro, r.descripcion, r.orden, r.color],
    });
    idRubro[r.rubro] = Number(rs.lastInsertRowid);
  }

  // ── Categorías desde la solapa rubros ──────────────────────────────────────
  const idCategoria: Record<string, number> = {};
  const encabezadoRubros = (filasRubros[0] || []).map((c) => texto(c).toLowerCase());
  const idxNombre = encabezadoRubros.indexOf("rubro");
  const idxColor = encabezadoRubros.indexOf("color");
  const idxDescrip = encabezadoRubros.indexOf("descrip");
  let ordenCategoria = 0;

  for (let i = 1; i < filasRubros.length; i++) {
    const fila = filasRubros[i] || [];
    const nombre = texto(idxNombre >= 0 ? fila[idxNombre] : fila[1]);
    if (!nombre) continue;
    const clave = normalizar(nombre);
    if (Object.values(idCategoria).length > 0 && idCategoria[clave]) continue;

    const color = colorHex(
      idxColor >= 0 ? fila[idxColor] : fila[2],
      COLORES_POR_DEFECTO[clave] || "#C91810"
    );
    const descripcion = texto(idxDescrip >= 0 ? fila[idxDescrip] : fila[3]);
    const padre = clave === "BEBIDAS" ? "BEBIDAS" : "COMIDAS";
    ordenCategoria += 1;

    const rs = await db.execute({
      sql: `INSERT INTO categorias (id_rubro, categoria, descripcion, orden, color, activo)
            VALUES (?, ?, ?, ?, ?, 1)`,
      args: [idRubro[padre], nombre, descripcion, ordenCategoria, color],
    });
    idCategoria[clave] = Number(rs.lastInsertRowid);
  }

  // Si la solapa no trae BEBIDAS, se crea igual para que el árbol quede completo.
  if (!idCategoria["BEBIDAS"]) {
    const rs = await db.execute({
      sql: `INSERT INTO categorias (id_rubro, categoria, descripcion, orden, color, activo)
            VALUES (?, 'BEBIDAS', 'Bebidas y refrescos', 99, '#0055A4', 1)`,
      args: [idRubro["BEBIDAS"]],
    });
    idCategoria["BEBIDAS"] = Number(rs.lastInsertRowid);
  }

  // ── Productos ──────────────────────────────────────────────────────────────
  const encabezadoProductos = (filasProductos[0] || []).map((c) => texto(c).toLowerCase());
  const col = (nombre: string) => encabezadoProductos.indexOf(nombre);
  const cRubro = col("rubro");
  const cNombre = col("nombre");
  const cDetalle1 = col("detalle_1");
  const cDetalle2 = col("detalle_2");
  const cPrecio = col("precio");
  const cColor = col("color");
  const cActivo = col("activo");
  const cImagen = col("imagen");

  let insertados = 0;
  for (let i = 1; i < filasProductos.length; i++) {
    const fila = filasProductos[i] || [];
    const nombre = texto(fila[cNombre]);
    if (!nombre) continue;

    const claveCategoria = normalizar(fila[cRubro]) || "VARIOS";
    let categoriaId = idCategoria[claveCategoria];
    if (!categoriaId) {
      const rs = await db.execute({
        sql: `INSERT INTO categorias (id_rubro, categoria, descripcion, orden, color, activo)
              VALUES (?, ?, '', 500, '#C91810', 1)`,
        args: [idRubro["COMIDAS"], texto(fila[cRubro]) || "VARIOS"],
      });
      categoriaId = Number(rs.lastInsertRowid);
      idCategoria[claveCategoria] = categoriaId;
    }

    const color = colorHex(
      fila[cColor],
      COLORES_POR_DEFECTO[claveCategoria] || "#C91810"
    );
    const precio = Number(String(fila[cPrecio] ?? "0").replace(/[^0-9.]/g, "")) || 0;
    const activo = normalizar(fila[cActivo]) === "NO" ? 0 : 1;
    const imagen = imagenLocal(texto(fila[cImagen]));

    await db.execute({
      sql: `INSERT INTO productos
            (id_categoria, nombre, detalle_1, detalle_2, precio_cents, color, activo,
             destacado, popular, orden, imagen)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`,
      args: [
        categoriaId,
        nombre,
        texto(fila[cDetalle1]) || null,
        texto(fila[cDetalle2]) || null,
        Math.round(precio * 100),
        color,
        activo,
        insertados + 1,
        imagen || null,
      ],
    });
    insertados += 1;
  }

  await db.execute({
    sql: `INSERT INTO settings (key, value) VALUES ('moneda_simbolo', '$')
          ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  });

  console.log(`[seed] tenant ${slug}: ${Object.keys(idRubro).length} rubros, ${ordenCategoria} categorías, ${insertados} productos.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seed] error:", error);
    process.exit(1);
  });
