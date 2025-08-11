import { getDistance } from "../../utils/geoCalculos";

// Función para filtrar puntos dentro del círculo
export const getPointsInCircle = async (puntos, center, radius, layer) => {
  const puntosFiltrados = puntos.filter((p) => {
    const dist = getDistance(center.lat, center.lng, p.lat, p.lon);
    return dist <= radius;
  });

  if (puntosFiltrados.length === 0) {
    layer.setPopupContent("No hay puntos dentro del círculo.");
    return;
  }

  // Formatear radio en m o km
  let radioTexto;
  if (radius >= 1000) {
    radioTexto = `${(radius / 1000).toFixed(2)} km`;
  } else {
    radioTexto = `${radius.toFixed(0)} m`;
  }

  const payload = puntosFiltrados.map(p => ({
    utm_norte: p.utm_norte,
    utm_este: p.utm_este
  }));

  try {
    const res = await fetch('http://localhost:8000/puntos/estadisticas', {
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

    // HTML visual atractivo usando Tailwind CSS
    const popupHtml = `
      <div style="animation: fadeIn 0.3s ease-out" class="text-[13px] font-sans p-0 m-0 space-y-1 min-w-[220px]">
        <div class="font-bold text-sm text-cyan-800 border-b border-cyan-500 pb-1">
          Análisis estadístico del área
        </div>
        
        <div class="flex justify-between"><span class="text-gray-600">Radio:</span><span class="text-gray-800 font-medium">${radioTexto}</span></div>
        <div class="flex justify-between"><span class="text-gray-600">Puntos:</span><span class="text-gray-800 font-medium">${stats.puntos_consultados ?? '1'}</span></div>
        <div class="flex justify-between"><span class="text-gray-600">Mediciones:</span><span class="text-gray-800 font-medium">${Number(stats.total_registros_con_caudal ?? 0).toLocaleString('es-CL')}</span></div>
        <div class="flex justify-between"><span class="text-green-600">Promedio:</span><span class="font-semibold text-green-700">${Number(stats.caudal_promedio ?? 0).toFixed(2)} m³/s</span></div>
        <div class="flex justify-between"><span class="text-blue-600">Mínimo:</span><span class="font-semibold text-blue-700">${Number(stats.caudal_minimo ?? 0).toFixed(2)} m³/s</span></div>
        <div class="flex justify-between"><span class="text-red-600">Máximo:</span><span class="font-semibold text-red-700">${Number(stats.caudal_maximo ?? 0).toFixed(2)} m³/s</span></div>
        <div class="flex justify-between"><span class="text-purple-600">Desviación:</span><span class="text-purple-700 font-medium">${Number(stats.desviacion_estandar_caudal ?? 0).toFixed(2)} m³/s</span></div>
      </div>
    `;

    // Actualiza el contenido del popup
    layer.setPopupContent(popupHtml).openPopup();

  } catch (err) {
    console.error("Error al obtener estadísticas:", err);
    layer.setPopupContent("Error al consultar estadísticas.");
  }
};