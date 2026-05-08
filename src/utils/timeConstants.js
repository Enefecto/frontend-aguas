export const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export const SEGUNDOS_POR_MES = {
  enero: 2_678_400,
  febrero: 2_419_200,
  marzo: 2_678_400,
  abril: 2_592_000,
  mayo: 2_678_400,
  junio: 2_592_000,
  julio: 2_678_400,
  agosto: 2_678_400,
  septiembre: 2_592_000,
  octubre: 2_678_400,
  noviembre: 2_592_000,
  diciembre: 2_678_400,
};

export const SEGUNDOS_POR_AÑO = 31_536_000;
export const SEGUNDOS_POR_AÑO_BISIESTO = 31_622_400;

export const esBisiesto = (año) =>
  (año % 4 === 0 && año % 100 !== 0) || año % 400 === 0;

export const segundosFebrero = (año) => esBisiesto(año) ? 2_505_600 : 2_419_200;

// TEMP: client-side cutoff for chart data. Drops measurements before this year.
// Remove once the DB-side filters reject pre-2014 records at the source.
export const MIN_YEAR_GRAFICOS = 2014;

export const filterByMinYear = (rows, dateKey = 'fecha_medicion') => {
  if (!Array.isArray(rows)) return rows;
  return rows.filter(r => {
    const d = new Date(r?.[dateKey]);
    return Number.isFinite(d.getTime()) && d.getUTCFullYear() >= MIN_YEAR_GRAFICOS;
  });
};
