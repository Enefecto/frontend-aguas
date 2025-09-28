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