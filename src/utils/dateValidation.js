/**
 * Valida el formato y rango de una fecha en formato MM-YYYY
 * @param {string} fecha - Fecha a validar
 * @returns {Object} - { valido: boolean, mensaje: string }
 */
export const validarFecha = (fecha) => {
  if (!fecha || fecha.trim() === '') {
    return { valido: true, mensaje: '' }; // Opcional
  }

  const regex = /^(0[1-9]|1[0-2])-(\d{4})$/;
  if (!regex.test(fecha)) {
    return { valido: false, mensaje: "Formato debe ser MM-AAAA" };
  }

  const [mes, año] = fecha.split("-").map(Number);

  if (mes < 1 || mes > 12) {
    return { valido: false, mensaje: "Mes debe estar entre 01 y 12" };
  }

  if (año < 1900 || año > 9999) {
    return { valido: false, mensaje: "Año debe estar entre 1900 y 9999" };
  }

  return { valido: true, mensaje: '' };
};

/**
 * Valida que fecha_inicio <= fecha_fin
 * @param {string} fechaInicio - Fecha inicio en formato MM-YYYY
 * @param {string} fechaFin - Fecha fin en formato MM-YYYY
 * @returns {Object} - { valido: boolean, mensaje: string }
 */
export const validarRangoFechas = (fechaInicio, fechaFin) => {
  // Si alguna está vacía, no validar el rango
  if (!fechaInicio || !fechaFin) {
    return { valido: true, mensaje: '' };
  }

  // Validar formato de ambas primero
  const validacionInicio = validarFecha(fechaInicio);
  const validacionFin = validarFecha(fechaFin);

  if (!validacionInicio.valido || !validacionFin.valido) {
    return { valido: true, mensaje: '' }; // Ya se mostrarán errores individuales
  }

  // Convertir a Date para comparar
  const [mesInicio, añoInicio] = fechaInicio.split("-").map(Number);
  const [mesFin, añoFin] = fechaFin.split("-").map(Number);

  const dateInicio = new Date(añoInicio, mesInicio - 1);
  const dateFin = new Date(añoFin, mesFin - 1);

  if (dateInicio > dateFin) {
    return { valido: false, mensaje: "Fecha inicio debe ser menor o igual a fecha fin" };
  }

  return { valido: true, mensaje: '' };
};

/**
 * Formatea automáticamente el input mientras el usuario escribe
 * @param {string} value - Valor actual del input
 * @returns {string} - Valor formateado
 */
export const autoformatearFecha = (value) => {
  // Eliminar todo lo que no sea dígito
  const digitos = value.replace(/\D/g, '');

  // Si tiene más de 2 dígitos, agregar el guión automáticamente
  if (digitos.length <= 2) {
    return digitos;
  }

  // Formato MM-YYYY
  const mes = digitos.slice(0, 2);
  const año = digitos.slice(2, 6);

  return `${mes}-${año}`;
};