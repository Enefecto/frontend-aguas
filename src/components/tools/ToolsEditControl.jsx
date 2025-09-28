import React, { useEffect, useState } from 'react';
import { FeatureGroup } from 'react-leaflet';
import { getPointsInPolygon } from '../Popups/PopupPuntosInPersonalizado';
import { getPointsInCircle } from '../Popups/PopupPuntosInCircle';

export const ToolsEditControl = ({apiUrl,puntos}) => {
  const [EditControl, setEditControl] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadEditControl = async () => {
      if (typeof window !== 'undefined' && window.L) {
        try {
          // Cargar react-leaflet-draw dinámicamente
          const { EditControl: EC } = await import('react-leaflet-draw');

          if (isMounted) {
            // Configurar textos básicos de Leaflet Draw
            const L = window.L;

            // Solo modificar textos específicos sin sobrescribir objetos completos
            if (L.drawLocal && L.drawLocal.draw) {
              // Botones de la barra de herramientas
              if (L.drawLocal.draw.toolbar && L.drawLocal.draw.toolbar.buttons) {
                L.drawLocal.draw.toolbar.buttons.polyline = "Calcular Distancia";
                L.drawLocal.draw.toolbar.buttons.polygon = "Crear Área Personalizada";
                L.drawLocal.draw.toolbar.buttons.circle = "Crear círculo";
              }

              // Acciones generales
              if (L.drawLocal.draw.toolbar && L.drawLocal.draw.toolbar.actions) {
                L.drawLocal.draw.toolbar.actions.title = 'Cancelar dibujo';
                L.drawLocal.draw.toolbar.actions.text = 'Cancelar';
              }

              if (L.drawLocal.draw.toolbar && L.drawLocal.draw.toolbar.finish) {
                L.drawLocal.draw.toolbar.finish.title = 'Finalizar dibujo';
                L.drawLocal.draw.toolbar.finish.text = 'Finalizar';
              }

              // Tooltips durante el dibujo (sin sobrescribir handlers completos)
              if (L.drawLocal.draw.handlers) {
                if (L.drawLocal.draw.handlers.polyline && L.drawLocal.draw.handlers.polyline.tooltip) {
                  L.drawLocal.draw.handlers.polyline.tooltip.start = 'Haz clic para comenzar a dibujar una línea';
                  L.drawLocal.draw.handlers.polyline.tooltip.cont = 'Haz clic para continuar dibujando la línea';
                  L.drawLocal.draw.handlers.polyline.tooltip.end = 'Haz doble clic para finalizar';
                }

                if (L.drawLocal.draw.handlers.polygon && L.drawLocal.draw.handlers.polygon.tooltip) {
                  L.drawLocal.draw.handlers.polygon.tooltip.start = 'Haz clic para comenzar a dibujar un área';
                  L.drawLocal.draw.handlers.polygon.tooltip.cont = 'Haz clic para continuar dibujando';
                  L.drawLocal.draw.handlers.polygon.tooltip.end = 'Haz clic en el primer punto para cerrar el área';
                }

                if (L.drawLocal.draw.handlers.circle && L.drawLocal.draw.handlers.circle.tooltip) {
                  L.drawLocal.draw.handlers.circle.tooltip.start = 'Haz clic y arrastra para dibujar un círculo';
                }

                if (L.drawLocal.draw.handlers.circle) {
                  L.drawLocal.draw.handlers.circle.radius = 'Radio';
                }

                if (L.drawLocal.draw.handlers.simpleshape && L.drawLocal.draw.handlers.simpleshape.tooltip) {
                  L.drawLocal.draw.handlers.simpleshape.tooltip.end = 'Suelta el mouse para finalizar el dibujo';
                }
              }
            }

            // Textos de edición
            if (L.drawLocal && L.drawLocal.edit) {
              if (L.drawLocal.edit.toolbar && L.drawLocal.edit.toolbar.buttons) {
                L.drawLocal.edit.toolbar.buttons.edit = "Editar capas";
                L.drawLocal.edit.toolbar.buttons.editDisabled = "No hay capas para editar";
                L.drawLocal.edit.toolbar.buttons.remove = "Eliminar capas";
                L.drawLocal.edit.toolbar.buttons.removeDisabled = "No hay capas para eliminar";
              }

              if (L.drawLocal.edit.toolbar && L.drawLocal.edit.toolbar.actions) {
                L.drawLocal.edit.toolbar.actions.save = { title: "Guardar cambios", text: "Guardar" };
                L.drawLocal.edit.toolbar.actions.cancel = { title: "Cancelar edición", text: "Cancelar" };
                L.drawLocal.edit.toolbar.actions.clearAll = { title: "Eliminar todas las capas", text: "Eliminar todo" };
              }

              if (L.drawLocal.edit.handlers) {
                if (L.drawLocal.edit.handlers.edit && L.drawLocal.edit.handlers.edit.tooltip) {
                  L.drawLocal.edit.handlers.edit.tooltip.text = "Arrastra los marcadores para editar";
                  L.drawLocal.edit.handlers.edit.tooltip.subtext = 'Haz clic en "Cancelar" para deshacer los cambios';
                }

                if (L.drawLocal.edit.handlers.remove && L.drawLocal.edit.handlers.remove.tooltip) {
                  L.drawLocal.edit.handlers.remove.tooltip.text = "Haz clic en un marcador para eliminarlo";
                }
              }
            }

            setEditControl(() => EC);
            setIsReady(true);
          }
        } catch (error) {
          console.error('Error loading EditControl:', error);
        }
      }
    };

    // Intentar cargar con un pequeño delay para asegurar que leaflet esté listo
    const timer = setTimeout(loadEditControl, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Interceptar textos de Leaflet Draw en DOM
  useEffect(() => {
    if (isReady) {
      const replaceTexts = (node = document.body) => {
        // Reemplazar textos en nodos de texto
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        let textNode;
        while (textNode = walker.nextNode()) {
          if (/Delete Last Point|Delete last point|Undo last point/i.test(textNode.textContent)) {
            textNode.textContent = textNode.textContent.replace(
              /Delete Last Point|Delete last point|Undo last point/gi,
              'Eliminar último punto'
            );
          }
        }

        // Reemplazar en atributos title
        const elementsWithTitle = node.querySelectorAll ?
          node.querySelectorAll('[title*="Delete"], [title*="Undo"]') :
          [];
        elementsWithTitle.forEach(el => {
          if (el.title && /Delete|Undo/i.test(el.title)) {
            el.title = el.title.replace(
              /Delete Last Point|Delete last point|Undo last point/gi,
              'Eliminar último punto'
            );
          }
        });
      };

      // MutationObserver para nuevos elementos
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              replaceTexts(node);
            }
          });
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });

      // Ejecutar reemplazo inicial y con delays
      replaceTexts();
      setTimeout(replaceTexts, 100);
      setTimeout(replaceTexts, 500);

      return () => observer.disconnect();
    }
  }, [isReady]);

  if (!isReady || !EditControl) {
    return <FeatureGroup />;
  }

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
              shapeOptions: { color: '#1d4ed8', weight: 4 },
              maxPoints: 2 // 🔑 Limitar a solo 2 puntos
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
              const L = window.L;

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
              getPointsInCircle(apiUrl,puntos, center, radius, layer);

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
              getPointsInPolygon(apiUrl, puntos, latlngs, layer);
            }
          }}
        />
      </FeatureGroup>
    </>
  )
}