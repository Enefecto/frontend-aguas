import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitiza HTML completo usando DOMPurify
 * Previene ataques XSS eliminando scripts y contenido malicioso
 *
 * @param {string} html - HTML a sanitizar
 * @param {object} config - Configuración opcional de DOMPurify
 * @returns {string} - HTML sanitizado
 */
export const sanitizeHTML = (html, config = {}) => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const defaultConfig = {
    ALLOWED_TAGS: [
      'div', 'span', 'p', 'br', 'strong', 'em', 'b', 'i', 'u',
      'ul', 'ol', 'li', 'hr', 'svg', 'path', 'circle', 'rect'
    ],
    ALLOWED_ATTR: [
      'class', 'style', 'width', 'height', 'viewBox', 'fill',
      'stroke', 'stroke-width', 'd', 'cx', 'cy', 'r', 'aria-hidden'
    ],
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true
  };

  return DOMPurify.sanitize(html, { ...defaultConfig, ...config });
};

/**
 * Sanitiza texto simple eliminando caracteres peligrosos
 * Uso para texto plano que se insertará en HTML
 *
 * @param {string} text - Texto a sanitizar
 * @returns {string} - Texto sanitizado
 */
export const sanitizeText = (text) => {
  if (text === null || text === undefined) {
    return '';
  }

  if (typeof text !== 'string') {
    text = String(text);
  }

  // Eliminar caracteres potencialmente peligrosos
  return text
    .replace(/[<>]/g, '') // Eliminar < y >
    .replace(/javascript:/gi, '') // Eliminar javascript:
    .replace(/on\w+=/gi, '') // Eliminar event handlers (onclick=, onerror=, etc)
    .trim();
};

/**
 * Valida que un valor sea un número válido
 * Retorna el número o un valor por defecto
 *
 * @param {*} value - Valor a validar
 * @param {number} defaultValue - Valor por defecto si no es válido
 * @returns {number} - Número validado o valor por defecto
 */
export const validateNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  const num = Number(value);

  if (isNaN(num) || !isFinite(num)) {
    return defaultValue;
  }

  return num;
};

/**
 * Valida un color hexadecimal
 * Retorna el color si es válido o un color por defecto
 *
 * @param {string} color - Color en formato hex (#RRGGBB o #RGB)
 * @param {string} defaultColor - Color por defecto
 * @returns {string} - Color validado
 */
export const validateColor = (color, defaultColor = '#000000') => {
  if (!color || typeof color !== 'string') {
    return defaultColor;
  }

  // Validar formato hexadecimal
  const hexColorRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;

  if (hexColorRegex.test(color)) {
    return color;
  }

  return defaultColor;
};

/**
 * Valida y sanitiza una URL
 * Solo permite http, https y rutas relativas
 *
 * @param {string} url - URL a validar
 * @param {string} defaultUrl - URL por defecto
 * @returns {string} - URL sanitizada
 */
export const sanitizeURL = (url, defaultUrl = '#') => {
  if (!url || typeof url !== 'string') {
    return defaultUrl;
  }

  // Eliminar espacios
  url = url.trim();

  // Permitir solo protocolos seguros
  const urlPattern = /^(https?:\/\/|\/)/i;

  if (!urlPattern.test(url)) {
    return defaultUrl;
  }

  // Eliminar javascript: y data:
  if (/javascript:|data:/gi.test(url)) {
    return defaultUrl;
  }

  return url;
};

/**
 * Valida un objeto de respuesta de API
 * Verifica que sea un objeto válido y no null
 *
 * @param {*} data - Datos a validar
 * @returns {boolean} - true si es válido
 */
export const validateAPIResponse = (data) => {
  return data !== null &&
         data !== undefined &&
         typeof data === 'object' &&
         !Array.isArray(data);
};

/**
 * Valida un array de respuesta de API
 * Verifica que sea un array válido
 *
 * @param {*} data - Datos a validar
 * @returns {boolean} - true si es válido
 */
export const validateAPIArrayResponse = (data) => {
  return Array.isArray(data) && data.length > 0;
};

/**
 * Formatea un número de manera segura
 * Valida y formatea usando toLocaleString
 *
 * @param {*} value - Valor a formatear
 * @param {string} locale - Locale para formato (default: 'es-CL')
 * @param {string} fallback - Texto si no es válido
 * @returns {string} - Número formateado o fallback
 */
export const safeFormatNumber = (value, locale = 'es-CL', fallback = 'N/A') => {
  const num = validateNumber(value, null);

  if (num === null) {
    return fallback;
  }

  try {
    return num.toLocaleString(locale);
  } catch {
    return String(num);
  }
};

/**
 * Valida que un valor de filtro esté dentro de un rango permitido
 * Previene inyección de valores maliciosos o extremos en filtros
 *
 * @param {*} value - Valor a validar
 * @param {number} min - Valor mínimo permitido
 * @param {number} max - Valor máximo permitido
 * @param {number} defaultValue - Valor por defecto si no es válido
 * @returns {number} - Valor validado dentro del rango
 */
export const validateFilterInput = (value, min, max, defaultValue) => {
  // Primero validar que sea un número
  const num = validateNumber(value, defaultValue);

  // Verificar que esté dentro del rango
  if (num < min) {
    return min;
  }

  if (num > max) {
    return max;
  }

  return num;
};

/**
 * Valida valores de string contra una whitelist
 * Previene inyección de valores no permitidos
 *
 * @param {*} value - Valor a validar
 * @param {string[]} allowedValues - Lista de valores permitidos
 * @param {string} defaultValue - Valor por defecto si no es válido
 * @returns {string} - Valor validado o por defecto
 */
export const validateWhitelist = (value, allowedValues, defaultValue = '') => {
  if (typeof value !== 'string') {
    return defaultValue;
  }

  // Convertir a string y limpiar
  const cleanValue = String(value).trim();

  // Verificar si está en la whitelist
  if (allowedValues.includes(cleanValue)) {
    return cleanValue;
  }

  return defaultValue;
};
