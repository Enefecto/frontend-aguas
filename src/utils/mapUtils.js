import { MAP_CONFIG } from '../constants/mapConfig.js';

export const createDropIcon = (fill = MAP_CONFIG.MARKER_COLORS.SURFACE_EXTRACTION, isHighlighted = false, comparisonIndex = null) => {
  const L = window.L;
  if (!L) return null;

  // Si está destacado, usar un contorno cyan brillante con animación de pulso
  const strokeColor = isHighlighted ? '#06b6d4' : 'white';
  const strokeWidth = isHighlighted ? '3' : '2';
  const className = isHighlighted ? 'highlighted-marker' : '';

  // Colores del badge según el índice de comparación
  const badgeColors = {
    1: { bg: '#3B82F6', text: 'white' },  // Azul para Punto 1
    2: { bg: '#F97316', text: 'white' }   // Naranja para Punto 2
  };

  return L.divIcon({
    className: className,
    html: `
      <div style="position: relative; width: 28px; height: 36px;">
        <svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
          ${isHighlighted ? `
            <!-- Anillo de pulso para markers destacados -->
            <path d="M14 2 C14 2 4 15 4 21 a10 10 0 0 0 20 0 C24 15 14 2 14 2z"
                  fill="none" stroke="#06b6d4" stroke-width="6" opacity="0.4">
              <animate attributeName="stroke-width" values="6;10;6" dur="1.5s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.5s" repeatCount="indefinite"/>
            </path>
          ` : ''}
          <!-- contorno para contraste -->
          <path d="M14 2 C14 2 4 15 4 21 a10 10 0 0 0 20 0 C24 15 14 2 14 2z"
                fill="${fill}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <!-- brillo sutil -->
          <ellipse cx="11" cy="18" rx="2.2" ry="3.6" fill="rgba(255,255,255,0.35)"/>
        </svg>
        ${comparisonIndex ? `
          <!-- Badge numerado para comparación -->
          <div style="
            position: absolute;
            top: -8px;
            right: -8px;
            width: 20px;
            height: 20px;
            background-color: ${badgeColors[comparisonIndex].bg};
            color: ${badgeColors[comparisonIndex].text};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 13px;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          ">
            ${comparisonIndex}
          </div>
        ` : ''}
      </div>
    `,
    iconSize: MAP_CONFIG.ICON_CONFIG.SIZE,
    iconAnchor: MAP_CONFIG.ICON_CONFIG.ANCHOR,
    popupAnchor: MAP_CONFIG.ICON_CONFIG.POPUP_ANCHOR,
  });
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

export const isValidCoordinate = (punto) => {
  // Verificar primero si ya tiene lat/lon (convertido)
  if (Number.isFinite(punto.lat) && Number.isFinite(punto.lon)) {
    return true;
  }
  // Si no, verificar que tenga coordenadas UTM válidas
  return Number.isFinite(punto.utm_norte) && Number.isFinite(punto.utm_este);
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