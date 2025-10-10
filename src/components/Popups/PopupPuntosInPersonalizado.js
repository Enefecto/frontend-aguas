import * as turf from "@turf/turf";
import { formatNumberCL } from "../../utils/formatNumberCL";

// Función para filtrar puntos dentro de un polígono
export const getPointsInPolygon = async (apiUrl, puntos, latlngs, layer) => {
  // Construir coords en formato [lng, lat]
  let coords = latlngs.map(ll => [ll.lng, ll.lat]);

  // 🔑 asegurar cierre (primer = último)
  if (
    coords.length > 0 &&
    (coords[0][0] !== coords[coords.length - 1][0] ||
      coords[0][1] !== coords[coords.length - 1][1])
  ) {
    coords.push(coords[0]);
  }

  const polygon = turf.polygon([coords]);

  // Filtrar puntos dentro del polígono
  // Los puntos ya deben tener lat/lon calculados desde UTM en el frontend
  const puntosFiltrados = puntos.filter((p) => {
    // Verificar que el punto tenga coordenadas lat/lon (calculadas desde UTM)
    if (!p.lat || !p.lon) return false;

    const point = turf.point([p.lon, p.lat]);
    return turf.booleanPointInPolygon(point, polygon);
  });

  if (puntosFiltrados.length === 0) {
    layer.setPopupContent("No hay puntos dentro del área personalizada.");
    return;
  }

  const payload = puntosFiltrados.map((p) => ({
    utm_norte: p.utm_norte,
    utm_este: p.utm_este,
  }));

  try {
    const res = await fetch(`${apiUrl}/api/puntos/estadisticas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      layer.setPopupContent("No se pudieron obtener estadísticas.");
      return;
    }

    const stats = data[0];

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

    const popupHtml = `
      <div style="animation: fadeIn 0.3s ease-out" class="text-[13px] font-sans p-0 m-0 space-y-1 min-w-[220px]">
        <div class="font-bold text-sm text-cyan-800 border-b border-cyan-500 pb-1">
          Análisis estadístico del área
        </div>

        <div class="flex justify-between"><span class="text-gray-600">Puntos:</span><span class="text-gray-800 font-medium">${formatNumberCL(stats.puntos_consultados) ?? "1"}</span></div>
        <div class="flex justify-between"><span class="text-gray-600">Mediciones:</span><span class="text-gray-800 font-medium">${formatNumberCL(stats.total_registros_con_caudal) ?? 0}</span></div>
        <div class="flex justify-between"><span class="text-green-600">Promedio:</span><span class="font-semibold text-green-700">${formatNumberCL(stats.caudal_promedio) ?? 0} L/s</span></div>
        <div class="flex justify-between"><span class="text-blue-600">Mínimo:</span><span class="font-semibold text-blue-700">${formatNumberCL(stats.caudal_minimo) ?? 0} L/s</span></div>
        <div class="flex justify-between"><span class="text-red-600">Máximo:</span><span class="font-semibold text-red-700">${formatNumberCL(stats.caudal_maximo) ?? 0} L/s</span></div>
        <div class="flex justify-between"><span class="text-purple-600">Desviación:</span><span class="text-purple-700 font-medium">${formatNumberCL(stats.desviacion_estandar_caudal) ?? 0} L/s</span></div>
        ${periodoTexto}
      </div>
    `;

    layer.setPopupContent(popupHtml).openPopup();
  } catch (err) {
    console.error("Error al obtener estadísticas:", err);
    layer.setPopupContent("Error al consultar estadísticas.");
  }
};

