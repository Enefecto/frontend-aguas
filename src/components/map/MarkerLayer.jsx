import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { Marker, Popup, LayerGroup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { createDropIcon, getMarkerColor, createClusterIcon, isValidCoordinate } from '../../utils/mapUtils.js';
import { PopupPunto } from '../Popups/PopupPunto.jsx';

export const MarkerLayer = React.memo(({
  puntos,
  agrupar,
  handleShowSidebarCuencas,
  handleShowSidebarSubcuencas,
  handleShowSidebarPunto
}) => {
  const map = useMap();
  const clusterGroupRef = useRef(null);
  const renderMarkers = useMemo(() => (
    puntos
      .filter(isValidCoordinate)
      .map((punto, index) => {
        const color = getMarkerColor(punto);
        const customIcon = createDropIcon(color);

        // Si no se pudo crear el icono (Leaflet no está disponible), no renderizar
        if (!customIcon) return null;

        return (
          <Marker
            key={`${punto.utm_este}-${punto.utm_norte}-${index}`}
            position={[punto.lat, punto.lon]}
            icon={customIcon}
          >
            <Popup>
              <PopupPunto
                punto={punto}
                handleShowSidebarCuencas={handleShowSidebarCuencas}
                handleShowSidebarSubcuencas={handleShowSidebarSubcuencas}
                handleShowSidebarPunto={handleShowSidebarPunto}
              />
            </Popup>
          </Marker>
        );
      })
      .filter(Boolean) // Filtrar elementos null
  ), [puntos, handleShowSidebarCuencas, handleShowSidebarSubcuencas, handleShowSidebarPunto]);

  // Hook para refrescar clusters después de zoom automático
  useEffect(() => {
    if (agrupar && clusterGroupRef.current && map) {
      const clusterGroup = clusterGroupRef.current;

      // Listener para cuando termina el zoom automático
      const onZoomEnd = () => {
        // Pequeño delay para asegurar que el zoom haya terminado completamente
        setTimeout(() => {
          if (clusterGroup?.refreshClusters) {
            clusterGroup.refreshClusters();
          }
        }, 100);
      };

      // Listener para cuando termina cualquier animación de zoom
      const onMoveEnd = () => {
        setTimeout(() => {
          if (clusterGroup?.refreshClusters) {
            clusterGroup.refreshClusters();
          }
        }, 50);
      };

      map.on('zoomend', onZoomEnd);
      map.on('moveend', onMoveEnd);

      return () => {
        map.off('zoomend', onZoomEnd);
        map.off('moveend', onMoveEnd);
      };
    }
  }, [agrupar, map]);

  if (agrupar) {
    return (
      <MarkerClusterGroup
        key="cluster-on"
        ref={clusterGroupRef}
        chunkedLoading
        spiderfyOnEveryZoom={false}
        showCoverageOnHover={false}
        iconCreateFunction={createClusterIcon}
        maxClusterRadius={80}
        disableClusteringAtZoom={18}
        animate={true}
        animateAddingMarkers={true}
        spiderfyDistanceMultiplier={1.5}
        polygonOptions={{
          fillColor: '#2E7BCC',
          color: '#2E7BCC',
          weight: 2,
          opacity: 0.5,
          fillOpacity: 0.2
        }}
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