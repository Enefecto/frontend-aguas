/**
 * Calcula el rango de fechas basado en un periodo predefinido
 * @param {string} periodo - 'ultima_semana', 'ultimo_mes', 'ultimo_año'
 * @returns {Object} - { fechaInicio, fechaFin } en formato MM-YYYY
 */
export const calcularFechasPredefinidas = (periodo) => {
  const hoy = new Date();
  const mesActual = hoy.getMonth() + 1; // 0-11 -> 1-12
  const añoActual = hoy.getFullYear();

  let fechaInicio, fechaFin;

  switch (periodo) {
    case 'ultima_semana':
      // Una semana atrás desde hoy
      const haceUnaSemana = new Date(hoy);
      haceUnaSemana.setDate(hoy.getDate() - 7);

      fechaInicio = formatearFecha(haceUnaSemana);
      fechaFin = formatearFecha(hoy);
      break;

    case 'ultimo_mes':
      // Un mes atrás
      const mesInicio = mesActual - 1 === 0 ? 12 : mesActual - 1;
      const añoInicio = mesActual - 1 === 0 ? añoActual - 1 : añoActual;

      fechaInicio = `${String(mesInicio).padStart(2, '0')}-${añoInicio}`;
      fechaFin = `${String(mesActual).padStart(2, '0')}-${añoActual}`;
      break;

    case 'ultimo_año':
      // Un año atrás
      fechaInicio = `${String(mesActual).padStart(2, '0')}-${añoActual - 1}`;
      fechaFin = `${String(mesActual).padStart(2, '0')}-${añoActual}`;
      break;

    default:
      return { fechaInicio: '', fechaFin: '' };
  }

  return { fechaInicio, fechaFin };
};

/**
 * Formatea una fecha a MM-YYYY
 */
const formatearFecha = (fecha) => {
  const mes = fecha.getMonth() + 1;
  const año = fecha.getFullYear();
  return `${String(mes).padStart(2, '0')}-${año}`;
};

/**
 * Opciones de periodos predefinidos
 */
export const PERIODOS_PREDEFINIDOS = [
  { value: 'ultima_semana', label: 'Última semana' },
  { value: 'ultimo_mes', label: 'Último mes' },
  { value: 'ultimo_año', label: 'Último año' }
];