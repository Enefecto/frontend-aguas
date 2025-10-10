import { formatNumberCL } from "../../utils/formatNumberCL";
import { utmToLatLon } from "../../utils/utmConverter";

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

/**
 * Convierte coordenadas lat/lon del centro del círculo a UTM
 * usando una zona estimada basada en la longitud
 */
const latLonToUTM = (lat, lon) => {
  // Calcular zona UTM a partir de la longitud
  // Para Chile, típicamente zona 19 (entre -72° y -66° de longitud)
  const zone = Math.floor((lon + 180) / 6) + 1;

  // Constantes WGS84
  const a = 6378137.0; // Radio ecuatorial
  const e = 0.081819191; // Excentricidad
  const k0 = 0.9996; // Factor de escala

  const latRad = lat * Math.PI / 180;
  const lonRad = lon * Math.PI / 180;
  const zoneCM = (zone - 1) * 6 - 180 + 3; // Meridiano central de la zona
  const zoneCMRad = zoneCM * Math.PI / 180;

  const N = a / Math.sqrt(1 - e * e * Math.sin(latRad) * Math.sin(latRad));
  const T = Math.tan(latRad) * Math.tan(latRad);
  const C = (e * e / (1 - e * e)) * Math.cos(latRad) * Math.cos(latRad);
  const A = (lonRad - zoneCMRad) * Math.cos(latRad);

  const M = a * ((1 - e * e / 4 - 3 * e * e * e * e / 64 - 5 * e * e * e * e * e * e / 256) * latRad
    - (3 * e * e / 8 + 3 * e * e * e * e / 32 + 45 * e * e * e * e * e * e / 1024) * Math.sin(2 * latRad)
    + (15 * e * e * e * e / 256 + 45 * e * e * e * e * e * e / 1024) * Math.sin(4 * latRad)
    - (35 * e * e * e * e * e * e / 3072) * Math.sin(6 * latRad));

  const utmEste = k0 * N * (A + (1 - T + C) * A * A * A / 6
    + (5 - 18 * T + T * T + 72 * C - 58 * (e * e / (1 - e * e))) * A * A * A * A * A / 120) + 500000;

  const utmNorte = k0 * (M + N * Math.tan(latRad) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A * A * A * A / 24
    + (61 - 58 * T + T * T + 600 * C - 330 * (e * e / (1 - e * e))) * A * A * A * A * A * A / 720));

  // Ajustar para hemisferio sur
  const finalNorte = lat < 0 ? utmNorte + 10000000 : utmNorte;

  return { utmEste, utmNorte: finalNorte, zone };
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

    // Formatear fechas
    const formatFecha = (fechaISO) => {
      if (!fechaISO) return '';
      const fecha = new Date(fechaISO);
      return fecha.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).replace('.', '');
    };

    const periodoTexto = stats.primera_fecha_medicion && stats.ultima_fecha_medicion
      ? `<div class="text-xs text-gray-500 mb-1 border-t border-gray-200 pt-1">Periodo: ${formatFecha(stats.primera_fecha_medicion)} - ${formatFecha(stats.ultima_fecha_medicion)}</div>`
      : '';

    // HTML visual atractivo usando Tailwind CSS
    const popupHtml = `
      <div style="animation: fadeIn 0.3s ease-out" class="text-[13px] font-sans p-0 m-0 space-y-1 min-w-[220px]">
        <div class="font-bold text-sm text-cyan-800 border-b border-cyan-500 pb-1">
          Análisis estadístico del área
        </div>

        <div class="flex justify-between"><span class="text-gray-600">Puntos:</span><span class="text-gray-800 font-medium">${formatNumberCL(stats.puntos_consultados) ?? '1'}</span></div>
        <div class="flex justify-between"><span class="text-gray-600">Mediciones:</span><span class="text-gray-800 font-medium">${formatNumberCL(stats.total_registros_con_caudal) ?? 0}</span></div>
        <div class="flex justify-between"><span class="text-green-600">Promedio:</span><span class="font-semibold text-green-700">${formatNumberCL(stats.caudal_promedio) ?? 0} L/s</span></div>
        <div class="flex justify-between"><span class="text-blue-600">Mínimo:</span><span class="font-semibold text-blue-700">${formatNumberCL(stats.caudal_minimo) ?? 0} L/s</span></div>
        <div class="flex justify-between"><span class="text-red-600">Máximo:</span><span class="font-semibold text-red-700">${formatNumberCL(stats.caudal_maximo) ?? 0} L/s</span></div>
        <div class="flex justify-between"><span class="text-purple-600">Desviación:</span><span class="text-purple-700 font-medium">${formatNumberCL(stats.desviacion_estandar_caudal) ?? 0} L/s</span></div>
        ${periodoTexto}
      </div>
    `;

    // Actualiza el contenido del popup
    layer.setPopupContent(popupHtml).openPopup();

  } catch (err) {
    console.error("Error al obtener estadísticas:", err);
    layer.setPopupContent("Error al consultar estadísticas.");
  }
};