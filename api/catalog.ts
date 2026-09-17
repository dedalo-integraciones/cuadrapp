export default async function handler(_req: any, res: any) {
  try {
    const GOOGLE_SHEET_ID =
      process.env.GOOGLE_SHEET_ID || '127HQwv4KoZkVMTYJ5Q5iYk2mp-twYu309dapZ5lr6Cg';

    const rubrosUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=rubros`;
    const productosUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=productos`;

    const [resRubros, resProductos] = await Promise.allSettled([
      fetch(rubrosUrl),
      fetch(productosUrl),
    ]);

    let rubrosCsv = '';
    let productosCsv = '';

    if (resRubros.status === 'fulfilled' && resRubros.value.ok) {
      rubrosCsv = await resRubros.value.text();
    }

    if (resProductos.status === 'fulfilled' && resProductos.value.ok) {
      productosCsv = await resProductos.value.text();
    } else {
      const fallbackUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv`;
      const fallbackRes = await fetch(fallbackUrl);
      if (fallbackRes.ok) {
        productosCsv = await fallbackRes.text();
      }
    }

    if (!productosCsv) {
      return res.status(502).json({
        success: false,
        error: 'No se pudo obtener el catálogo desde Google Sheets',
      });
    }

    // Cache en borde de Vercel por 60 segundos
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({
      success: true,
      rubrosCsv,
      productosCsv,
    });
  } catch (error) {
    console.error('Error en /api/catalog de Vercel:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno en Vercel Serverless Function',
    });
  }
}
