import { FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { getPointsInPolygon } from '../Popups/PopupPuntosInPersonalizado';
import { getPointsInCircle } from '../Popups/PopupPuntosInCircle';

import L from "leaflet";
import "leaflet-draw";

export const ToolsEditControl = ({puntos}) => {

   // 🔹 Sobrescribir textos de la barra de dibujo y edición
  L.drawLocal.draw.toolbar.buttons.polyline = "Dibujar línea";
  L.drawLocal.draw.toolbar.buttons.polygon = "Dibujar área";
  L.drawLocal.draw.toolbar.buttons.circle = "Dibujar círculo";
  L.drawLocal.draw.toolbar.buttons.rectangle = "Dibujar rectángulo";
  L.drawLocal.draw.toolbar.buttons.marker = "Agregar marcador";
  L.drawLocal.draw.toolbar.buttons.circlemarker = "Agregar círculo marcador";

  L.drawLocal.draw.toolbar.actions = {
    title: 'Cancelar dibujo',
    text: 'Cancelar',
    undo: { title: 'Eliminar último punto', text: 'Deshacer último punto' }
  };

  L.drawLocal.draw.toolbar.finish = {
    title: 'Finalizar dibujo',
    text: 'Finalizar'
  };

  // 🔹 Textos de los tooltips durante el dibujo (cerca del cursor)
  L.drawLocal.draw.handlers = {
    polyline: {
      tooltip: {
        start: 'Haz clic para comenzar a dibujar una línea',
        cont: 'Haz clic para continuar dibujando la línea',
        end: 'Haz doble clic para finalizar'
      },
      actions: {
        finish: { title: 'Finalizar dibujo', text: 'Finalizar' },
        undo: { title: 'Eliminar último punto', text: 'Deshacer último punto' },
        cancel: { title: 'Cancelar dibujo', text: 'Cancelar' }
      }
    },
    polygon: {
      tooltip: {
        start: 'Haz clic para comenzar a dibujar un área',
        cont: 'Haz clic para continuar dibujando',
        end: 'Haz clic en el primer punto para cerrar el área'
      },
      actions: {
        finish: { title: 'Finalizar dibujo', text: 'Finalizar' },
        undo: { title: 'Eliminar último punto', text: 'Deshacer último punto' },
        cancel: { title: 'Cancelar dibujo', text: 'Cancelar' }
      }
    },
    rectangle: {
      tooltip: { start: 'Haz click y arrastra para dibujar un rectángulo' }
    },
    circle: {
      tooltip: { start: 'Haz click y arrastra para dibujar un círculo' },
      radius: 'Radio'
    },
    marker: {
      tooltip: { start: 'Haz click en el mapa para colocar un marcador' }
    },
    circlemarker: {
      tooltip: { start: 'Haz click en el mapa para colocar un círculo marcador' }
    },
    simpleshape: {
      tooltip: { end: 'Suelta el mouse para finalizar el dibujo' }
    }
  };

  // 🔹 Textos de la edición
  L.drawLocal.edit.toolbar.buttons.edit = "Editar capas";
  L.drawLocal.edit.toolbar.buttons.editDisabled = "No hay capas para editar";
  L.drawLocal.edit.toolbar.buttons.remove = "Eliminar capas";
  L.drawLocal.edit.toolbar.buttons.removeDisabled = "No hay capas para eliminar";

  L.drawLocal.edit.toolbar.actions = {
    save: { title: "Guardar cambios", text: "Guardar" },
    cancel: { title: "Cancelar edición", text: "Cancelar" },
    clearAll: { title: "Eliminar todas las capas", text: "Eliminar todo" },
    undo: { title: "Deshacer", text: "Deshacer último punto" }
  };

  L.drawLocal.edit.handlers.edit.tooltip = {
    text: "Arrastra los marcadores para editar",
    subtext: 'Haz click en "Cancelar" para deshacer los cambios'
  };

  L.drawLocal.edit.handlers.remove.tooltip = {
    text: "Haz click en un marcador para eliminarlo"
  };

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