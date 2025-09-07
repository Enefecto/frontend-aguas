import { FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { getPointsInPolygon } from '../Popups/PopupPuntosInPersonalizado';
import { getPointsInCircle } from '../Popups/PopupPuntosInCircle';

export const ToolsEditControl = ({puntos}) => {
  return (
    <>
      <FeatureGroup>
        <EditControl
          position="topright"
          draw={{
            rectangle: false,
            polygon: {
              allowIntersection: false, // evita que se crucen las líneas
              showArea: false,           // muestra el área en tiempo real
              shapeOptions: {
                color: "#10b981",
                weight: 2,
              },
              drawError: {
                color: "#ff0000",
                message: "<strong>Error:</strong> los bordes no pueden cruzarse.",
              },
              // 🔑 aquí el control de cuántos puntos como mínimo y máximo
              minimumVertexCount: 3, // mínimo 3 (triángulo)
              maxVertices: null,      // o null para ilimitado
            },
            marker: false,
            circlemarker: false,
            circle: {
              shapeOptions: {
                color: '#ff0000',
              },
            },
            polyline: {
              shapeOptions: {
                color: '#1d4ed8',
                weight: 4,
              },
            },
          }}
          edit={{
            edit: false,
            remove: true,
          }}
          onCreated={(e) => {
            const layer = e.layer;

            if (e.layerType === 'circle') {
              const layer = e.layer;
              const center = layer.getLatLng();
              const radius = layer.getRadius();

              // Calcular un punto en el perímetro hacia el este
              const puntoPerimetro = L.latLng(
                center.lat,
                center.lng + (radius / (111320 * Math.cos(center.lat * Math.PI / 180)))
              );

              // Dibujar la línea (radio)
              const radioLine = L.polyline([center, puntoPerimetro], {
                color: "#1d4ed8",
                weight: 3,
                dashArray: "6, 6"
              }).addTo(layer._map);

              // Formatear radio
              const radioTexto = radius >= 1000
                ? `${(radius / 1000).toFixed(2)} km`
                : `${radius.toFixed(0)} m`;

              // 📍 Crear un marcador de texto en el medio de la línea
              const midPoint = L.latLng(
                (center.lat + puntoPerimetro.lat) / 2,
                (center.lng + puntoPerimetro.lng) / 2
              );

              const radioLabel = L.marker(midPoint, {
                icon: L.divIcon({
                  className: "radio-label",
                  html: `<div style="
                    padding: 2px 0px;
                    color: #1d4ed8;
                    font-size: 12px;
                    font-weight: bold;
                    white-space: nowrap;
                  ">${radioTexto}</div>`,
                  iconSize: [0, 0],
                  iconAnchor: [-5, -5] // ajusta la posición
                })
              }).addTo(layer._map);

              // Popup del círculo (tus estadísticas)
              layer.bindPopup("Cargando...").openPopup();
              getPointsInCircle(puntos, center, radius, layer);

              // 🔑 Borrar todo junto si eliminan el círculo
              layer.on("remove", () => {
                layer._map.removeLayer(radioLine);
                layer._map.removeLayer(radioLabel);
              });
            }

            if (e.layerType === 'polyline') {
              const latlngs = layer.getLatLngs();

              if (latlngs.length >= 2) {
                let distanciaTotalMetros = 0;

                for (let i = 0; i < latlngs.length - 1; i++) {
                  distanciaTotalMetros += latlngs[i].distanceTo(latlngs[i + 1]);
                }

                const distanciaKm = (distanciaTotalMetros / 1000).toFixed(2);

                layer.bindPopup(`Distancia: ${distanciaKm} km`).openPopup();

              }

            }
            if (e.layerType === "polygon") {
              const latlngs = layer.getLatLngs()[0]; // vértices

              layer.bindPopup("Cargando...").openPopup();

              // 🔥 aquí llamamos a la función
              getPointsInPolygon(puntos, latlngs, layer);
            }
          }}
        />
      </FeatureGroup>
    </>
  )
}