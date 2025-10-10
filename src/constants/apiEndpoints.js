export const API_ENDPOINTS = {
  // Endpoints de cuencas
  CUENCAS: '/api/cuencas',
  CUENCAS_STATS: '/api/cuencas/stats',
  FILTROS_REACTIVOS: '/api/filtrosreactivos',
  CUENCAS_ANALISIS_CAUDAL: '/api/cuencas/analisis_caudal',
  CUENCAS_ANALISIS_INFORMANTES: '/api/cuencas/analisis_informantes',
  CUENCAS_SERIES_TIEMPO_CAUDAL: '/api/cuencas/cuenca/series_de_tiempo/caudal',
  CUENCAS_SERIES_TIEMPO_ALTURA_LINIMETRICA: '/api/cuencas/cuenca/series_de_tiempo/altura_linimetrica',
  CUENCAS_SERIES_TIEMPO_NIVEL_FREATICO: '/api/cuencas/cuenca/series_de_tiempo/nivel_freatico',

  // Endpoints de subcuencas
  SUBCUENCAS_ANALISIS_CAUDAL: '/api/subcuencas/analisis_caudal',
  SUBCUENCAS_ANALISIS_INFORMANTES: '/api/subcuencas/analisis_informantes',
  SUBCUENCAS_SERIES_TIEMPO_CAUDAL: '/api/cuencas/subcuenca/series_de_tiempo/caudal',
  SUBCUENCAS_SERIES_TIEMPO_ALTURA_LINIMETRICA: '/api/cuencas/subcuenca/series_de_tiempo/altura_linimetrica',
  SUBCUENCAS_SERIES_TIEMPO_NIVEL_FREATICO: '/api/cuencas/subcuenca/series_de_tiempo/nivel_freatico',

  // Endpoints de puntos
  PUNTOS: '/api/puntos',
  PUNTOS_POPUP: '/api/puntos/info',
  PUNTOS_ESTADISTICAS: '/api/puntos/estadisticas',
  PUNTOS_SERIES_TIEMPO_CAUDAL: '/api/puntos/series_de_tiempo/caudal',
  PUNTOS_SERIES_TIEMPO_NIVEL_FREATICO: '/api/puntos/series_de_tiempo/nivel_freatico',
  PUNTOS_SERIES_TIEMPO_ALTURA_LIMNIMETRICA: '/api/puntos/series_de_tiempo/altura_linimetrica'
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