import React, { useState, useEffect, useRef } from 'react';

export const ComparePointsSelector = ({ selectedPoints, onPointSelect, onCompare, isSelectingPoint }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef(null);

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isExpanded]);

  const handleSelectSlot = (slotIndex) => {
    onPointSelect(slotIndex, 'select'); // Indicar que se quiere seleccionar
  };

  const handleRemovePoint = (slotIndex) => {
    onPointSelect(slotIndex, null); // Remover punto
  };

  const canCompare = selectedPoints[0] && selectedPoints[1];

  return (
    <div
      ref={containerRef}
      className="absolute right-4 z-[1100] max-h-[700px]:top-[180px]"
      style={{top: '380px', right: '4px'}}
    >
      {/* Botón compacto inicial */}
      <div
        className="relative"
        onMouseEnter={() => !isExpanded && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            w-12 h-12 bg-white shadow-lg border border-gray-300 rounded-lg
            flex items-center justify-center transition-all duration-300 group
            hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer
            ${isExpanded ? 'bg-cyan-50 border-cyan-200 shadow-cyan-100' : 'hover:bg-gray-50'}
          `}
        >
          {/* Icono de comparación */}
          <div className="relative">
            <svg className="w-6 h-6 text-gray-600 group-hover:text-gray-800" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19,3H14V5H19V18L14,12V21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M10,18H5L10,12M10,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H10V23H12V1H10V3Z"/>
            </svg>

            {/* Badge con número de puntos seleccionados */}
            {(selectedPoints[0] || selectedPoints[1]) && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full shadow-sm flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">
                  {(selectedPoints[0] ? 1 : 0) + (selectedPoints[1] ? 1 : 0)}
                </span>
              </div>
            )}

            {/* Indicador de expansión */}
            {isExpanded && (
              <div className="absolute inset-0 bg-cyan-400 rounded-full animate-ping opacity-20"></div>
            )}
          </div>
        </button>

        {/* Tooltip para botón compacto */}
        {showTooltip && !isExpanded && (
          <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 z-[1000]">
            <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
              Comparar puntos
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-t-2 border-b-2 border-t-transparent border-b-transparent"></div>
            </div>
          </div>
        )}
      </div>

      {/* Panel expandido */}
      {isExpanded && (
        <div className="compare-panel-container absolute left-1/2 transform -translate-x-1/2 z-[1000]">
          <div className="bg-white shadow-xl rounded-lg border border-gray-200 overflow-hidden w-[280px] animate-fadeInScale">
            {/* Encabezado */}
            <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 px-4 py-3 border-b border-cyan-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-cyan-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19,3H14V5H19V18L14,12V21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M10,18H5L10,12M10,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H10V23H12V1H10V3Z"/>
                  </svg>
                  <span className="text-sm font-medium text-cyan-800">Comparar Puntos</span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-cyan-600 hover:text-cyan-800 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Slots de puntos */}
            <div className="p-4 space-y-3">
              {/* Punto 1 */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">Punto 1</label>
                <div
                  onClick={() => !selectedPoints[0] && handleSelectSlot(0)}
                  className={`
                    border-2 border-dashed rounded-lg p-4 transition-all cursor-pointer
                    ${selectedPoints[0]
                      ? 'border-blue-300 bg-blue-50'
                      : isSelectingPoint === 0
                        ? 'border-cyan-400 bg-cyan-50 animate-pulse'
                        : 'border-gray-300 bg-gray-50 hover:border-cyan-300 hover:bg-cyan-50'
                    }
                  `}
                >
                  {selectedPoints[0] ? (
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-blue-800">
                            Código: {selectedPoints[0].codigo}
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            Lat: {selectedPoints[0].lat?.toFixed(6)}
                          </div>
                          <div className="text-xs text-blue-600">
                            Lon: {selectedPoints[0].lon?.toFixed(6)}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePoint(0);
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : isSelectingPoint === 0 ? (
                    <div className="text-center text-cyan-600 text-sm font-medium">
                      Haz click en un punto del mapa...
                    </div>
                  ) : (
                    <div className="text-center">
                      <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <div className="text-xs text-gray-500 font-medium">Click para elegir punto</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Punto 2 */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">Punto 2</label>
                <div
                  onClick={() => !selectedPoints[1] && handleSelectSlot(1)}
                  className={`
                    border-2 border-dashed rounded-lg p-4 transition-all cursor-pointer
                    ${selectedPoints[1]
                      ? 'border-orange-300 bg-orange-50'
                      : isSelectingPoint === 1
                        ? 'border-cyan-400 bg-cyan-50 animate-pulse'
                        : 'border-gray-300 bg-gray-50 hover:border-cyan-300 hover:bg-cyan-50'
                    }
                  `}
                >
                  {selectedPoints[1] ? (
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-orange-800">
                            Código: {selectedPoints[1].codigo}
                          </div>
                          <div className="text-xs text-orange-600 mt-1">
                            Lat: {selectedPoints[1].lat?.toFixed(6)}
                          </div>
                          <div className="text-xs text-orange-600">
                            Lon: {selectedPoints[1].lon?.toFixed(6)}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePoint(1);
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : isSelectingPoint === 1 ? (
                    <div className="text-center text-cyan-600 text-sm font-medium">
                      Haz click en un punto del mapa...
                    </div>
                  ) : (
                    <div className="text-center">
                      <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <div className="text-xs text-gray-500 font-medium">Click para elegir punto</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón de comparar */}
              <button
                onClick={() => {
                  if (canCompare) {
                    onCompare();
                  }
                }}
                disabled={!canCompare}
                className={`
                  w-full py-3 rounded-lg font-medium text-sm transition-all
                  ${canCompare
                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700 shadow-md hover:shadow-lg cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {canCompare ? 'Comparar puntos' : 'Selecciona ambos puntos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos de animación */}
      <style jsx="true">{`
        /* Posicionamiento del panel por defecto (hacia abajo) */
        .compare-panel-container {
          top: 100%;
          margin-top: 8px;
        }

        /* En pantallas con altura menor a 800px, abrir hacia arriba */
        @media (max-height: 800px) {
          .compare-panel-container {
            bottom: 100%;
            top: auto;
            margin-top: 0;
            margin-bottom: 8px;
          }
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: translateX(-50%) scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) scale(1) translateY(0);
          }
        }
        .animate-fadeInScale {
          animation: fadeInScale 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
