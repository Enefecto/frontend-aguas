import { useState, useEffect, useMemo } from 'react';
import { FILTER_CONFIG } from '../constants/apiEndpoints.js';
import {
  buildQueryParams,
  getFilteredOptions,
  calculateCaudalRange,
  calculateLimitMax
} from '../utils/filterUtils.js';

export const useFilterLogic = (datosOriginales, minMaxDatosOriginales, isLoaded, apiService) => {
  const [filtros, setFiltros] = useState(FILTER_CONFIG.DEFAULT_FILTERS);
  const [filtroCaudal, setFiltroCaudal] = useState(FILTER_CONFIG.DEFAULT_CAUDAL_RANGE);
  const [ordenCaudal, setOrdenCaudal] = useState(FILTER_CONFIG.DEFAULT_ORDEN_CAUDAL);
  const [puntos, setPuntos] = useState([]);
  const [limiteSolicitado, setLimiteSolicitado] = useState();

  // Opciones filtradas para los selects
  const filteredOptions = useMemo(() =>
    getFilteredOptions(datosOriginales, filtros),
    [datosOriginales, filtros]
  );

  // Rango de caudal dinámico
  const caudalRange = useMemo(() =>
    calculateCaudalRange(filtros, minMaxDatosOriginales, isLoaded),
    [filtros, minMaxDatosOriginales, isLoaded]
  );

  // Límite máximo dinámico
  const limitMax = useMemo(() =>
    calculateLimitMax(filtros, minMaxDatosOriginales, isLoaded),
    [filtros, minMaxDatosOriginales, isLoaded]
  );

  // Valores min/max para el slider
  const min = Math.floor(caudalRange?.avgMin ?? 0);
  const max = Math.ceil(caudalRange?.avgMax ?? 1000);

  // Actualizar rango de caudal cuando cambien filtros
  useEffect(() => {
    if (isLoaded && caudalRange) {
      const nuevoMin = Math.floor(caudalRange.avgMin);
      const nuevoMax = Math.ceil(caudalRange.avgMax);
      setFiltroCaudal([nuevoMin, nuevoMax]);
    }
  }, [filtros.cuenca, filtros.subcuenca, isLoaded, caudalRange]);

  // Función para manejar cambios en filtros
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;

    if (name === 'region') {
      setFiltros({ region: value, cuenca: '', subcuenca: '', limit: filtros.limit, tipoPunto: filtros.tipoPunto });
    } else if (name === 'cuenca') {
      setFiltros(prev => ({ ...prev, cuenca: value, subcuenca: '' }));
    } else if (name === 'tipoPunto') {
      setFiltros(prev => ({ ...prev, tipoPunto: value }));
    } else if (name === 'limit') {
      setFiltros(prev => ({ ...prev, limit: parseInt(value, 10) || 0 }));
    } else {
      setFiltros(prev => ({ ...prev, [name]: value }));
    }
  };

  // Función para obtener coordenadas únicas
  const handleCoordenadasUnicas = async () => {
    try {
      const queryParams = buildQueryParams(filtros, filtroCaudal, ordenCaudal, datosOriginales);
      const data = await apiService.getPuntos(queryParams);

      if (Array.isArray(data)) {
        setPuntos(data);
        setLimiteSolicitado(filtros.limit);
      } else {
        console.error("Respuesta inesperada:", data);
        setPuntos([]);
        setLimiteSolicitado();
      }
    } catch (err) {
      console.error("Error al obtener coordenadas:", err);
      setPuntos([]);
      setLimiteSolicitado();
    }
  };

  return {
    // Estados
    filtros,
    setFiltros,
    filtroCaudal,
    setFiltroCaudal,
    ordenCaudal,
    setOrdenCaudal,
    puntos,
    setPuntos,
    limiteSolicitado,

    // Datos calculados
    filteredOptions,
    limitMax,
    min,
    max,

    // Funciones
    handleFiltroChange,
    handleCoordenadasUnicas
  };
};