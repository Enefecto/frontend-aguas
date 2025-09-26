import React, { useMemo, useCallback } from 'react';
import { Marker, Popup, LayerGroup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { createDropIcon, getMarkerColor, createClusterIcon, isValidCoordinate } from '../../utils/mapUtils.js';
import { PopupPunto } from '../Popups/PopupPunto.jsx';

export const MarkerLayer = React.memo(({
  puntos,
  agrupar,
  handleShowSidebarCuencas,
  handleShowSidebarPunto
}) => {
  const renderMarkers = useMemo(() => (
    puntos
      .filter(isValidCoordinate)
      .map((punto) => {
        const color = getMarkerColor(punto);
        const customIcon = createDropIcon(color);

        // Si no se pudo crear el icono (Leaflet no está disponible), no renderizar
        if (!customIcon) return null;

        return (
          <Marker
            key={`${punto.utm_este}-${punto.utm_norte}`}
            position={[punto.lat, punto.lon]}
            icon={customIcon}
          >
            <Popup>
              <PopupPunto
                punto={punto}
                handleShowSidebarCuencas={handleShowSidebarCuencas}
                handleShowSidebarPunto={handleShowSidebarPunto}
              />
            </Popup>
          </Marker>
        );
      })
      .filter(Boolean) // Filtrar elementos null
  ), [puntos, handleShowSidebarCuencas, handleShowSidebarPunto]);

  if (agrupar) {
    return (
      <MarkerClusterGroup
        key="cluster-on"
        chunkedLoading
        spiderfyOnEveryZoom
        showCoverageOnHover={false}
        iconCreateFunction={createClusterIcon}
      >
        {renderMarkers}
      </MarkerClusterGroup>
    );
  }

  return (
    <LayerGroup key="cluster-off">
      {renderMarkers}
    </LayerGroup>
  );
});