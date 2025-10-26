import React, { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import { MapProvider, useMapContext } from '../contexts/MapContext.jsx';
import { MapContainer } from './map/MapContainer.jsx';
import { SidebarManager } from './map/SidebarManager.jsx';
import { ComparePointsSelector } from './map/ComparePointsSelector.jsx';
import { ComparePointsModal } from './modals/ComparePointsModal.jsx';

const MapaContent = () => {
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const [selectedPointsForComparison, setSelectedPointsForComparison] = useState([null, null]);
  const [isSelectingPoint, setIsSelectingPoint] = useState(null); // null, 0, o 1
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showDuplicateError, setShowDuplicateError] = useState(false);

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
    apiUrl,
    apiService
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

  // Funciones para comparación de puntos
  const handlePointSelect = (slotIndex, point = null) => {
    if (point === null) {
      // Remover punto
      const newPoints = [...selectedPointsForComparison];
      newPoints[slotIndex] = null;
      setSelectedPointsForComparison(newPoints);
      setIsSelectingPoint(null);
    } else {
      // Iniciar selección
      setIsSelectingPoint(slotIndex);
    }
  };

  const handlePointClickForComparison = React.useCallback((punto) => {
    if (isSelectingPoint !== null) {
      // Verificar si el punto ya está seleccionado en el otro slot comparando coordenadas
      const otherSlotIndex = isSelectingPoint === 0 ? 1 : 0;
      const otherPoint = selectedPointsForComparison[otherSlotIndex];

      if (otherPoint &&
          otherPoint.lat === punto.lat &&
          otherPoint.lon === punto.lon) {
        // Mostrar error de duplicado
        setShowDuplicateError(true);
        setTimeout(() => setShowDuplicateError(false), 2000);
        return;
      }

      const newPoints = [...selectedPointsForComparison];
      newPoints[isSelectingPoint] = punto;
      setSelectedPointsForComparison(newPoints);
      setIsSelectingPoint(null);
    }
  }, [isSelectingPoint, selectedPointsForComparison]);

  const handleCompare = () => {
    if (selectedPointsForComparison[0] && selectedPointsForComparison[1]) {
      setShowCompareModal(true);
    }
  };

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
        apiService={apiService}
        handleShowSidebarCuencas={handleShowSidebarCuencas}
        handleShowSidebarSubcuencas={handleShowSidebarSubcuencas}
        handleShowSidebarPunto={handleShowSidebarPunto}
        isSelectingPointForComparison={isSelectingPoint !== null}
        onPointClickForComparison={handlePointClickForComparison}
        selectedPointsForComparison={selectedPointsForComparison}
      />

      <ComparePointsSelector
        selectedPoints={selectedPointsForComparison}
        onPointSelect={handlePointSelect}
        onCompare={handleCompare}
        isSelectingPoint={isSelectingPoint}
      />

      <ComparePointsModal
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        point1={selectedPointsForComparison[0]}
        point2={selectedPointsForComparison[1]}
        apiService={apiService}
      />

      {/* Mensaje de error para puntos duplicados */}
      {showDuplicateError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[10000] animate-shake">
          <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="font-medium">No puedes seleccionar el mismo punto dos veces</span>
          </div>
        </div>
      )}

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
        apiService={apiService}
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