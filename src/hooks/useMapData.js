import { useState, useEffect } from 'react';
import ApiService from '../services/apiService.js';

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

        const [cuencasResponse, filtrosResponse] = await Promise.all([
          apiService.getCuencas(),
          apiService.getFiltrosReactivos()
        ]);

        setDatosOriginales(cuencasResponse.cuencas);
        setMinMaxDatosOriginales(filtrosResponse.estadisticas);
        setIsLoaded(true);
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