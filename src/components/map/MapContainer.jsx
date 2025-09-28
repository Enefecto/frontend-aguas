import React, { useState } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import { MAP_CONFIG } from '../../constants/mapConfig.js';
import { Legend } from '../UI/Leyend.jsx';
import { ToolsEditControl } from '../tools/ToolsEditControl.jsx';
import { MarkerLayer } from './MarkerLayer.jsx';
import { LayerSelector } from './LayerSelector.jsx';

export const MapContainer = React.memo(({
  puntos,
  agrupar,
  apiUrl,
  handleShowSidebarCuencas,
  handleShowSidebarPunto
}) => {
  const [currentLayer, setCurrentLayer] = useState(MAP_CONFIG.DEFAULT_TILE_LAYER);

  const handleLayerChange = (layerKey) => {
    setCurrentLayer(layerKey);
  };

  const selectedLayer = MAP_CONFIG.TILE_LAYERS[currentLayer];

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

      <LayerSelector
        currentLayer={currentLayer}
        onLayerChange={handleLayerChange}
      />

      <TileLayer
        key={currentLayer}
        attribution={selectedLayer.attribution}
        url={selectedLayer.url}
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