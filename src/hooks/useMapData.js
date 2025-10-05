import { useState, useEffect } from 'react';
import ApiService from '../services/apiService.js';
import temporalApiCuencas from '../utils/temporalApiCuencas.json';
import temporalResponseFiltros from '../utils/temporalResponseFiltros.json';

export const useMapData = (apiUrl) => {
  const [datosOriginales, setDatosOriginales] = useState([]);
  const [minMaxDatosOriginales, setMinMaxDatosOriginales] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  const apiService = new ApiService(apiUrl);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setError(null);

        // Usar datos temporales de los archivos JSON
        setDatosOriginales(temporalApiCuencas.cuencas);
        setMinMaxDatosOriginales(temporalResponseFiltros.estadisticas);
        setIsLoaded(true);

        // TODO: Cuando los endpoints estén listos, descomentar esto:
        // const [cuencasResponse, statsResponse] = await Promise.all([
        //   apiService.getCuencas(),
        //   apiService.getCuencasStats()
        // ]);
        // setDatosOriginales(cuencasResponse.cuencas);
        // setMinMaxDatosOriginales(statsResponse.estadisticas);
      } catch (err) {
        console.error("Error al cargar datos iniciales:", err);
        setError(err);
        setIsLoaded(false);
      }
    };

    if (apiUrl) {
      loadInitialData();
    }
  }, [apiUrl]);

  return {
    datosOriginales,
    minMaxDatosOriginales,
    isLoaded,
    error,
    apiService
  };
};