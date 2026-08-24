import { useState, useCallback } from 'react';
import { UI_CONFIG } from '../constants/uiConfig.js';
import { filterByMinYear } from '../utils/timeConstants.js';

/**
 * Descompone la fecha de una medición en sus partes de calendario.
 *
 * `new Date('2024-01-10')` se interpreta como medianoche UTC, y leerla después
 * con getDate()/getMonth() la devuelve en hora local: en Chile (UTC-3/-4) eso
 * corre cada medición al día anterior, y las del día 1 al mes anterior. Como el
 * dato es una fecha de calendario y no un instante, se parte el texto tal cual.
 *
 * @param {string} valor - "YYYY-MM-DD" o "YYYY-MM-DD HH:MM:SS"
 * @returns {{mesClave: string, diaClave: string}|null}
 */
const partesFecha = (valor) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(valor ?? ''));
  if (!m) return null;
  const [, anio, mes, dia] = m;
  return { mesClave: `${anio}-${mes}`, diaClave: `${anio}-${mes}-${dia}` };
};

/**
 * Redondea a dos decimales conservando el null: sin medición no es cero.
 * @param {number|null} v
 * @returns {number|null}
 */
const redondear = (v) => (v == null ? null : Number(v.toFixed(2)));

/**
 * Completa los días sin medición dentro del rango cubierto.
 *
 * El arreglo diario solo traía las fechas que tenían dato, así que la línea del
 * gráfico cruzaba los huecos y no se distinguía "sin medición" de "medición
 * continua". Rellenando con null, Recharts corta la línea en el hueco.
 *
 * @param {Array} diario - Días con dato, ordenados ascendente, clave `fecha` YYYY-MM-DD
 * @param {string} valueKey
 * @returns {Array} - Todos los días del rango, con null donde no hubo medición
 */
const completarDias = (diario, valueKey) => {
  if (diario.length < 2) return diario;

  const porFecha = new Map(diario.map(d => [d.fecha, d]));
  const completo = [];

  const aFecha = (s) => {
    const [a, m, d] = s.split('-').map(Number);
    return new Date(Date.UTC(a, m - 1, d));
  };
  const aClave = (f) => f.toISOString().slice(0, 10);

  const cursor = aFecha(diario[0].fecha);
  const fin = aFecha(diario[diario.length - 1].fecha);

  while (cursor <= fin) {
    const clave = aClave(cursor);
    completo.push(porFecha.get(clave) ?? {
      fecha: clave,
      [`min_${valueKey}`]: null,
      [`avg_${valueKey}`]: null,
      [`max_${valueKey}`]: null
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return completo;
};

/**
 * Función auxiliar genérica para procesar datos de series de tiempo
 * @param {Array} seriesData - Array de objetos con fecha_medicion y un valor
 * @param {string} valueKey - Nombre de la clave del valor (ej: 'caudal', 'altura_linimetrica', 'nivel_freatico')
 * @returns {Object} - Objeto con arrays mensual y diario procesados
 */
const processSeriesTiempoData = (seriesData, valueKey = 'caudal') => {
  // TEMP: drop pre-2014 readings until DB filters handle it. See timeConstants.MIN_YEAR_GRAFICOS.
  seriesData = filterByMinYear(seriesData);

  // Agrupar por mes (año-mes) para el gráfico mensual
  const mensualMap = {};
  const diarioMap = {};

  seriesData.forEach(item => {
    const partes = partesFecha(item.fecha_medicion);
    if (!partes) return;
    const { mesClave, diaClave } = partes;

    // Sin `|| 0`: una medición ausente no es un caudal de cero. Ojo que
    // Number(null) da 0, así que la ausencia se descarta antes de convertir.
    const crudo = item[valueKey];
    const bruto = crudo == null || crudo === '' ? NaN : Number(crudo);
    const valor = Number.isFinite(bruto) ? bruto : null;

    // Agrupar por mes
    if (!mensualMap[mesClave]) {
      mensualMap[mesClave] = {
        mes: mesClave,
        valores: [],
        totalizador_vals: []
      };
    }
    mensualMap[mesClave].valores.push(valor);
    if (item.totalizador_max != null) {
      mensualMap[mesClave].totalizador_vals.push(Number(item.totalizador_max) || 0);
    }

    // Agrupar por día
    if (!diarioMap[diaClave]) {
      diarioMap[diaClave] = {
        fecha: diaClave,
        valores: [],
        totalizador_vals: []
      };
    }
    diarioMap[diaClave].valores.push(valor);
    if (item.totalizador_max != null) {
      diarioMap[diaClave].totalizador_vals.push(Number(item.totalizador_max) || 0);
    }
  });

  // Calcular estadísticas para datos mensuales
  const mensualArray = Object.values(mensualMap).map(item => {
    // `v > 0` descartaba las mediciones en cero: el mínimo nunca podía dar 0
    // aunque la obra no extrajera nada, y el promedio quedaba inflado.
    // Un caudal de cero es un dato; lo que se descarta es la ausencia de dato.
    const valores = item.valores.filter(v => v != null);
    const hayDatos = valores.length > 0;
    const min_valor = hayDatos ? Math.min(...valores) : null;
    const max_valor = hayDatos ? Math.max(...valores) : null;
    const avg_valor = hayDatos
      ? valores.reduce((sum, v) => sum + v, 0) / valores.length
      : null;

    const result = {
      mes: item.mes,
      [`min_${valueKey}`]: redondear(min_valor),
      [`avg_${valueKey}`]: redondear(avg_valor),
      [`max_${valueKey}`]: redondear(max_valor)
    };

    if (item.totalizador_vals.length > 0) {
      result.totalizador_max = Number(
        Math.max(...item.totalizador_vals).toFixed(2)
      );
    }

    return result;
  }).sort((a, b) => a.mes.localeCompare(b.mes));

  // Calcular estadísticas para datos diarios
  const diarioArray = Object.values(diarioMap).map(item => {
    // `v > 0` descartaba las mediciones en cero: el mínimo nunca podía dar 0
    // aunque la obra no extrajera nada, y el promedio quedaba inflado.
    // Un caudal de cero es un dato; lo que se descarta es la ausencia de dato.
    const valores = item.valores.filter(v => v != null);
    const hayDatos = valores.length > 0;
    const min_valor = hayDatos ? Math.min(...valores) : null;
    const max_valor = hayDatos ? Math.max(...valores) : null;
    const avg_valor = hayDatos
      ? valores.reduce((sum, v) => sum + v, 0) / valores.length
      : null;

    const result = {
      fecha: item.fecha,
      [`min_${valueKey}`]: redondear(min_valor),
      [`avg_${valueKey}`]: redondear(avg_valor),
      [`max_${valueKey}`]: redondear(max_valor)
    };

    if (item.totalizador_vals.length > 0) {
      result.totalizador_max = Number(
        Math.max(...item.totalizador_vals).toFixed(2)
      );
    }

    return result;
  }).sort((a, b) => a.fecha.localeCompare(b.fecha));

  return {
    mensual: mensualArray,
    diario: completarDias(diarioArray, valueKey)
  };
};

export const useAnalysisData = (apiService) => {
  // Estados para análisis de cuencas
  const [cuencaAnalysis, setCuencaAnalysis] = useState({
    nombreCuenca: '',
    codigoCuenca: '',
    cuenca_identificador: 0,
    total_registros_con_caudal: 0,
    caudal_promedio: 0,
    caudal_minimo: 0,
    caudal_maximo: 0,
    desviacion_estandar_caudal: 0,
    primera_fecha_medicion: null,
    ultima_fecha_medicion: null
  });

  const [cuencaLoading, setCuencaLoading] = useState(false);
  const [graphicsCuencasLoading, setGraphicsCuencasLoading] = useState({
    caudal: UI_CONFIG.LOADING_STATES.IDLE,
    altura_linimetrica: UI_CONFIG.LOADING_STATES.IDLE,
    nivel_freatico: UI_CONFIG.LOADING_STATES.IDLE
  });
  const [graficosData, setGraficosData] = useState({
    caudal: { mensual: [], diario: [] },
    altura_linimetrica: { mensual: [], diario: [] },
    nivel_freatico: { mensual: [], diario: [] }
  });

  // Estados para análisis de subcuencas
  const [subcuencaAnalysis, setSubcuencaAnalysis] = useState({
    nombreSubcuenca: '',
    codigoSubcuenca: '',
    codigoCuenca: '',
    nombreCuenca: '',
    subcuenca_identificador: 0,
    total_registros_con_caudal: 0,
    caudal_promedio: 0,
    caudal_minimo: 0,
    caudal_maximo: 0,
    desviacion_estandar_caudal: 0,
    primera_fecha_medicion: null,
    ultima_fecha_medicion: null
  });

  const [subcuencaLoading, setSubcuencaLoading] = useState(false);
  const [graphicsSubcuencasLoading, setGraphicsSubcuencasLoading] = useState({
    caudal: UI_CONFIG.LOADING_STATES.IDLE,
    altura_linimetrica: UI_CONFIG.LOADING_STATES.IDLE,
    nivel_freatico: UI_CONFIG.LOADING_STATES.IDLE
  });
  const [graficosSubcuencasData, setGraficosSubcuencasData] = useState({
    caudal: { mensual: [], diario: [] },
    altura_linimetrica: { mensual: [], diario: [] },
    nivel_freatico: { mensual: [], diario: [] }
  });

  // Estados para análisis de puntos
  const [analisisPuntoSeleccionado, setAnalisisPuntoSeleccionado] = useState({});
  const [analisisPuntoSeleccionadoLoading, setAnalisisPuntoSeleccionadoLoading] = useState(false);
  const [graphicsPuntosLoading, setGraphicsPuntosLoading] = useState(UI_CONFIG.LOADING_STATES.IDLE);
  const [graficosPuntosData, setGraficosPuntosData] = useState([]);

  // Función para cargar análisis de cuenca
  const loadCuencaAnalysis = useCallback(async (nomCuenca, codCuenca) => {
    setCuencaAnalysis({ nombreCuenca: nomCuenca, codigoCuenca: codCuenca });
    setCuencaLoading(true);
    setGraphicsCuencasLoading({
      caudal: UI_CONFIG.LOADING_STATES.IDLE,
      altura_linimetrica: UI_CONFIG.LOADING_STATES.IDLE,
      nivel_freatico: UI_CONFIG.LOADING_STATES.IDLE
    });

    try {
      const response = await apiService.getCuencasStats({ cod_cuenca: codCuenca });
      const data = response.estadisticas?.[0];

      if (!data) {
        throw new Error('No se encontraron estadísticas para la cuenca');
      }

      setCuencaAnalysis(prev => ({
        ...prev,
        cuenca_identificador: codCuenca,
        total_registros_con_caudal: data.total_mediciones,
        caudal_promedio: data.caudal_promedio,
        caudal_minimo: data.caudal_minimo,
        caudal_maximo: data.caudal_maximo,
        desviacion_estandar_caudal: data.caudal_desviacion_estandar ?? null,
        primera_fecha_medicion: null, // Este endpoint no devuelve fechas
        ultima_fecha_medicion: null
      }));
      setCuencaLoading(false);
    } catch (err) {
      console.error("Error al obtener datos de análisis:", err);
      setCuencaLoading(false);
    }
  }, [apiService]);

  // Función para cargar gráficos de cuenca
  const loadCuencasGraphics = async (pozo = null) => {
    // Establecer todos como cargando
    setGraphicsCuencasLoading({
      caudal: UI_CONFIG.LOADING_STATES.LOADING,
      altura_linimetrica: UI_CONFIG.LOADING_STATES.LOADING,
      nivel_freatico: UI_CONFIG.LOADING_STATES.LOADING
    });

    // Cargar caudal
    apiService.getCuencaSeriesTiempoCaudal(cuencaAnalysis.codigoCuenca, pozo)
      .then(data => {
        // Manejar respuesta vacía, sin datos o con solo 1 registro
        if (!data || !data.caudal_por_tiempo || data.caudal_por_tiempo.length < 2) {
          setGraficosData(prev => ({ ...prev, caudal: { mensual: [], diario: [] } }));
          setGraphicsCuencasLoading(prev => ({ ...prev, caudal: UI_CONFIG.LOADING_STATES.ERROR }));
          return;
        }
        const caudalProcessed = processSeriesTiempoData(data.caudal_por_tiempo, 'caudal');
        setGraficosData(prev => ({ ...prev, caudal: caudalProcessed }));
        setGraphicsCuencasLoading(prev => ({ ...prev, caudal: UI_CONFIG.LOADING_STATES.SUCCESS }));
      })
      .catch(err => {
        // Solo mostrar error si NO es un "no se encontraron datos"
        const isNoDataError = err.message?.includes('No se encontraron datos') ||
                              err.response?.data?.detail?.includes('No se encontraron datos');
        if (!isNoDataError) {
          console.error("Error al obtener gráficos de caudal:", err);
        }
        setGraficosData(prev => ({ ...prev, caudal: { mensual: [], diario: [] } }));
        setGraphicsCuencasLoading(prev => ({ ...prev, caudal: UI_CONFIG.LOADING_STATES.ERROR }));
      });

    // Cargar altura limnimétrica
    apiService.getCuencaSeriesTiempoAlturaLinimetrica(cuencaAnalysis.codigoCuenca, pozo)
      .then(data => {
        // Manejar respuesta vacía, sin datos o con solo 1 registro
        if (!data || !data.altura_por_tiempo || data.altura_por_tiempo.length < 2) {
          setGraficosData(prev => ({ ...prev, altura_linimetrica: { mensual: [], diario: [] } }));
          setGraphicsCuencasLoading(prev => ({ ...prev, altura_linimetrica: UI_CONFIG.LOADING_STATES.ERROR }));
          return;
        }
        const alturaProcessed = processSeriesTiempoData(data.altura_por_tiempo, 'altura_linimetrica');
        setGraficosData(prev => ({ ...prev, altura_linimetrica: alturaProcessed }));
        setGraphicsCuencasLoading(prev => ({ ...prev, altura_linimetrica: UI_CONFIG.LOADING_STATES.SUCCESS }));
      })
      .catch(err => {
        // Solo mostrar error si NO es un "no se encontraron datos"
        const isNoDataError = err.message?.includes('No se encontraron datos') ||
                              err.response?.data?.detail?.includes('No se encontraron datos');
        if (!isNoDataError) {
          console.error("Error al obtener gráficos de altura limnimétrica:", err);
        }
        setGraficosData(prev => ({ ...prev, altura_linimetrica: { mensual: [], diario: [] } }));
        setGraphicsCuencasLoading(prev => ({ ...prev, altura_linimetrica: UI_CONFIG.LOADING_STATES.ERROR }));
      });

    // Cargar nivel freático
    apiService.getCuencaSeriesTiempoNivelFreatico(cuencaAnalysis.codigoCuenca, pozo)
      .then(data => {
        // Manejar respuesta vacía, sin datos o con solo 1 registro
        if (!data || !data.nivel_por_tiempo || data.nivel_por_tiempo.length < 2) {
          setGraficosData(prev => ({ ...prev, nivel_freatico: { mensual: [], diario: [] } }));
          setGraphicsCuencasLoading(prev => ({ ...prev, nivel_freatico: UI_CONFIG.LOADING_STATES.ERROR }));
          return;
        }
        const nivelProcessed = processSeriesTiempoData(data.nivel_por_tiempo, 'nivel_freatico');
        setGraficosData(prev => ({ ...prev, nivel_freatico: nivelProcessed }));
        setGraphicsCuencasLoading(prev => ({ ...prev, nivel_freatico: UI_CONFIG.LOADING_STATES.SUCCESS }));
      })
      .catch(err => {
        // Solo mostrar error si NO es un "no se encontraron datos"
        const isNoDataError = err.message?.includes('No se encontraron datos') ||
                              err.response?.data?.detail?.includes('No se encontraron datos');
        if (!isNoDataError) {
          console.error("Error al obtener gráficos de nivel freático:", err);
        }
        setGraficosData(prev => ({ ...prev, nivel_freatico: { mensual: [], diario: [] } }));
        setGraphicsCuencasLoading(prev => ({ ...prev, nivel_freatico: UI_CONFIG.LOADING_STATES.ERROR }));
      });
  };

  // Función para cargar análisis de punto
  const loadPuntoAnalysis = useCallback(async (punto) => {
    setAnalisisPuntoSeleccionadoLoading(true);
    setGraphicsPuntosLoading(UI_CONFIG.LOADING_STATES.IDLE);

    try {
      const data = await apiService.getPuntosEstadisticas(punto.utm_norte, punto.utm_este);

      setAnalisisPuntoSeleccionado({
        analisis: data[0],
        punto: punto
      });
      setAnalisisPuntoSeleccionadoLoading(false);
    } catch (err) {
      console.error("Error al obtener análisis del punto:", err);
      setAnalisisPuntoSeleccionadoLoading(false);
    }
  }, [apiService]);

  // Función para cargar gráficos de punto
  const loadPuntosGraphics = async (utmNorte, utmEste) => {
    setGraphicsPuntosLoading(UI_CONFIG.LOADING_STATES.LOADING);

    try {
      const data = await apiService.getPuntosSeriesTiempo(utmNorte, utmEste);

      // Ordenar los datos por fecha ascendente (de más antigua a más reciente)
      if (data?.caudal_por_tiempo) {
        // TEMP: drop pre-2014 readings until DB filters handle it.
        data.caudal_por_tiempo = filterByMinYear(data.caudal_por_tiempo)
          .sort((a, b) => new Date(a.fecha_medicion) - new Date(b.fecha_medicion));
      }

      setGraficosPuntosData(data);
      setGraphicsPuntosLoading(UI_CONFIG.LOADING_STATES.SUCCESS);
    } catch (err) {
      console.error("Error al obtener gráficos del punto:", err);
      setGraphicsPuntosLoading(UI_CONFIG.LOADING_STATES.ERROR);
    }
  };

  // Función para cargar análisis de subcuenca
  const loadSubcuencaAnalysis = useCallback(async (nomSubcuenca, codSubcuenca, codCuenca = null, nomCuenca = null) => {
    // Si es sin_registro, enviar cod_cuenca en lugar de cod_subcuenca
    const esSinRegistro = codSubcuenca === 'sin_registro';
    const parametros = esSinRegistro
      ? { cod_cuenca: codCuenca, cod_subcuenca: null }
      : { cod_subcuenca: codSubcuenca };

    setSubcuencaAnalysis({
      nombreSubcuenca: nomSubcuenca,
      codigoSubcuenca: codSubcuenca,
      codigoCuenca: codCuenca,
      nombreCuenca: nomCuenca
    });
    setSubcuencaLoading(true);
    setGraphicsSubcuencasLoading({
      caudal: UI_CONFIG.LOADING_STATES.IDLE,
      altura_linimetrica: UI_CONFIG.LOADING_STATES.IDLE,
      nivel_freatico: UI_CONFIG.LOADING_STATES.IDLE
    });

    try {
      const response = await apiService.getCuencasStats(parametros);
      const data = response.estadisticas?.[0];

      if (!data) {
        throw new Error('No se encontraron estadísticas para la subcuenca');
      }

      setSubcuencaAnalysis(prev => ({
        ...prev,
        subcuenca_identificador: codSubcuenca,
        total_registros_con_caudal: data.total_mediciones,
        caudal_promedio: data.caudal_promedio,
        caudal_minimo: data.caudal_minimo,
        caudal_maximo: data.caudal_maximo,
        desviacion_estandar_caudal: data.caudal_desviacion_estandar ?? null,
        primera_fecha_medicion: null, // Este endpoint no devuelve fechas
        ultima_fecha_medicion: null
      }));
      setSubcuencaLoading(false);
    } catch (err) {
      console.error("Error al obtener datos de análisis de subcuenca:", err);
      setSubcuencaLoading(false);
    }
  }, [apiService]);

  // Función para cargar gráficos de subcuenca
  const loadSubcuencasGraphics = async (pozo = null) => {
    // Establecer todos como cargando
    setGraphicsSubcuencasLoading({
      caudal: UI_CONFIG.LOADING_STATES.LOADING,
      altura_linimetrica: UI_CONFIG.LOADING_STATES.LOADING,
      nivel_freatico: UI_CONFIG.LOADING_STATES.LOADING
    });

    // Cargar caudal
    apiService.getSubcuencaSeriesTiempoCaudal(subcuencaAnalysis.codigoCuenca, subcuencaAnalysis.codigoSubcuenca, pozo)
      .then(data => {
        // Manejar respuesta vacía, sin datos o con solo 1 registro
        if (!data || !data.caudal_por_tiempo || data.caudal_por_tiempo.length < 2) {
          setGraficosSubcuencasData(prev => ({ ...prev, caudal: { mensual: [], diario: [] } }));
          setGraphicsSubcuencasLoading(prev => ({ ...prev, caudal: UI_CONFIG.LOADING_STATES.ERROR }));
          return;
        }
        const caudalProcessed = processSeriesTiempoData(data.caudal_por_tiempo, 'caudal');
        setGraficosSubcuencasData(prev => ({ ...prev, caudal: caudalProcessed }));
        setGraphicsSubcuencasLoading(prev => ({ ...prev, caudal: UI_CONFIG.LOADING_STATES.SUCCESS }));
      })
      .catch(err => {
        // Solo mostrar error si NO es un "no se encontraron datos"
        const isNoDataError = err.message?.includes('No se encontraron datos') ||
                              err.response?.data?.detail?.includes('No se encontraron datos');
        if (!isNoDataError) {
          console.error("Error al obtener gráficos de caudal:", err);
        }
        setGraficosSubcuencasData(prev => ({ ...prev, caudal: { mensual: [], diario: [] } }));
        setGraphicsSubcuencasLoading(prev => ({ ...prev, caudal: UI_CONFIG.LOADING_STATES.ERROR }));
      });

    // Cargar altura limnimétrica
    apiService.getSubcuencaSeriesTiempoAlturaLinimetrica(subcuencaAnalysis.codigoCuenca, subcuencaAnalysis.codigoSubcuenca, pozo)
      .then(data => {
        // Manejar respuesta vacía, sin datos o con solo 1 registro
        if (!data || !data.altura_por_tiempo || data.altura_por_tiempo.length < 2) {
          setGraficosSubcuencasData(prev => ({ ...prev, altura_linimetrica: { mensual: [], diario: [] } }));
          setGraphicsSubcuencasLoading(prev => ({ ...prev, altura_linimetrica: UI_CONFIG.LOADING_STATES.ERROR }));
          return;
        }
        const alturaProcessed = processSeriesTiempoData(data.altura_por_tiempo, 'altura_linimetrica');
        setGraficosSubcuencasData(prev => ({ ...prev, altura_linimetrica: alturaProcessed }));
        setGraphicsSubcuencasLoading(prev => ({ ...prev, altura_linimetrica: UI_CONFIG.LOADING_STATES.SUCCESS }));
      })
      .catch(err => {
        // Solo mostrar error si NO es un "no se encontraron datos"
        const isNoDataError = err.message?.includes('No se encontraron datos') ||
                              err.response?.data?.detail?.includes('No se encontraron datos');
        if (!isNoDataError) {
          console.error("Error al obtener gráficos de altura limnimétrica:", err);
        }
        setGraficosSubcuencasData(prev => ({ ...prev, altura_linimetrica: { mensual: [], diario: [] } }));
        setGraphicsSubcuencasLoading(prev => ({ ...prev, altura_linimetrica: UI_CONFIG.LOADING_STATES.ERROR }));
      });

    // Cargar nivel freático
    apiService.getSubcuencaSeriesTiempoNivelFreatico(subcuencaAnalysis.codigoCuenca, subcuencaAnalysis.codigoSubcuenca, pozo)
      .then(data => {
        // Manejar respuesta vacía, sin datos o con solo 1 registro
        if (!data || !data.nivel_por_tiempo || data.nivel_por_tiempo.length < 2) {
          setGraficosSubcuencasData(prev => ({ ...prev, nivel_freatico: { mensual: [], diario: [] } }));
          setGraphicsSubcuencasLoading(prev => ({ ...prev, nivel_freatico: UI_CONFIG.LOADING_STATES.ERROR }));
          return;
        }
        const nivelProcessed = processSeriesTiempoData(data.nivel_por_tiempo, 'nivel_freatico');
        setGraficosSubcuencasData(prev => ({ ...prev, nivel_freatico: nivelProcessed }));
        setGraphicsSubcuencasLoading(prev => ({ ...prev, nivel_freatico: UI_CONFIG.LOADING_STATES.SUCCESS }));
      })
      .catch(err => {
        // Solo mostrar error si NO es un "no se encontraron datos"
        const isNoDataError = err.message?.includes('No se encontraron datos') ||
                              err.response?.data?.detail?.includes('No se encontraron datos');
        if (!isNoDataError) {
          console.error("Error al obtener gráficos de nivel freático:", err);
        }
        setGraficosSubcuencasData(prev => ({ ...prev, nivel_freatico: { mensual: [], diario: [] } }));
        setGraphicsSubcuencasLoading(prev => ({ ...prev, nivel_freatico: UI_CONFIG.LOADING_STATES.ERROR }));
      });
  };

  return {
    // Estados de cuenca
    cuencaAnalysis,
    cuencaLoading,
    graphicsCuencasLoading,
    graficosData,

    // Estados de subcuenca
    subcuencaAnalysis,
    subcuencaLoading,
    graphicsSubcuencasLoading,
    graficosSubcuencasData,

    // Estados de punto
    analisisPuntoSeleccionado,
    analisisPuntoSeleccionadoLoading,
    graphicsPuntosLoading,
    graficosPuntosData,

    // Funciones
    loadCuencaAnalysis,
    loadCuencasGraphics,
    loadSubcuencaAnalysis,
    loadSubcuencasGraphics,
    loadPuntoAnalysis,
    loadPuntosGraphics
  };
};