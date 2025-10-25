import { useState } from 'react';
import { UI_CONFIG } from '../constants/uiConfig.js';

/**
 * Función auxiliar genérica para procesar datos de series de tiempo
 * @param {Array} seriesData - Array de objetos con fecha_medicion y un valor
 * @param {string} valueKey - Nombre de la clave del valor (ej: 'caudal', 'altura_linimetrica', 'nivel_freatico')
 * @returns {Object} - Objeto con arrays mensual y diario procesados
 */
const processSeriesTiempoData = (seriesData, valueKey = 'caudal') => {
  // Agrupar por mes (año-mes) para el gráfico mensual
  const mensualMap = {};
  const diarioMap = {};

  seriesData.forEach(item => {
    const fecha = new Date(item.fecha_medicion);
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mesClave = `${año}-${mes}`;
    const diaClave = `${año}-${mes}-${dia}`;

    const valor = Number(item[valueKey]) || 0;

    // Agrupar por mes
    if (!mensualMap[mesClave]) {
      mensualMap[mesClave] = {
        mes: mesClave,
        valores: []
      };
    }
    mensualMap[mesClave].valores.push(valor);

    // Agrupar por día
    if (!diarioMap[diaClave]) {
      diarioMap[diaClave] = {
        fecha: diaClave,
        valores: []
      };
    }
    diarioMap[diaClave].valores.push(valor);
  });

  // Calcular estadísticas para datos mensuales
  const mensualArray = Object.values(mensualMap).map(item => {
    const valores = item.valores.filter(v => v > 0);
    const min_valor = valores.length > 0 ? Math.min(...valores) : 0;
    const max_valor = valores.length > 0 ? Math.max(...valores) : 0;
    const avg_valor = valores.length > 0
      ? valores.reduce((sum, v) => sum + v, 0) / valores.length
      : 0;

    return {
      mes: item.mes,
      [`min_${valueKey}`]: Number(min_valor.toFixed(2)),
      [`avg_${valueKey}`]: Number(avg_valor.toFixed(2)),
      [`max_${valueKey}`]: Number(max_valor.toFixed(2))
    };
  }).sort((a, b) => a.mes.localeCompare(b.mes));

  // Calcular estadísticas para datos diarios
  const diarioArray = Object.values(diarioMap).map(item => {
    const valores = item.valores.filter(v => v > 0);
    const min_valor = valores.length > 0 ? Math.min(...valores) : 0;
    const max_valor = valores.length > 0 ? Math.max(...valores) : 0;
    const avg_valor = valores.length > 0
      ? valores.reduce((sum, v) => sum + v, 0) / valores.length
      : 0;

    return {
      fecha: item.fecha,
      [`min_${valueKey}`]: Number(min_valor.toFixed(2)),
      [`avg_${valueKey}`]: Number(avg_valor.toFixed(2)),
      [`max_${valueKey}`]: Number(max_valor.toFixed(2))
    };
  }).sort((a, b) => a.fecha.localeCompare(b.fecha));

  return {
    mensual: mensualArray,
    diario: diarioArray
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
  const loadCuencaAnalysis = async (nomCuenca, codCuenca) => {
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
        desviacion_estandar_caudal: data.caudal_desviacion_estandar || 0,
        primera_fecha_medicion: null, // Este endpoint no devuelve fechas
        ultima_fecha_medicion: null
      }));
      setCuencaLoading(false);
    } catch (err) {
      console.error("Error al obtener datos de análisis:", err);
      setCuencaLoading(false);
    }
  };

  // Función para cargar gráficos de cuenca
  const loadCuencasGraphics = async () => {
    // Establecer todos como cargando
    setGraphicsCuencasLoading({
      caudal: UI_CONFIG.LOADING_STATES.LOADING,
      altura_linimetrica: UI_CONFIG.LOADING_STATES.LOADING,
      nivel_freatico: UI_CONFIG.LOADING_STATES.LOADING
    });

    // Cargar caudal
    apiService.getCuencaSeriesTiempoCaudal(cuencaAnalysis.codigoCuenca)
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
        console.error("Error al obtener gráficos de caudal:", err);
        setGraficosData(prev => ({ ...prev, caudal: { mensual: [], diario: [] } }));
        setGraphicsCuencasLoading(prev => ({ ...prev, caudal: UI_CONFIG.LOADING_STATES.ERROR }));
      });

    // Cargar altura limnimétrica
    apiService.getCuencaSeriesTiempoAlturaLinimetrica(cuencaAnalysis.codigoCuenca)
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
        console.error("Error al obtener gráficos de altura limnimétrica:", err);
        setGraficosData(prev => ({ ...prev, altura_linimetrica: { mensual: [], diario: [] } }));
        setGraphicsCuencasLoading(prev => ({ ...prev, altura_linimetrica: UI_CONFIG.LOADING_STATES.ERROR }));
      });

    // Cargar nivel freático
    apiService.getCuencaSeriesTiempoNivelFreatico(cuencaAnalysis.codigoCuenca)
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
        console.error("Error al obtener gráficos de nivel freático:", err);
        setGraficosData(prev => ({ ...prev, nivel_freatico: { mensual: [], diario: [] } }));
        setGraphicsCuencasLoading(prev => ({ ...prev, nivel_freatico: UI_CONFIG.LOADING_STATES.ERROR }));
      });
  };

  // Función para cargar análisis de punto
  const loadPuntoAnalysis = async (punto) => {
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
  };

  // Función para cargar gráficos de punto
  const loadPuntosGraphics = async (utmNorte, utmEste) => {
    setGraphicsPuntosLoading(UI_CONFIG.LOADING_STATES.LOADING);

    try {
      const data = await apiService.getPuntosSeriesTiempo(utmNorte, utmEste);

      // Ordenar los datos por fecha ascendente (de más antigua a más reciente)
      if (data?.caudal_por_tiempo) {
        data.caudal_por_tiempo = data.caudal_por_tiempo.sort((a, b) => {
          return new Date(a.fecha_medicion) - new Date(b.fecha_medicion);
        });
      }

      setGraficosPuntosData(data);
      setGraphicsPuntosLoading(UI_CONFIG.LOADING_STATES.SUCCESS);
    } catch (err) {
      console.error("Error al obtener gráficos del punto:", err);
      setGraphicsPuntosLoading(UI_CONFIG.LOADING_STATES.ERROR);
    }
  };

  // Función para cargar análisis de subcuenca
  const loadSubcuencaAnalysis = async (nomSubcuenca, codSubcuenca, codCuenca = null, nomCuenca = null) => {
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
        desviacion_estandar_caudal: data.caudal_desviacion_estandar || 0,
        primera_fecha_medicion: null, // Este endpoint no devuelve fechas
        ultima_fecha_medicion: null
      }));
      setSubcuencaLoading(false);
    } catch (err) {
      console.error("Error al obtener datos de análisis de subcuenca:", err);
      setSubcuencaLoading(false);
    }
  };

  // Función para cargar gráficos de subcuenca
  const loadSubcuencasGraphics = async () => {
    // Establecer todos como cargando
    setGraphicsSubcuencasLoading({
      caudal: UI_CONFIG.LOADING_STATES.LOADING,
      altura_linimetrica: UI_CONFIG.LOADING_STATES.LOADING,
      nivel_freatico: UI_CONFIG.LOADING_STATES.LOADING
    });

    // Cargar caudal
    apiService.getSubcuencaSeriesTiempoCaudal(subcuencaAnalysis.codigoCuenca, subcuencaAnalysis.codigoSubcuenca)
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
        console.error("Error al obtener gráficos de caudal:", err);
        setGraficosSubcuencasData(prev => ({ ...prev, caudal: { mensual: [], diario: [] } }));
        setGraphicsSubcuencasLoading(prev => ({ ...prev, caudal: UI_CONFIG.LOADING_STATES.ERROR }));
      });

    // Cargar altura limnimétrica
    apiService.getSubcuencaSeriesTiempoAlturaLinimetrica(subcuencaAnalysis.codigoCuenca, subcuencaAnalysis.codigoSubcuenca)
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
        console.error("Error al obtener gráficos de altura limnimétrica:", err);
        setGraficosSubcuencasData(prev => ({ ...prev, altura_linimetrica: { mensual: [], diario: [] } }));
        setGraphicsSubcuencasLoading(prev => ({ ...prev, altura_linimetrica: UI_CONFIG.LOADING_STATES.ERROR }));
      });

    // Cargar nivel freático
    apiService.getSubcuencaSeriesTiempoNivelFreatico(subcuencaAnalysis.codigoCuenca, subcuencaAnalysis.codigoSubcuenca)
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
        console.error("Error al obtener gráficos de nivel freático:", err);
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