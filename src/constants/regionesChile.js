/**
 * Diccionario de regiones de Chile
 * Mapea códigos de región (números) a nombres completos
 */

export const REGIONES_CHILE = {
  1: "Región de Tarapacá",
  2: "Región de Antofagasta",
  3: "Región de Atacama",
  4: "Región de Coquimbo",
  5: "Región de Valparaíso",
  6: "Región del Libertador General Bernardo O'Higgins",
  7: "Región del Maule",
  8: "Región del Biobío",
  9: "Región de La Araucanía",
  10: "Región de Los Lagos",
  11: "Región Aysén del General Carlos Ibáñez del Campo",
  12: "Región de Magallanes y de la Antártica Chilena",
  13: "Región Metropolitana de Santiago",
  14: "Región de Los Ríos",
  15: "Región de Arica y Parinacota",
  16: "Región de Ñuble"
};

/**
 * Función para obtener el nombre de una región por su código
 * @param {number|string} codigoRegion - Código numérico de la región
 * @returns {string} Nombre completo de la región o el código si no se encuentra
 */
export const getNombreRegion = (codigoRegion) => {
  const codigo = parseInt(codigoRegion);
  return REGIONES_CHILE[codigo] || `Región ${codigoRegion}`;
};

/**
 * Función para obtener todas las regiones como array de objetos
 * @returns {Array} Array con objetos {codigo, nombre}
 */
export const getRegionesArray = () => {
  return Object.entries(REGIONES_CHILE).map(([codigo, nombre]) => ({
    codigo: parseInt(codigo),
    nombre
  }));
};

/**
 * Función para buscar región por nombre (parcial)
 * @param {string} nombreParcial - Parte del nombre a buscar
 * @returns {Array} Array con regiones que coinciden
 */
export const buscarRegionPorNombre = (nombreParcial) => {
  const termino = nombreParcial.toLowerCase();
  return getRegionesArray().filter(region =>
    region.nombre.toLowerCase().includes(termino)
  );
};

/**
 * Rangos esperados de UTM_NORTE por región de Chile.
 * Usados para validar que las coordenadas UTM de un punto
 * sean coherentes con su región declarada.
 *
 * Clave: código de región (numérico)
 * Valor: { min, max } del UTM_NORTE esperado
 */
export const RANGOS_UTM_REGIONES = {
  15: { min: 7850000, max: 8000000 },  // Arica y Parinacota
  1:  { min: 7600000, max: 7850000 },  // Tarapacá
  2:  { min: 7100000, max: 7700000 },  // Antofagasta
  3:  { min: 6700000, max: 7100000 },  // Atacama
  4:  { min: 6250000, max: 6800000 },  // Coquimbo
  5:  { min: 6200000, max: 6500000 },  // Valparaíso
  13: { min: 6150000, max: 6400000 },  // Metropolitana
  6:  { min: 6100000, max: 6350000 },  // O'Higgins
  7:  { min: 5950000, max: 6250000 },  // Maule
  16: { min: 5850000, max: 6050000 },  // Ñuble
  8:  { min: 5750000, max: 6000000 },  // Biobío
  9:  { min: 5600000, max: 5850000 },  // Araucanía
  14: { min: 5450000, max: 5650000 },  // Los Ríos
  10: { min: 5200000, max: 5600000 },  // Los Lagos
  11: { min: 4900000, max: 5150000 },  // Aysén
  12: { min: 4000000, max: 4300000 },  // Magallanes
};

/**
 * Valida si un UTM_NORTE es coherente con la región declarada del punto.
 * @param {number} utmNorte - Coordenada UTM Norte
 * @param {number|string} codRegion - Código de la región
 * @returns {boolean} true si la coordenada es inválida (fuera de rango), false si es válida o no hay datos para validar
 */
export const isCoordenadasFueraDeRango = (utmNorte, codRegion) => {
  if (!utmNorte || !codRegion) return false;

  const rango = RANGOS_UTM_REGIONES[parseInt(codRegion)];
  if (!rango) return false; // Región desconocida, no podemos validar

  return utmNorte < rango.min || utmNorte > rango.max;
};