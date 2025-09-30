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
  handleShowSidebarSubcuencas,
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
          subterraneo: MAP_CONFIG.MARKER_COLORS.UNDERGROUND_EXTRACTION,
          extraccion: MAP_CONFIG.MARKER_COLORS.SURFACE_EXTRACTION,
          sinClasificar: MAP_CONFIG.MARKER_COLORS.UNCLASSIFIED
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
        handleShowSidebarSubcuencas={handleShowSidebarSubcuencas}
        handleShowSidebarPunto={handleShowSidebarPunto}
      />
    </LeafletMapContainer>
  );
});