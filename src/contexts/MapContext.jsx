import React, { createContext, useContext } from 'react';
import { useMapData } from '../hooks/useMapData.js';
import { useFilterLogic } from '../hooks/useFilterLogic.js';
import { useSidebarState } from '../hooks/useSidebarState.js';
import { useAnalysisData } from '../hooks/useAnalysisData.js';

const MapContext = createContext();

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext debe ser usado dentro de MapProvider');
  }
  return context;
};

export const MapProvider = ({ children, apiUrl }) => {
  // Hook principal de datos
  const {
    datosOriginales,
    minMaxDatosOriginales,
    isLoaded,
    error,
    apiService,
    shacsDisponibles,
    juntasDisponibles
  } = useMapData(apiUrl);

  // Hook de lógica de filtros
  const filterLogic = useFilterLogic(datosOriginales, minMaxDatosOriginales, isLoaded, apiService);

  // Hook de estado de sidebars
  const sidebarState = useSidebarState();

  // Hook de datos de análisis
  const analysisData = useAnalysisData(apiService);

  const value = {
    // Datos base
    datosOriginales,
    minMaxDatosOriginales,
    isLoaded,
    error,
    apiService,
    shacsDisponibles,
    juntasDisponibles,

    // Lógica de filtros
    ...filterLogic,

    // Estado de sidebars
    ...sidebarState,

    // Datos de análisis
    ...analysisData,

    // API URL
    apiUrl
  };

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
};