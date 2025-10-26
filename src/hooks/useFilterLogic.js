import { useState, useEffect, useMemo } from 'react';
import { FILTER_CONFIG } from '../constants/apiEndpoints.js';
import {
  buildQueryParams,
  getFilteredOptions,
  calculateCaudalRange,
  calculateLimitMax
} from '../utils/filterUtils.js';
import { convertPuntoUTMtoLatLon } from '../utils/utmConverter.js';

export const useFilterLogic = (datosOriginales, minMaxDatosOriginales, isLoaded, apiService) => {
  const [filtros, setFiltros] = useState(FILTER_CONFIG.DEFAULT_FILTERS);
  const [filtroCaudal, setFiltroCaudal] = useState(FILTER_CONFIG.DEFAULT_CAUDAL_RANGE);
  const [ordenCaudal, setOrdenCaudal] = useState(FILTER_CONFIG.DEFAULT_ORDEN_CAUDAL);
  const [puntos, setPuntos] = useState([]);
  const [limiteSolicitado, setLimiteSolicitado] = useState();
  const [queryCompleted, setQueryCompleted] = useState(false);

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

  // Actualizar límite cuando cambie limitMax o cuando cambien los filtros geográficos
  useEffect(() => {
    if (isLoaded && limitMax) {
      // Si el límite actual es el valor por defecto (10), establecerlo al máximo
      // O si el límite supera el máximo permitido, ajustarlo
      if (filtros.limit === FILTER_CONFIG.DEFAULT_FILTERS.limit || filtros.limit > limitMax) {
        setFiltros(prev => ({
          ...prev,
          limit: limitMax
        }));
      }
    }
  }, [limitMax, isLoaded, filtros.region, filtros.cuenca, filtros.subcuenca]);

  // Limpiar puntos cuando cambien filtros para evitar cache
  useEffect(() => {
    setPuntos([]);
    setQueryCompleted(false);
  }, [filtros.region, filtros.cuenca, filtros.subcuenca, filtros.tipoPunto, filtros.fechaInicio, filtros.fechaFin, filtros.fechaPredefinida]);

  // Función para manejar cambios en filtros
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;

    if (name === 'region') {
      setFiltros({ region: value, cuenca: '', subcuenca: '', limit: filtros.limit, tipoPunto: filtros.tipoPunto, fechaInicio: filtros.fechaInicio, fechaFin: filtros.fechaFin, fechaPredefinida: filtros.fechaPredefinida });
    } else if (name === 'cuenca') {
      setFiltros(prev => ({ ...prev, cuenca: value, subcuenca: '' }));
    } else if (name === 'tipoPunto') {
      setFiltros(prev => ({ ...prev, tipoPunto: value }));
    } else if (name === 'limit') {
      setFiltros(prev => ({ ...prev, limit: parseInt(value, 10) || 0 }));
    } else if (name === 'fechaInicio' || name === 'fechaFin') {
      setFiltros(prev => ({ ...prev, [name]: value }));
    } else {
      setFiltros(prev => ({ ...prev, [name]: value }));
    }
  };

  // Función para obtener coordenadas únicas
  const handleCoordenadasUnicas = async (overrideLimit = null) => {
    try {
      setQueryCompleted(false); // Reset del estado de consulta

      // Si se proporciona un límite override, usarlo temporalmente
      const filtrosParaQuery = overrideLimit !== null
        ? { ...filtros, limit: overrideLimit }
        : filtros;

      const queryParams = buildQueryParams(filtrosParaQuery, filtroCaudal, ordenCaudal, datosOriginales);
      const data = await apiService.getPuntos(queryParams);

      if (Array.isArray(data)) {
        // Convertir coordenadas UTM a lat/lon
        const puntosConvertidos = data.map(punto => convertPuntoUTMtoLatLon(punto));

        setPuntos(puntosConvertidos);
        setLimiteSolicitado(overrideLimit !== null ? overrideLimit : filtros.limit);
        setQueryCompleted(true);
      } else {
        console.error("Respuesta inesperada:", data);
        setPuntos([]);
        setLimiteSolicitado();
        setQueryCompleted(true);
      }
    } catch (err) {
      console.error("Error al obtener coordenadas:", err);

      // Mostrar mensaje de error más amigable
      if (err.response?.status === 400) {
        const errorDetail = err.response?.data?.detail || "Error de validación en los filtros";
        console.error("Error de validación:", errorDetail);
        alert(`Error en los filtros: ${errorDetail}`);
      } else {
        console.error("Error inesperado:", err.message);
        alert("Ocurrió un error al consultar los puntos. Por favor, intenta nuevamente.");
      }

      setPuntos([]);
      setLimiteSolicitado();
      setQueryCompleted(true); // ✅ Marcar como completado incluso en caso de error
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
    queryCompleted, // ✅ Nuevo estado para saber si la consulta terminó

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