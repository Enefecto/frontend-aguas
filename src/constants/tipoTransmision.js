/**
 * Tipo de transmisión de la medición (antes rotulado como "Canal").
 *
 * El backend entrega `canal_transmision` como código numérico.
 * Mapeo definido por la DGA:
 *   0 = Online, 1 = Archivo, 2 = Formulario
 */
export const TIPO_TRANSMISION = {
  0: 'Online',
  1: 'Archivo',
  2: 'Formulario'
};

export const TIPO_TRANSMISION_LABEL = 'Tipo de transmisión';

/**
 * Traduce el código de transmisión a su etiqueta legible.
 * @param {number|string|null|undefined} codigo - Código de canal de transmisión
 * @param {string} fallback - Valor a retornar si no hay dato
 * @returns {string} Etiqueta legible, o el código crudo si no está en el mapeo
 */
export const getTipoTransmision = (codigo, fallback = '—') => {
  if (codigo === null || codigo === undefined || String(codigo).trim() === '') {
    return fallback;
  }

  const clave = parseInt(codigo, 10);
  if (!Number.isNaN(clave) && clave in TIPO_TRANSMISION) {
    return TIPO_TRANSMISION[clave];
  }

  // Código desconocido: mostrar el valor crudo en vez de ocultar el dato
  return String(codigo);
};

/**
 * Un punto puede transmitir por varias vías a la vez: la tabla del backend está
 * agregada por (punto, canal). `canales_transmision` trae todas.
 * @param {Array<number|string>|null|undefined} codigos - Lista de códigos
 * @param {number|string|null|undefined} respaldo - Canal único, si no vino la lista
 * @param {string} fallback - Valor a retornar si no hay dato
 * @returns {string} Etiquetas separadas por coma
 */
export const getTiposTransmision = (codigos, respaldo = null, fallback = '—') => {
  if (Array.isArray(codigos) && codigos.length > 0) {
    return codigos.map(c => getTipoTransmision(c, null)).filter(Boolean).join(', ') || fallback;
  }
  return getTipoTransmision(respaldo, fallback);
};
