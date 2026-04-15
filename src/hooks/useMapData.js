import { useState, useEffect, useMemo } from 'react';
import ApiService from '../services/apiService.js';

export const useMapData = (apiUrl) => {
  const [datosOriginales, setDatosOriginales] = useState([]);
  const [minMaxDatosOriginales, setMinMaxDatosOriginales] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [shacsDisponibles, setShacsDisponibles] = useState([]);
  const [juntasDisponibles, setJuntasDisponibles] = useState([]);

  const apiService = useMemo(() => new ApiService(apiUrl), [apiUrl]);

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

    const loadShacJuntaData = async () => {
      apiService.getShacs()
        .then(data => {
          const opciones = (data?.shacs || []).map(s => ({
            value: s.cod_sector_sha,
            label: s.sector_sha || `SHAC ${s.cod_sector_sha}`
          }));
          setShacsDisponibles(opciones);
        })
        .catch(err => console.error("Error cargando SHACs:", err));

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
    shacsDisponibles,
    juntasDisponibles
  };
};