import React from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import { MAP_CONFIG } from '../../constants/mapConfig.js';
import { Legend } from '../UI/Leyend.jsx';
import { ToolsEditControl } from '../tools/ToolsEditControl.jsx';
import { MarkerLayer } from './MarkerLayer.jsx';

export const MapContainer = React.memo(({
  puntos,
  agrupar,
  apiUrl,
  handleShowSidebarCuencas,
  handleShowSidebarPunto
}) => {
  return (
    <LeafletMapContainer
      center={MAP_CONFIG.DEFAULT_CENTER}
      zoom={MAP_CONFIG.DEFAULT_ZOOM}
      className="map-altura w-full"
      zoomControl={false}
    >
      <Legend
        position="bottomright"
        colores={{
          pozos: MAP_CONFIG.MARKER_COLORS.WELL,
          extraccion: MAP_CONFIG.MARKER_COLORS.SURFACE_EXTRACTION
        }}
      />
      <ZoomControl position="topright" />
      <TileLayer
        attribution={MAP_CONFIG.TILE_LAYER.ATTRIBUTION}
        url={MAP_CONFIG.TILE_LAYER.URL}
      />

      <ToolsEditControl
        apiUrl={apiUrl}
        puntos={puntos}
      />

      <MarkerLayer
        puntos={puntos}
        agrupar={agrupar}
        handleShowSidebarCuencas={handleShowSidebarCuencas}
        handleShowSidebarPunto={handleShowSidebarPunto}
      />
    </LeafletMapContainer>
  );
});