export const MAP_CONFIG = {
  // Configuración inicial del mapa
  DEFAULT_CENTER: [-33.45, -70.66], // Santiago
  DEFAULT_ZOOM: 6,

  // Colores de marcadores
  MARKER_COLORS: {
    SURFACE_EXTRACTION: '#2E7BCC', // Azul para extracción superficial
    WELL: '#FF5722' // Naranja para pozos
  },

  // Configuración de iconos
  ICON_CONFIG: {
    SIZE: [28, 36],
    ANCHOR: [14, 34],
    POPUP_ANCHOR: [0, -30]
  },

  // Configuración de clusters
  CLUSTER_CONFIG: {
    SIZES: {
      SMALL: { count: 25, className: 'small' },
      MEDIUM: { count: 100, className: 'medium' },
      LARGE: { count: Infinity, className: 'large' }
    },
    ICON_SIZE: 40
  },

  // Configuración de tiles
  TILE_LAYER: {
    URL: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    ATTRIBUTION: '&copy; <a href="https://carto.com/">Carto</a> contributors'
  }
};