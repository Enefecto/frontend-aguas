import { MAP_CONFIG } from '../constants/mapConfig.js';

export const createDropIcon = (fill = MAP_CONFIG.MARKER_COLORS.SURFACE_EXTRACTION) => {
  const L = window.L;
  if (!L) return null;

  return L.divIcon({
    className: "",
    html: `
      <svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
        <!-- contorno blanco para contraste -->
        <path d="M14 2 C14 2 4 15 4 21 a10 10 0 0 0 20 0 C24 15 14 2 14 2z"
              fill="${fill}" stroke="white" stroke-width="2"/>
        <!-- brillo sutil -->
        <ellipse cx="11" cy="18" rx="2.2" ry="3.6" fill="rgba(255,255,255,0.35)"/>
      </svg>
    `,
    iconSize: MAP_CONFIG.ICON_CONFIG.SIZE,
    iconAnchor: MAP_CONFIG.ICON_CONFIG.ANCHOR,
    popupAnchor: MAP_CONFIG.ICON_CONFIG.POPUP_ANCHOR,
  });
};

export const getMarkerColor = (punto) => {
  // Clasificación basada en datos disponibles
  const tieneAlturaLimnimetrica = punto?.tipoPunto?.altura != null;
  const tieneNivelFreatico = punto?.tipoPunto?.nivel_freatico != null;

  if (tieneAlturaLimnimetrica) {
    return MAP_CONFIG.MARKER_COLORS.SURFACE_EXTRACTION; // Azul - Extracción superficial
  } else if (tieneNivelFreatico) {
    return MAP_CONFIG.MARKER_COLORS.UNDERGROUND_EXTRACTION; // Naranja - Extracción subterránea
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

export const isValidCoordinate = (punto) => {
  return Number.isFinite(punto.lat) && Number.isFinite(punto.lon);
};

export const getPuntoTypeLabel = (punto) => {
  // Clasificación basada en datos disponibles
  const tieneAlturaLimnimetrica = punto?.tipoPunto?.altura != null;
  const tieneNivelFreatico = punto?.tipoPunto?.nivel_freatico != null;

  if (tieneAlturaLimnimetrica) {
    return 'Extracción superficial';
  } else if (tieneNivelFreatico) {
    return 'Extracción subterránea';
  } else {
    return 'Sin clasificación'; // Buena práctica: mostrar estado cuando no hay datos suficientes
  }
};

export const getPuntoTypeValue = (punto) => {
  // Retorna el valor correspondiente a las constantes de filtro
  const tieneAlturaLimnimetrica = punto?.tipoPunto?.altura != null;
  const tieneNivelFreatico = punto?.tipoPunto?.nivel_freatico != null;

  if (tieneAlturaLimnimetrica) {
    return 'superficial';
  } else if (tieneNivelFreatico) {
    return 'subterraneo';
  } else {
    return 'sin_clasificar';
  }
};