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
  const [limitMaxFromQuery, setLimitMaxFromQuery] = useState(null);
  const [shacsDisponibles, setShacsDisponibles] = useState([]);
  const [juntasDisponibles, setJuntasDisponibles] = useState([]);

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
  const limitMaxFromStats = useMemo(() =>
    calculateLimitMax(filtros, minMaxDatosOriginales, isLoaded),
    [filtros, minMaxDatosOriginales, isLoaded]
  );

  // Usar el total real de la última query si está disponible (más preciso que las estadísticas)
  const limitMax = limitMaxFromQuery ?? limitMaxFromStats;

  // Valores min/max para el slider
  const min = Math.floor(caudalRange?.avgMin ?? 0);
  const max = Math.ceil(caudalRange?.avgMax ?? 1000);

  // Actualizar rango de caudal cuando cambien cuenca/subcuenca o carguen datos
  useEffect(() => {
    if (isLoaded) {
      const range = calculateCaudalRange(filtros, minMaxDatosOriginales, isLoaded);
      if (range) {
        setFiltroCaudal([Math.floor(range.avgMin ?? 0), Math.ceil(range.avgMax ?? 1000)]);
      }
    }
  }, [filtros.cuenca, filtros.subcuenca, isLoaded, minMaxDatosOriginales]);

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

  // Re-fetch SHACs when geographic filters change
  useEffect(() => {
    if (!apiService) return;

    setShacsDisponibles([]);
    let cancelled = false;

    const region = filtros.region ? parseInt(filtros.region) : undefined;
    const cuencaData = filtros.cuenca
      ? datosOriginales.find(d => d.nom_cuenca === filtros.cuenca)
      : null;
    const cod_cuenca = cuencaData?.cod_cuenca;
    const subcuencaData = filtros.subcuenca && filtros.subcuenca !== 'No registrada' && cuencaData
      ? datosOriginales.find(d => d.nom_cuenca === filtros.cuenca && d.nom_subcuenca === filtros.subcuenca)
      : null;
    const cod_subcuenca = subcuencaData?.cod_subcuenca;

    apiService.getShacs({ region, cod_cuenca, cod_subcuenca })
      .then(data => {
        if (cancelled) return;
        const opciones = (data?.shacs || []).map(s => ({
          value: s.cod_sector_sha,
          label: s.sector_sha || `SHAC ${s.cod_sector_sha}`
        }));
        setShacsDisponibles(opciones);
      })
      .catch(err => {
        if (cancelled) return;
        console.error('Error cargando SHACs:', err);
        setShacsDisponibles([]);
      });

    return () => { cancelled = true; };
  }, [filtros.region, filtros.cuenca, filtros.subcuenca, apiService, datosOriginales]);

  // Re-fetch Juntas when geographic filters change
  useEffect(() => {
    if (!apiService) return;

    setJuntasDisponibles([]);
    let cancelled = false;

    const region = filtros.region ? parseInt(filtros.region) : undefined;
    const cuencaData = filtros.cuenca
      ? datosOriginales.find(d => d.nom_cuenca === filtros.cuenca)
      : null;
    const cod_cuenca = cuencaData?.cod_cuenca;
    const subcuencaData = filtros.subcuenca && filtros.subcuenca !== 'No registrada' && cuencaData
      ? datosOriginales.find(d => d.nom_cuenca === filtros.cuenca && d.nom_subcuenca === filtros.subcuenca)
      : null;
    const cod_subcuenca = subcuencaData?.cod_subcuenca;

    apiService.getJuntas({ region, cod_cuenca, cod_subcuenca })
      .then(data => {
        if (cancelled) return;
        const opciones = (data?.juntas || []).map(j => ({
          value: j.id_junta,
          label: `Junta ${j.id_junta}`
        }));
        setJuntasDisponibles(opciones);
      })
      .catch(err => {
        if (cancelled) return;
        console.error('Error cargando Juntas:', err);
        setJuntasDisponibles([]);
      });

    return () => { cancelled = true; };
  }, [filtros.region, filtros.cuenca, filtros.subcuenca, apiService, datosOriginales]);

  // Reset query state when filters change so UI shows pending indicator
  useEffect(() => {
    setQueryCompleted(false);
    setLimitMaxFromQuery(null);
  }, [filtros.region, filtros.cuenca, filtros.subcuenca, filtros.tipoPunto,
      filtros.shac, filtros.apr, filtros.id_junta,
      filtros.fechaInicio, filtros.fechaFin, filtros.fechaPredefinida]);

  // Función para manejar cambios en filtros
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;

    if (name === 'region') {
      setFiltros(prev => ({ ...prev, region: value, cuenca: '', subcuenca: '', shac: '', id_junta: '' }));
    } else if (name === 'cuenca') {
      setFiltros(prev => ({ ...prev, cuenca: value, subcuenca: '', shac: '', id_junta: '' }));
    } else if (name === 'subcuenca') {
      setFiltros(prev => ({ ...prev, subcuenca: value, shac: '', id_junta: '' }));
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

      const queryParams = buildQueryParams(filtrosParaQuery, filtroCaudal, ordenCaudal, datosOriginales, limitMax);
      const data = await apiService.getPuntos(queryParams);

      if (Array.isArray(data)) {
        // Convertir coordenadas UTM a lat/lon
        const puntosConvertidos = data.map(punto => convertPuntoUTMtoLatLon(punto));

        setPuntos(puntosConvertidos);
        const limiteUsado = overrideLimit !== null ? overrideLimit : filtros.limit;
        const totalReal = puntosConvertidos.length;
        // Si retornó menos que el límite, sabemos el total real de puntos para estos filtros
        if (totalReal < limiteUsado) {
          setLimitMaxFromQuery(totalReal);
          setFiltros(prev => ({ ...prev, limit: totalReal }));
        }
        // Solo mostrar advertencia si la API retornó exactamente el límite (puede haber más)
        setLimiteSolicitado(totalReal >= limiteUsado ? limiteUsado : totalReal);

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
    shacsDisponibles,
    juntasDisponibles,
    limitMax,
    min,
    max,

    // Funciones
    handleFiltroChange,
    handleCoordenadasUnicas
  };
};