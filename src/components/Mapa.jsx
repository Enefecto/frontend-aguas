import React, { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import { MapProvider, useMapContext } from '../contexts/MapContext.jsx';
import { MapContainer } from './map/MapContainer.jsx';
import { SidebarManager } from './map/SidebarManager.jsx';

const MapaContent = () => {
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);

  // Cargar leaflet-draw solo después de que leaflet esté disponible
  useEffect(() => {
    const loadLeafletDraw = async () => {
      if (typeof window !== 'undefined') {
        // Asegurar que Leaflet esté cargado primero
        const L = await import('leaflet');
        window.L = L.default;

        // Luego cargar leaflet-draw
        await import('leaflet-draw');

        setIsLeafletLoaded(true);
      }
    };

    loadLeafletDraw();
  }, []);

  const {
    // Datos base
    isLoaded,

    // Estados de filtros
    filtros,
    setFiltros,
    filtroCaudal,
    setFiltroCaudal,
    ordenCaudal,
    setOrdenCaudal,
    puntos,
    limiteSolicitado,
    filteredOptions,
    limitMax,
    min,
    max,
    handleFiltroChange,
    handleCoordenadasUnicas,
    queryCompleted,

    // Estados de sidebars
    sidebarAbierto,
    setSidebarAbierto,
    rightSidebarAbiertoCuencas,
    setRightSidebarAbiertoCuencas,
    rightSidebarAbiertoSubcuencas,
    setRightSidebarAbiertoSubcuencas,
    rightSidebarAbiertoPunto,
    setRightSidebarAbiertoPunto,
    openCuencaSidebar,
    openSubcuencaSidebar,
    openPuntoSidebar,

    // Datos de análisis
    cuencaAnalysis,
    cuencaLoading,
    graphicsCuencasLoading,
    graficosData,
    loadCuencaAnalysis,
    loadCuencasGraphics,
    subcuencaAnalysis,
    subcuencaLoading,
    graphicsSubcuencasLoading,
    graficosSubcuencasData,
    loadSubcuencaAnalysis,
    loadSubcuencasGraphics,
    analisisPuntoSeleccionado,
    analisisPuntoSeleccionadoLoading,
    graphicsPuntosLoading,
    graficosPuntosData,
    loadPuntoAnalysis,
    loadPuntosGraphics,

    // API
    apiUrl
  } = useMapContext();

  const [agrupar, setAgrupar] = useState(false);

  const handleShowSidebarCuencas = React.useCallback((nomCuenca, codCuenca) => {
    openCuencaSidebar();
    loadCuencaAnalysis(nomCuenca, codCuenca);
  }, [openCuencaSidebar, loadCuencaAnalysis]);

  const handleShowSidebarSubcuencas = React.useCallback((nomSubcuenca, codSubcuenca, codCuenca = null, nomCuenca = null) => {
    openSubcuencaSidebar();
    loadSubcuencaAnalysis(nomSubcuenca, codSubcuenca, codCuenca, nomCuenca);
  }, [openSubcuencaSidebar, loadSubcuencaAnalysis]);

  const handleShowSidebarPunto = React.useCallback((punto) => {
    openPuntoSidebar();
    loadPuntoAnalysis(punto);
  }, [openPuntoSidebar, loadPuntoAnalysis]);

  // No renderizar hasta que Leaflet esté completamente cargado
  if (!isLeafletLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <MapContainer
        puntos={puntos}
        agrupar={agrupar}
        apiUrl={apiUrl}
        handleShowSidebarCuencas={handleShowSidebarCuencas}
        handleShowSidebarSubcuencas={handleShowSidebarSubcuencas}
        handleShowSidebarPunto={handleShowSidebarPunto}
      />

      <SidebarManager
        // Estados de sidebars
        sidebarAbierto={sidebarAbierto}
        setSidebarAbierto={setSidebarAbierto}
        rightSidebarAbiertoCuencas={rightSidebarAbiertoCuencas}
        setRightSidebarAbiertoCuencas={setRightSidebarAbiertoCuencas}
        rightSidebarAbiertoSubcuencas={rightSidebarAbiertoSubcuencas}
        setRightSidebarAbiertoSubcuencas={setRightSidebarAbiertoSubcuencas}
        rightSidebarAbiertoPunto={rightSidebarAbiertoPunto}
        setRightSidebarAbiertoPunto={setRightSidebarAbiertoPunto}

        // Props para SidebarFiltros
        filtros={filtros}
        setFiltros={setFiltros}
        filteredOptions={filteredOptions}
        limitMax={limitMax}
        min={min}
        max={max}
        filtroCaudal={filtroCaudal}
        setFiltroCaudal={setFiltroCaudal}
        ordenCaudal={ordenCaudal}
        setOrdenCaudal={setOrdenCaudal}
        handleCoordenadasUnicas={handleCoordenadasUnicas}
        handleFiltroChange={handleFiltroChange}
        isLoaded={isLoaded}
        puntos={puntos}
        limiteSolicitado={limiteSolicitado}
        agrupar={agrupar}
        setAgrupar={setAgrupar}
        queryCompleted={queryCompleted}

        // Props para SidebarCuenca
        cuencaAnalysis={cuencaAnalysis}
        cuencaLoading={cuencaLoading}
        graphicsCuencasLoading={graphicsCuencasLoading}
        graficosData={graficosData}
        loadCuencasGraphics={loadCuencasGraphics}

        // Props para SidebarSubcuenca
        subcuencaAnalysis={subcuencaAnalysis}
        subcuencaLoading={subcuencaLoading}
        graphicsSubcuencasLoading={graphicsSubcuencasLoading}
        graficosSubcuencasData={graficosSubcuencasData}
        loadSubcuencasGraphics={loadSubcuencasGraphics}

        // Props para SidebarPunto
        analisisPuntoSeleccionado={analisisPuntoSeleccionado}
        analisisPuntoSeleccionadoLoading={analisisPuntoSeleccionadoLoading}
        graphicsPuntosLoading={graphicsPuntosLoading}
        graficosPuntosData={graficosPuntosData}
        loadPuntosGraphics={loadPuntosGraphics}
      />
    </div>
  );
};

export default function Mapa({ apiUrl }) {
  return (
    <MapProvider apiUrl={apiUrl}>
      <MapaContent />
    </MapProvider>
  );
}