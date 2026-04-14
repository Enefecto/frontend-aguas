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
  PUNTOS_SERIES_TIEMPO_ALTURA_LIMNIMETRICA: '/api/puntos/series_de_tiempo/altura_linimetrica',

  // Endpoints de SHAC
  SHACS: '/api/shacs',
  SHAC_SERIES_TIEMPO_CAUDAL: '/api/cuencas/shac/series_de_tiempo/caudal',
  SHAC_SERIES_TIEMPO_ALTURA_LINIMETRICA: '/api/cuencas/shac/series_de_tiempo/altura_linimetrica',
  SHAC_SERIES_TIEMPO_NIVEL_FREATICO: '/api/cuencas/shac/series_de_tiempo/nivel_freatico',

  // Endpoints de juntas
  JUNTAS: '/api/juntas',

  // Endpoints de subsubcuencas
  SUBSUBCUENCAS_SERIES_TIEMPO_CAUDAL: '/api/cuencas/subsubcuenca/series_de_tiempo/caudal',
  SUBSUBCUENCAS_SERIES_TIEMPO_ALTURA_LINIMETRICA: '/api/cuencas/subsubcuenca/series_de_tiempo/altura_linimetrica',
  SUBSUBCUENCAS_SERIES_TIEMPO_NIVEL_FREATICO: '/api/cuencas/subsubcuenca/series_de_tiempo/nivel_freatico',

  // Endpoints de informantes
  INFORMANTES: '/api/informantes'
};

export const FILTER_CONFIG = {
  // Valores por defecto de filtros
  DEFAULT_FILTERS: {
    region: '',
    cuenca: '',
    subcuenca: '',
    shac: '',
    apr: '',
    id_junta: '',
    limit: 10,
    pozo: ''
  },

  // Configuración de caudal
  DEFAULT_CAUDAL_RANGE: [0, 1000],
  DEFAULT_ORDEN_CAUDAL: 'max',

  // Límites
  DEFAULT_LIMIT_MAX: 100
};