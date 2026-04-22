import { useState, useEffect, useMemo } from 'react';
import ApiService from '../services/apiService.js';

export const useMapData = (apiUrl) => {
  const [datosOriginales, setDatosOriginales] = useState([]);
  const [minMaxDatosOriginales, setMinMaxDatosOriginales] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [juntasDisponibles, setJuntasDisponibles] = useState([]);

  const apiService = useMemo(() => new ApiService(apiUrl), [apiUrl]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setError(null);

        // Cargar cuencas (requerido) y filtros reactivos (opcional) de forma independiente
        const [cuencasResponse, filtrosResponse] = await Promise.allSettled([
          apiService.getCuencas(),
          apiService.getFiltrosReactivos()
        ]);

        // Cuencas es requerido para que la app funcione
        if (cuencasResponse.status === 'fulfilled') {
          setDatosOriginales(cuencasResponse.value.cuencas);
        } else {
          console.error("Error al cargar cuencas:", cuencasResponse.reason);
          setError(cuencasResponse.reason);
          setIsLoaded(false);
          return;
        }

        // Filtros reactivos es opcional (min/max para sliders)
        if (filtrosResponse.status === 'fulfilled') {
          setMinMaxDatosOriginales(filtrosResponse.value.estadisticas);
        } else {
          console.warn("Filtros reactivos no disponibles, usando valores por defecto:", filtrosResponse.reason?.message);
          setMinMaxDatosOriginales([]);
        }

        setIsLoaded(true);
      } catch (err) {
        console.error("Error al cargar datos iniciales:", err);
        setError(err);
        setIsLoaded(false);
      }
    };

    const loadShacJuntaData = async () => {
      apiService.getJuntas()
        .then(data => {
          const opciones = (data?.juntas || []).map(j => ({
            value: j.id_junta,
            label: `Junta ${j.id_junta}`
          }));
          setJuntasDisponibles(opciones);
        })
        .catch(err => console.error("Error cargando Juntas:", err));
    };

    if (apiUrl) {
      loadInitialData();
      loadShacJuntaData();
    }
  }, [apiUrl]);

  return {
    datosOriginales,
    minMaxDatosOriginales,
    isLoaded,
    error,
    apiService,
    juntasDisponibles
  };
};