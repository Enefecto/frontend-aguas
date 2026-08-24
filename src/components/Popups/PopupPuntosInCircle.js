import { formatNumberCL } from "../../utils/formatNumberCL";
import { utmToLatLon, latLonToUTM } from "../../utils/utmConverter";
import { sanitizeHTML, safeFormatNumber, sanitizeText } from "../../utils/sanitize";

/**
 * Calcula la distancia euclidiana entre dos puntos UTM en metros
 * @param {number} utm1_este - Coordenada Este del punto 1
 * @param {number} utm1_norte - Coordenada Norte del punto 1
 * @param {number} utm2_este - Coordenada Este del punto 2
 * @param {number} utm2_norte - Coordenada Norte del punto 2
 * @returns {number} - Distancia en metros
 */
const getDistanceUTM = (utm1_este, utm1_norte, utm2_este, utm2_norte) => {
  const dx = utm2_este - utm1_este;
  const dy = utm2_norte - utm1_norte;
  return Math.sqrt(dx * dx + dy * dy);
};

// Función para filtrar puntos dentro del círculo
export const getPointsInCircle = async (apiUrl,puntos, center, radius, layer) => {
  // Convertir centro del círculo de lat/lon a UTM
  const centerUTM = latLonToUTM(center.lat, center.lng);

  // Filtrar puntos usando distancia UTM
  const puntosFiltrados = puntos.filter((p) => {
    // Verificar que el punto tenga coordenadas UTM
    if (!p.utm_norte || !p.utm_este) return false;

    const dist = getDistanceUTM(centerUTM.utmEste, centerUTM.utmNorte, p.utm_este, p.utm_norte);
    return dist <= radius;
  });

  if (puntosFiltrados.length === 0) {
    layer.setPopupContent("No hay puntos dentro del círculo.");
    return;
  }

  const payload = puntosFiltrados.map(p => ({
    utm_norte: p.utm_norte,
    utm_este: p.utm_este
  }));

  try {
    const res = await fetch(`${apiUrl}/api/puntos/estadisticas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      layer.setPopupContent("No se pudieron obtener estadísticas.");
      return;
    }

    const stats = data[0]; // análisis agregado

    // Formatear fechas de manera segura
    const formatFecha = (fechaISO) => {
      if (!fechaISO || typeof fechaISO !== 'string') return '';
      try {
        const fecha = new Date(fechaISO);
        if (isNaN(fecha.getTime())) return '';
        return sanitizeText(fecha.toLocaleDateString('es-CL', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }).replace('.', ''));
      } catch {
        return '';
      }
    };

    // Sanitizar y validar números antes de usarlos
    const safePuntosConsultados = safeFormatNumber(stats.puntos_consultados, 'es-CL', '1');
    const safeTotalRegistros = safeFormatNumber(stats.total_registros_con_caudal, 'es-CL', '0');
    const safeCaudalPromedio = safeFormatNumber(stats.caudal_promedio, 'es-CL', '0');
    const safeCaudalMinimo = safeFormatNumber(stats.caudal_minimo, 'es-CL', '0');
    const safeCaudalMaximo = safeFormatNumber(stats.caudal_maximo, 'es-CL', '0');
    const safeDesviacion = safeFormatNumber(stats.desviacion_estandar_caudal, 'es-CL', '0');

    const fechaInicio = formatFecha(stats.primera_fecha_medicion);
    const fechaFin = formatFecha(stats.ultima_fecha_medicion);

    const periodoTexto = fechaInicio && fechaFin
      ? `<div class="text-xs text-gray-500 mb-1 border-t border-gray-200 pt-1">Periodo: ${fechaInicio} - ${fechaFin}</div>`
      : '';

    // HTML visual atractivo usando Tailwind CSS
    const popupHtml = `
      <div style="animation: fadeIn 0.3s ease-out" class="text-[13px] font-sans p-0 m-0 space-y-1 min-w-[220px]">
        <div class="font-bold text-sm text-cyan-800 border-b border-cyan-500 pb-1">
          Análisis estadístico del área
        </div>

        <div class="flex justify-between"><span class="text-gray-600">Puntos:</span><span class="text-gray-800 font-medium">${safePuntosConsultados}</span></div>
        <div class="flex justify-between"><span class="text-gray-600">Mediciones:</span><span class="text-gray-800 font-medium">${safeTotalRegistros}</span></div>
        <div class="flex justify-between"><span class="text-green-600">Promedio:</span><span class="font-semibold text-green-700">${safeCaudalPromedio} L/s</span></div>
        <div class="flex justify-between"><span class="text-blue-600">Mínimo:</span><span class="font-semibold text-blue-700">${safeCaudalMinimo} L/s</span></div>
        <div class="flex justify-between"><span class="text-red-600">Máximo:</span><span class="font-semibold text-red-700">${safeCaudalMaximo} L/s</span></div>
        <div class="flex justify-between"><span class="text-purple-600">Desviación:</span><span class="text-purple-700 font-medium">${safeDesviacion} L/s</span></div>
        ${periodoTexto}
      </div>
    `;

    // Sanitizar HTML antes de insertar y actualizar el popup
    layer.setPopupContent(sanitizeHTML(popupHtml)).openPopup();

  } catch (err) {
    console.error("Error al obtener estadísticas:", err);
    layer.setPopupContent("Error al consultar estadísticas.");
  }
};