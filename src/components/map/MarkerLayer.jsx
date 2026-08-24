import React, { useMemo, useRef, useEffect } from 'react';
import { Marker, Popup, LayerGroup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { createDropIcon, getMarkerColor, createClusterIcon, isValidCoordinate, getSidebarOcclusion } from '../../utils/mapUtils.js';
import { PopupPunto } from '../Popups/PopupPunto.jsx';

export const MarkerLayer = React.memo(({
  puntos,
  agrupar,
  handleShowSidebarCuencas,
  handleShowSidebarSubcuencas,
  handleShowSidebarPunto,
  apiService
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
            <Popup autoPan={false}>
              <PopupPunto
                punto={punto}
                handleShowSidebarCuencas={handleShowSidebarCuencas}
                handleShowSidebarSubcuencas={handleShowSidebarSubcuencas}
                handleShowSidebarPunto={handleShowSidebarPunto}
                apiService={apiService}
              />
            </Popup>
          </Marker>
        );
      })
      .filter(Boolean) // Filtrar elementos null
  ), [puntos, handleShowSidebarCuencas, handleShowSidebarSubcuencas, handleShowSidebarPunto, apiService]);

  // Centrado del punto al abrir su popup.
  //
  // Solo se centra al apretar un punto: fuera de eso el mapa queda libre.
  // El centro se calcula sobre el área visible del mapa, descontando las
  // sidebars abiertas, para que el punto no quede tapado por ellas.
  useEffect(() => {
    const panForPopup = (latlng, container) => {
      const mapContainer = map.getContainer();
      const { left, right } = getSidebarOcclusion(mapContainer);

      const anchoMapa = mapContainer.clientWidth;
      const centroContenedorX = anchoMapa / 2;
      const centroVisibleX = (left + (anchoMapa - right)) / 2;

      const h = container.offsetHeight;
      const zoom = map.getZoom();
      const markerPx = map.project(latlng, zoom);
      const adjustedPx = markerPx.subtract([centroVisibleX - centroContenedorX, h / 2]);
      map.panTo(map.unproject(adjustedPx, zoom));
    };

    const onPopupOpen = (e) => {
      const source = e.popup?._source;
      if (!source?.getLatLng) return;
      const latlng = source.getLatLng();
      const container = e.popup._container;
      if (!container) return;

      panForPopup(latlng, container);

      // El popup carga su contenido async y crece: se reajusta mientras eso pasa.
      let timeout;
      const observer = new ResizeObserver(() => {
        clearTimeout(timeout);
        timeout = setTimeout(() => panForPopup(latlng, container), 80);
      });
      observer.observe(container);

      const detener = () => {
        observer.disconnect();
        clearTimeout(timeout);
      };

      // En cuanto el usuario mueve el mapa, deja de reajustarse:
      // el centrado no debe pelear contra el arrastre.
      map.once('dragstart', detener);
      map.once('zoomstart', detener);
      map.once('popupclose', detener);
    };

    map.on('popupopen', onPopupOpen);
    return () => map.off('popupopen', onPopupOpen);
  }, [map]);

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

  if (agrupar && puntos.length > 0) {
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

MarkerLayer.displayName = 'MarkerLayer';