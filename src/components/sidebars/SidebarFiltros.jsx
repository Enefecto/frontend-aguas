import React from 'react';
import { ButtonOpenCloseSidebar } from '../Buttons/ButtonOpenCloseSidebar.jsx';
import { CustomSwitch } from '../UI/CustomSwitch.jsx';
import { StatusButton } from '../UI/StatusButton.jsx';
import { useFilterStatus } from '../../hooks/useFilterStatus.js';
import {
  RegionFilter,
  CuencaFilter,
  SubcuencaFilter,
  LimitFilter,
  CaudalFilter,
  OrdenCaudalFilter,
  TipoPuntoFilter
} from './FilterSection.jsx';
import { UI_CONFIG } from '../../constants/uiConfig.js';

export default function SidebarFiltros({
  filtros,
  setFiltros,
  regionesUnicas,
  cuencasUnicas,
  subcuencasUnicas,
  limitMax,
  min,
  max,
  filtroCaudal,
  setFiltroCaudal,
  ordenCaudal,
  setOrdenCaudal,
  handleCoordenadasUnicas,
  isLoaded,
  puntos,
  limiteSolicitado,
  setSidebarAbierto,
  agrupar,
  setAgrupar,
  handleFiltroChange,
  queryCompleted
}) {
  const {
    consultandoPuntos,
    isOpen,
    setIsOpen,
    handleUpdateStateConsultandoPuntos,
    hayFiltrosPendientes
  } = useFilterStatus(puntos, filtros, filtroCaudal, ordenCaudal, isLoaded, handleCoordenadasUnicas, queryCompleted, limitMax);

  const handleConsultarClick = () => {
    handleCoordenadasUnicas();
    handleUpdateStateConsultandoPuntos();
  };

  return (
    <div
      className={`absolute left-0 top-0 z-[${UI_CONFIG.Z_INDEX.SIDEBAR}] bg-white shadow-md pt-8 px-16 sm:px-0 sm:pr-16 sm:pl-10 space-y-4 text-sm h-full
        w-full sm:w-100 max-h-screen overflow-y-auto transform transition-transform duration-${UI_CONFIG.ANIMATIONS.SIDEBAR_TRANSITION} ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      <ButtonOpenCloseSidebar
        toggleSidebar={setSidebarAbierto}
        isFiltrosSidebar={true}
        setIsOpen={setIsOpen}
      />

      <h2 className="text-lg font-bold mb-4">Filtros</h2>

      <RegionFilter
        filtros={filtros}
        handleFiltroChange={handleFiltroChange}
        regionesUnicas={regionesUnicas}
      />

      <CuencaFilter
        filtros={filtros}
        handleFiltroChange={handleFiltroChange}
        cuencasUnicas={cuencasUnicas}
      />

      <SubcuencaFilter
        filtros={filtros}
        handleFiltroChange={handleFiltroChange}
        subcuencasUnicas={subcuencasUnicas}
      />

      <LimitFilter
        filtros={filtros}
        setFiltros={setFiltros}
        limitMax={limitMax}
      />

      <CaudalFilter
        filtroCaudal={filtroCaudal}
        setFiltroCaudal={setFiltroCaudal}
        min={min}
        max={max}
      />

      <OrdenCaudalFilter
        ordenCaudal={ordenCaudal}
        setOrdenCaudal={setOrdenCaudal}
      />

      <TipoPuntoFilter
        filtros={filtros}
        handleFiltroChange={handleFiltroChange}
      />

      <div className="mt-2 border-t pt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Agrupar puntos</span>
          <CustomSwitch
            checked={agrupar}
            onChange={(e) => setAgrupar(e.target.checked)}
            inputProps={{ 'aria-label': 'Agrupar puntos' }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Combina marcadores cercanos para mejorar el rendimiento visual.
        </p>
      </div>

      <div className="sticky bottom-0 w-full bg-white border-t p-4 space-y-3">
        <div className="flex justify-center">
          <StatusButton
            onClick={handleConsultarClick}
            disabled={!isLoaded}
            status={consultandoPuntos}
          >
            Consultar puntos
          </StatusButton>
        </div>

        {/* Mensaje dinámico basado en el estado */}
        {hayFiltrosPendientes && !queryCompleted ? (
          <div className="bg-blue-50 text-blue-800 px-3 py-2 rounded-md text-sm border border-blue-200 shadow-sm animate-pulse">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>
                Filtros actualizados. <strong>Presiona "Consultar Puntos"</strong> para ver los resultados
              </span>
            </div>
          </div>
        ) : puntos.length > 0 && puntos.length < limiteSolicitado ? (
          <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-md text-sm border border-yellow-300 shadow-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>
                Solo <strong>{puntos.length}</strong> de <strong>{limiteSolicitado}</strong> puntos encontrados
              </span>
            </div>
          </div>
        ) : puntos.length > 0 ? (
          <div className="text-center text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-md">
            <span className="font-medium text-green-700">{puntos.length}</span> puntos mostrados en el mapa
          </div>
        ) : queryCompleted && puntos.length === 0 ? (
          <div className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm border border-gray-300 shadow-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>
                No se encontraron puntos con los filtros actuales
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}