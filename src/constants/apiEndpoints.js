export const API_ENDPOINTS = {
  // Endpoints de cuencas
  CUENCAS: '/cuencas',
  CUENCAS_STATS: '/cuencas/stats',
  CUENCAS_ANALISIS_CAUDAL: '/cuencas/analisis_caudal',
  CUENCAS_ANALISIS_INFORMANTES: '/cuencas/analisis_informantes',

  // Endpoints de subcuencas
  SUBCUENCAS_ANALISIS_CAUDAL: '/subcuencas/analisis_caudal',
  SUBCUENCAS_ANALISIS_INFORMANTES: '/subcuencas/analisis_informantes',

  // Endpoints de puntos
  PUNTOS: '/puntos',
  PUNTOS_ESTADISTICAS: '/puntos/estadisticas',
  PUNTOS_SERIES_TIEMPO_CAUDAL: '/puntos/series_de_tiempo/caudal'
};

export const FILTER_CONFIG = {
  // Valores por defecto de filtros
  DEFAULT_FILTERS: {
    region: '',
    cuenca: '',
    subcuenca: '',
    limit: 10,
    tipoPunto: '',
    fechaInicio: '',
    fechaFin: '',
    fechaPredefinida: ''
  },

  // Configuración de caudal
  DEFAULT_CAUDAL_RANGE: [0, 1000],
  DEFAULT_ORDEN_CAUDAL: 'max',

  // Tipos de punto
  PUNTO_TYPES: {
    SUPERFICIAL: 'superficial',
    SUBTERRANEO: 'subterraneo',
    SIN_CLASIFICAR: 'sin_clasificar'
  },

  // Límites
  DEFAULT_LIMIT_MAX: 100
};