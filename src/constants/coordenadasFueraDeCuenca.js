// GENERADO — no editar a mano.
// Regenerar con: uv run --with pyshp --with shapely python scripts/generar_mascara_cuencas.py
//
// Obras cuya coordenada cae fuera de toda cuenca hidrográfica BNA de la DGA,
// es decir fuera de Chile continental. Son errores de georreferenciación en el
// dato de origen, no del visualizador.
//
// Evaluado sobre 6098 obras: 6091 dentro, 7 fuera.
// Clave: `${utm_norte}|${utm_este}`.

export const COORDENADAS_FUERA_DE_CUENCA = new Set([
  // lat -20.8049, lon -68.5462 — SHAC: No Informado
  '7699378|547222',
  // lat -22.0099, lon -68.0222 — SHAC: None
  '7565750|600925',
  // lat -30.1649, lon -72.2677 — SHAC: No Informado
  '6658415|185275',
  // lat -33.4019, lon -72.8053 — SHAC: No Informado
  '6301999|704101',
  // lat -33.4034, lon -72.8053 — SHAC: No Informado
  '6301840|704101',
  // lat -41.7790, lon -73.5245 — SHAC: Rio Maullin
  '5373708|622624',
  // lat -41.8964, lon -73.5242 — SHAC: No Informado
  '5360673|622422',
]);
