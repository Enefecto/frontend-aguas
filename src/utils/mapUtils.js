import { COORDENADAS_FUERA_DE_CUENCA } from '../constants/coordenadasFueraDeCuenca.js';
import { MAP_CONFIG } from '../constants/mapConfig.js';

const _iconCache = new Map();

export const createDropIcon = (fill = MAP_CONFIG.MARKER_COLORS.SURFACE_EXTRACTION) => {
  const L = window.L;
  if (!L) return null;

  if (_iconCache.has(fill)) return _iconCache.get(fill);

  const icon = L.divIcon({
    className: '',
    html: `
      <div style="position: relative; width: 28px; height: 36px;">
        <svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2 C14 2 4 15 4 21 a10 10 0 0 0 20 0 C24 15 14 2 14 2z"
                fill="${fill}" stroke="white" stroke-width="2"/>
          <ellipse cx="11" cy="18" rx="2.2" ry="3.6" fill="rgba(255,255,255,0.35)"/>
        </svg>
      </div>
    `,
    iconSize: MAP_CONFIG.ICON_CONFIG.SIZE,
    iconAnchor: MAP_CONFIG.ICON_CONFIG.ANCHOR,
    popupAnchor: MAP_CONFIG.ICON_CONFIG.POPUP_ANCHOR,
  });

  _iconCache.set(fill, icon);

  return icon;
};

export const getMarkerColor = (punto) => {
  // Clasificación basada en es_pozo_subterraneo
  if (punto?.es_pozo_subterraneo === true) {
    return MAP_CONFIG.MARKER_COLORS.UNDERGROUND_EXTRACTION; // Naranja - Extracción subterránea
  } else if (punto?.es_pozo_subterraneo === false) {
    return MAP_CONFIG.MARKER_COLORS.SURFACE_EXTRACTION; // Azul - Extracción superficial
  } else {
    return MAP_CONFIG.MARKER_COLORS.UNCLASSIFIED; // Gris - Sin clasificación
  }
};

export const createClusterIcon = (cluster) => {
  const L = window.L;
  if (!L) return null;

  const count = cluster.getChildCount();
  const { SMALL, MEDIUM, LARGE } = MAP_CONFIG.CLUSTER_CONFIG.SIZES;

  let size = 'small';
  if (count >= LARGE.count) size = 'large';
  else if (count >= MEDIUM.count) size = 'medium';
  else if (count >= SMALL.count) size = 'small';

  return L.divIcon({
    html: `<div style="
              background-color: ${MAP_CONFIG.MARKER_COLORS.SURFACE_EXTRACTION};
              color: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 14px;
              width: ${MAP_CONFIG.CLUSTER_CONFIG.ICON_SIZE}px;
              height: ${MAP_CONFIG.CLUSTER_CONFIG.ICON_SIZE}px;
              border: 2px solid #fff;
            ">
              ${count}
          </div>`,
    className: `marker-cluster marker-cluster-${size}`,
    iconSize: L.point(MAP_CONFIG.CLUSTER_CONFIG.ICON_SIZE, MAP_CONFIG.CLUSTER_CONFIG.ICON_SIZE, true),
  });
};

// Límite este: frontera con Argentina/Bolivia
const CHILE_EAST_LON = -66.0;

/**
 * Decide si la coordenada de una obra es utilizable para dibujarla.
 *
 * Antes de esto había una tabla de siete bandas de latitud, cada una con una
 * longitud oeste fija, que aproximaba la costa de Chile con escalones rectos.
 * El escalón del Maule cortaba en -72,5 y Chanco es un pueblo costero a
 * -72,53: las dos obras de Dunas de Chanco y las dos de Pelluhue quedaban al
 * oeste de la línea, en tierra firme, y el mapa las descartaba en silencio.
 *
 * La máscara real son las cuencas hidrográficas BNA de la DGA, que cubren todo
 * Chile continental. No se evalúan acá: la geometría completa pesa 6,8 MB y
 * simplificarla lo suficiente para embarcarla vuelve a mover la costa. Se
 * evalúa fuera de línea con `scripts/generar_mascara_cuencas.py` y lo que llega
 * al navegador es solo la lista de las que quedaron fuera.
 *
 * Una obra que no esté en la lista se dibuja. Ese default importa: si el DW
 * carga puntos nuevos y nadie regeneró la lista, el error es mostrar una
 * coordenada dudosa, nunca esconder una obra real.
 */
export const isValidCoordinate = (punto) => {
  // Debe tener lat/lon convertidos y finitos
  if (!Number.isFinite(punto.lat) || !Number.isFinite(punto.lon)) {
    return false;
  }

  // Límites generales de Chile continental
  if (punto.lat < -56.0 || punto.lat > -17.0 || punto.lon > CHILE_EAST_LON) {
    return false;
  }

  return !COORDENADAS_FUERA_DE_CUENCA.has(`${punto.utm_norte}|${punto.utm_este}`);
};

export const getPuntoTypeLabel = (punto) => {
  // Clasificación basada en es_pozo_subterraneo
  if (punto?.es_pozo_subterraneo === true) {
    return 'Extracción subterránea';
  } else if (punto?.es_pozo_subterraneo === false) {
    return 'Extracción superficial';
  } else {
    return 'Sin clasificación';
  }
};

export const getPuntoTypeValue = (punto) => {
  // Retorna el valor correspondiente a las constantes de filtro basado en es_pozo_subterraneo
  if (punto?.es_pozo_subterraneo === true) {
    return 'subterraneo';
  } else if (punto?.es_pozo_subterraneo === false) {
    return 'superficial';
  } else {
    return 'sin_clasificar';
  }
};
/**
 * Mide cuántos píxeles del mapa quedan tapados por las sidebars abiertas.
 *
 * Las sidebars se marcan con `data-sidebar="left" | "right"` y se ocultan
 * con `translate-x`, no con `display:none`, así que se mide la intersección
 * real con el contenedor del mapa: una sidebar cerrada (fuera de pantalla)
 * da 0 y una en plena animación da su valor intermedio.
 *
 * @param {HTMLElement} mapContainer - Contenedor del mapa Leaflet
 * @returns {{ left: number, right: number }} Píxeles tapados a cada lado
 */
export const getSidebarOcclusion = (mapContainer) => {
  const vacio = { left: 0, right: 0 };
  if (!mapContainer || typeof document === 'undefined') return vacio;

  const mapRect = mapContainer.getBoundingClientRect();
  if (mapRect.width === 0) return vacio;

  let left = 0;
  let right = 0;

  document.querySelectorAll('[data-sidebar]').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Ancho realmente superpuesto al mapa
    const overlap = Math.min(rect.right, mapRect.right) - Math.max(rect.left, mapRect.left);
    if (overlap <= 0) return;

    if (el.dataset.sidebar === 'right') {
      right = Math.max(right, overlap);
    } else {
      left = Math.max(left, overlap);
    }
  });

  // Si las sidebars tapan casi todo (móvil: ocupan la pantalla completa),
  // no tiene sentido descentrar: se ignora la corrección.
  if (left + right >= mapRect.width * 0.9) return vacio;

  return { left, right };
};
