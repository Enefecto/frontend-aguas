import React, { useState, useEffect } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import { MAP_CONFIG } from '../../constants/mapConfig.js';
import { Legend } from '../UI/Leyend.jsx';
import { ToolsEditControl } from '../tools/ToolsEditControl.jsx';
import { MarkerLayer } from './MarkerLayer.jsx';
import { LayerSelector } from './LayerSelector.jsx';

function MapPanner({ punto }) {
  const map = useMap();
  useEffect(() => {
    if (punto?.lat && punto?.lon) {
      map.panTo([punto.lat, punto.lon]);
    }
  }, [punto?.lat, punto?.lon]);
  return null;
}

export const MapContainer = React.memo(({
  puntos,
  agrupar,
  apiUrl,
  apiService,
  handleShowSidebarCuencas,
  handleShowSidebarSubcuencas,
  handleShowSidebarPunto,
  isSelectingPointForComparison,
  onPointClickForComparison,
  selectedPointsForComparison,
  selectedPunto
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

      <MapPanner punto={selectedPunto} />

      <MarkerLayer
        puntos={puntos}
        agrupar={agrupar}
        handleShowSidebarCuencas={handleShowSidebarCuencas}
        handleShowSidebarSubcuencas={handleShowSidebarSubcuencas}
        handleShowSidebarPunto={handleShowSidebarPunto}
        apiService={apiService}
        isSelectingPointForComparison={isSelectingPointForComparison}
        onPointClickForComparison={onPointClickForComparison}
        selectedPointsForComparison={selectedPointsForComparison}
      />
    </LeafletMapContainer>
  );
});

MapContainer.displayName = 'MapContainer';