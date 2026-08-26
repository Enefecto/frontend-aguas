/**
 * Agrega las filas de estadísticas que devuelve /api/cuencas/stats.
 *
 * `dw.Cuenca_Stats` no tiene una fila por cuenca: su grano es
 * (cuenca, subcuenca, subsubcuenca, región), así que una cuenca puede ocupar
 * entre 1 y 29 filas. El panel leía `estadisticas[0]` y descartaba el resto,
 * de modo que 35 de las 70 cuencas del país mostraban el resumen de un solo
 * tramo. Río Valdivia (cuenca 101) informaba 27.292 mediciones de las
 * 1.197.713 que tiene, y un caudal máximo de 55,83 L/s contra 136.705,92.
 *
 * Las filas particionan la cuenca —no hay una fila de rollup que ya incluya a
 * las demás—, cosa verificada contra `dw.Puntos_Mapa`: la suma de mediciones
 * coincide exactamente, tanto por cuenca como a nivel país.
 *
 * `total_puntos_unicos` queda deliberadamente fuera: sumarlo da 6.103 contra
 * 6.098 obras reales, porque cinco caen en borde de cuenca o de región y
 * aparecen en dos filas. Ningún panel lo muestra, así que no vale la pena
 * exponer un número con error conocido.
 *
 * @param {Array<Object>} filas - `estadisticas` tal como llega del endpoint
 * @returns {Object|null} - Estadísticas de la cuenca completa, o null si no hay filas
 */

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export const agregarStatsCuenca = (filas) => {
  if (!Array.isArray(filas) || filas.length === 0) return null;

  const totalMediciones = filas.reduce(
    (suma, f) => suma + (num(f?.total_mediciones) ?? 0),
    0
  );

  const minimos = filas.map(f => num(f?.caudal_minimo)).filter(v => v !== null);
  const maximos = filas.map(f => num(f?.caudal_maximo)).filter(v => v !== null);

  // Solo los tramos con mediciones pesan en promedio y desviación: un tramo sin
  // datos no es un caudal de cero, es la ausencia de un caudal.
  const tramos = filas
    .map(f => ({
      n: num(f?.total_mediciones) ?? 0,
      media: num(f?.caudal_promedio),
      desv: num(f?.caudal_desviacion_estandar)
    }))
    .filter(t => t.n > 0 && t.media !== null);

  const nTotal = tramos.reduce((suma, t) => suma + t.n, 0);

  // Ponderado, no promedio simple: un tramo con 758.988 mediciones no puede
  // pesar lo mismo que uno con 41.
  const media = nTotal > 0
    ? tramos.reduce((suma, t) => suma + t.media * t.n, 0) / nTotal
    : null;

  // Varianza combinada. Promediar las desviaciones daría de menos, porque
  // ignora que cada tramo tiene su propia media: el segundo término es
  // justamente la dispersión *entre* tramos, que en una cuenca con subcuencas
  // muy dispares es la parte dominante.
  //
  //   σ² = [ Σ(nᵢ−1)·σᵢ² + Σ nᵢ·(μᵢ−μ)² ] / (N−1)
  //
  // Un tramo de una sola medición aporta (n−1)=0 al primer término y trae la
  // desviación en null, así que su varianza interna cuenta como cero; su
  // distancia a la media general sí suma.
  let desviacion = null;
  if (media !== null && nTotal > 1) {
    const acumulado = tramos.reduce((suma, t) => {
      const dentroDelTramo = t.desv !== null ? (t.n - 1) * t.desv * t.desv : 0;
      const entreTramos = t.n * (t.media - media) ** 2;
      return suma + dentroDelTramo + entreTramos;
    }, 0);
    desviacion = Math.sqrt(acumulado / (nTotal - 1));
  }

  return {
    total_mediciones: totalMediciones,
    caudal_promedio: media,
    caudal_minimo: minimos.length > 0 ? Math.min(...minimos) : null,
    caudal_maximo: maximos.length > 0 ? Math.max(...maximos) : null,
    caudal_desviacion_estandar: desviacion
  };
};
