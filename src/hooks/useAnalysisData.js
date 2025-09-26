import { useState } from 'react';
import { UI_CONFIG } from '../constants/uiConfig.js';

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
    desviacion_estandar_caudal: 0
  });

  const [cuencaLoading, setCuencaLoading] = useState(false);
  const [graphicsCuencasLoading, setGraphicsCuencasLoading] = useState(UI_CONFIG.LOADING_STATES.IDLE);
  const [graficosData, setGraficosData] = useState({
    grafico_cantidad_registros_por_informante: [],
    grafico_caudal_total_por_informante: [],
    grafico_cantidad_obras_unicas_por_informante: [],
    grafico_caudal_mensual_min_prom_max: [],
    grafico_caudal_diario_min_prom_max: []
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
    setGraphicsCuencasLoading(UI_CONFIG.LOADING_STATES.IDLE);

    try {
      const data = await apiService.getCuencaAnalisisCaudal(codCuenca);
      setCuencaAnalysis(prev => ({
        ...prev,
        cuenca_identificador: data.cuenca_identificador,
        total_registros_con_caudal: data.total_registros_con_caudal,
        caudal_promedio: data.caudal_promedio,
        caudal_minimo: data.caudal_minimo,
        caudal_maximo: data.caudal_maximo,
        desviacion_estandar_caudal: data.desviacion_estandar_caudal
      }));
      setCuencaLoading(false);
    } catch (err) {
      console.error("Error al obtener datos de análisis:", err);
      setCuencaLoading(false);
    }
  };

  // Función para cargar gráficos de cuenca
  const loadCuencasGraphics = async () => {
    setGraphicsCuencasLoading(UI_CONFIG.LOADING_STATES.LOADING);

    try {
      const data = await apiService.getCuencaAnalisisInformantes(cuencaAnalysis.codigoCuenca);
      setGraficosData({
        grafico_cantidad_registros_por_informante: data.grafico_cantidad_registros_por_informante || [],
        grafico_caudal_total_por_informante: data.grafico_caudal_total_por_informante || [],
        grafico_cantidad_obras_unicas_por_informante: data.grafico_cantidad_obras_unicas_por_informante || [],
        grafico_caudal_mensual_min_prom_max: data.grafico_caudal_mensual_min_prom_max || [],
        grafico_caudal_diario_min_prom_max: data.grafico_caudal_diario_min_prom_max || []
      });
      setGraphicsCuencasLoading(UI_CONFIG.LOADING_STATES.SUCCESS);
    } catch (err) {
      console.error("Error al obtener gráficos:", err);
      setGraphicsCuencasLoading(UI_CONFIG.LOADING_STATES.ERROR);
    }
  };

  // Función para cargar análisis de punto
  const loadPuntoAnalysis = async (punto) => {
    setAnalisisPuntoSeleccionadoLoading(true);
    setGraphicsPuntosLoading(UI_CONFIG.LOADING_STATES.IDLE);

    try {
      const data = await apiService.getPuntosEstadisticas([
        {
          utm_norte: punto.utm_norte,
          utm_este: punto.utm_este
        }
      ]);

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
      setGraficosPuntosData(data);
      setGraphicsPuntosLoading(UI_CONFIG.LOADING_STATES.SUCCESS);
    } catch (err) {
      console.error("Error al obtener gráficos del punto:", err);
      setGraphicsPuntosLoading(UI_CONFIG.LOADING_STATES.ERROR);
    }
  };

  return {
    // Estados de cuenca
    cuencaAnalysis,
    cuencaLoading,
    graphicsCuencasLoading,
    graficosData,

    // Estados de punto
    analisisPuntoSeleccionado,
    analisisPuntoSeleccionadoLoading,
    graphicsPuntosLoading,
    graficosPuntosData,

    // Funciones
    loadCuencaAnalysis,
    loadCuencasGraphics,
    loadPuntoAnalysis,
    loadPuntosGraphics
  };
};