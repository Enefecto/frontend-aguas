import React from 'react';
import SidebarFiltrosRefactored from '../sidebars/SidebarFiltrosRefactored.jsx';
import SidebarCuenca from '../sidebars/SidebarCuenca.jsx';
import SidebarPunto from '../sidebars/SidebarPunto.jsx';
import BotonAbrirSidebarFiltros from '../Buttons/BotonAbrirSidebarFiltros.jsx';

export const SidebarManager = ({
  // Estados de sidebars
  sidebarAbierto,
  setSidebarAbierto,
  rightSidebarAbiertoCuencas,
  setRightSidebarAbiertoCuencas,
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

  // Props para SidebarCuenca
  cuencaAnalysis,
  cuencaLoading,
  graphicsCuencasLoading,
  graficosData,
  loadCuencasGraphics,

  // Props para SidebarPunto
  analisisPuntoSeleccionado,
  analisisPuntoSeleccionadoLoading,
  graphicsPuntosLoading,
  graficosPuntosData,
  loadPuntosGraphics
}) => {
  return (
    <>
      {sidebarAbierto && (
        <SidebarFiltrosRefactored
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

      {rightSidebarAbiertoPunto && (
        <SidebarPunto
          analisisPuntoSeleccionado={analisisPuntoSeleccionado}
          analisisPuntoSeleccionadoLoading={analisisPuntoSeleccionadoLoading}
          graphicsPuntosLoading={graphicsPuntosLoading}
          graficosPuntosData={graficosPuntosData}
          loadPuntosGraphics={loadPuntosGraphics}
          setRightSidebarAbiertoPunto={setRightSidebarAbiertoPunto}
        />
      )}
    </>
  );
};