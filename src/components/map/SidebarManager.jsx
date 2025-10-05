import React from 'react';
import SidebarFiltros from '../sidebars/SidebarFiltros.jsx';
import SidebarCuenca from '../sidebars/SidebarCuenca.jsx';
import SidebarSubcuenca from '../sidebars/SidebarSubcuenca.jsx';
import SidebarPunto from '../sidebars/SidebarPunto.jsx';
import BotonAbrirSidebarFiltros from '../Buttons/BotonAbrirSidebarFiltros.jsx';

export const SidebarManager = ({
  // Estados de sidebars
  sidebarAbierto,
  setSidebarAbierto,
  rightSidebarAbiertoCuencas,
  setRightSidebarAbiertoCuencas,
  rightSidebarAbiertoSubcuencas,
  setRightSidebarAbiertoSubcuencas,
  rightSidebarAbiertoPunto,
  setRightSidebarAbiertoPunto,

  // Props para SidebarFiltros
  filtros,
  setFiltros,
  filteredOptions,
  limitMax,
  min,
  max,
  filtroCaudal,
  setFiltroCaudal,
  ordenCaudal,
  setOrdenCaudal,
  handleCoordenadasUnicas,
  handleFiltroChange,
  isLoaded,
  puntos,
  limiteSolicitado,
  agrupar,
  setAgrupar,
  queryCompleted,

  // Props para SidebarCuenca
  cuencaAnalysis,
  cuencaLoading,
  graphicsCuencasLoading,
  graficosData,
  loadCuencasGraphics,

  // Props para SidebarSubcuenca
  subcuencaAnalysis,
  subcuencaLoading,
  graphicsSubcuencasLoading,
  graficosSubcuencasData,
  loadSubcuencasGraphics,

  // Props para SidebarPunto
  analisisPuntoSeleccionado,
  analisisPuntoSeleccionadoLoading,
  graphicsPuntosLoading,
  graficosPuntosData,
  loadPuntosGraphics,
  apiService
}) => {
  return (
    <>
      {sidebarAbierto && (
        <SidebarFiltros
          filtros={filtros}
          setFiltros={setFiltros}
          regionesUnicas={filteredOptions.regionesUnicas}
          cuencasUnicas={filteredOptions.cuencasUnicas}
          subcuencasUnicas={filteredOptions.subcuencasUnicas}
          limitMax={limitMax}
          min={min}
          max={max}
          filtroCaudal={filtroCaudal}
          setFiltroCaudal={setFiltroCaudal}
          ordenCaudal={ordenCaudal}
          setOrdenCaudal={setOrdenCaudal}
          handleCoordenadasUnicas={handleCoordenadasUnicas}
          isLoaded={isLoaded}
          puntos={puntos}
          limiteSolicitado={limiteSolicitado}
          setSidebarAbierto={setSidebarAbierto}
          agrupar={agrupar}
          setAgrupar={setAgrupar}
          handleFiltroChange={handleFiltroChange}
          queryCompleted={queryCompleted}
        />
      )}

      {!sidebarAbierto && (
        <BotonAbrirSidebarFiltros setSidebarAbierto={setSidebarAbierto} />
      )}

      {rightSidebarAbiertoCuencas && (
        <SidebarCuenca
          cuencaAnalysis={cuencaAnalysis}
          cuencaLoading={cuencaLoading}
          graphicsCuencasLoading={graphicsCuencasLoading}
          graficosData={graficosData}
          setRightSidebarAbiertoCuencas={setRightSidebarAbiertoCuencas}
          loadCuencasGraphics={loadCuencasGraphics}
        />
      )}

      {rightSidebarAbiertoSubcuencas && (
        <SidebarSubcuenca
          subcuencaAnalysis={subcuencaAnalysis}
          subcuencaLoading={subcuencaLoading}
          graphicsSubcuencasLoading={graphicsSubcuencasLoading}
          graficosData={graficosSubcuencasData}
          setRightSidebarAbiertoSubcuencas={setRightSidebarAbiertoSubcuencas}
          loadSubcuencasGraphics={loadSubcuencasGraphics}
        />
      )}

      {rightSidebarAbiertoPunto && (
        <SidebarPunto
          analisisPuntoSeleccionado={analisisPuntoSeleccionado}
          analisisPuntoSeleccionadoLoading={analisisPuntoSeleccionadoLoading}
          graphicsPuntosLoading={graphicsPuntosLoading}
          graficosPuntosData={graficosPuntosData}
          loadPuntosGraphics={loadPuntosGraphics}
          setRightSidebarAbiertoPunto={setRightSidebarAbiertoPunto}
          apiService={apiService}
        />
      )}
    </>
  );
};