import React, { useState, useEffect, useRef } from 'react';
import { MAP_CONFIG } from '../../constants/mapConfig.js';

export const LayerSelector = ({ currentLayer, onLayerChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef(null);

  // Detectar click fuera para cerrar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

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

  const handleLayerSelect = (layerKey) => {
    onLayerChange(layerKey);
    setIsExpanded(false);
  };

  const currentLayerData = MAP_CONFIG.TILE_LAYERS[currentLayer];

  return (
    <div
      ref={containerRef}
      className="absolute right-4 z-[999]"
      style={{top: '320px', right: '4px'}}
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
            hover:shadow-xl hover:scale-105 active:scale-95
            ${isExpanded ? 'bg-cyan-50 border-cyan-200 shadow-cyan-100' : 'hover:bg-gray-50'}
          `}
        >
          {/* Icono de capas con indicador del tipo actual */}
          <div className="relative">
            <svg className="w-6 h-6 text-gray-600 group-hover:text-gray-800" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,16L19.36,10.27L21,9L12,2L3,9L4.63,10.27M12,18.54L4.62,12.81L3,14.07L12,21.07L21,14.07L19.37,12.8"/>
            </svg>

            {/* Mini indicador del tipo actual */}
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full shadow-sm flex items-center justify-center">
              {currentLayer === 'OPENSTREETMAP' ? (
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15,19L9,16.89V5L15,7.11"/>
                </svg>
              ) : (
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </div>

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
              Cambiar vista del mapa
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-t-2 border-b-2 border-t-transparent border-b-transparent"></div>
            </div>
          </div>
        )}
      </div>

      {/* Panel expandido */}
      {isExpanded && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-[1000]">
          <div className="bg-white shadow-xl rounded-lg border border-gray-200 overflow-hidden min-w-[200px] animate-fadeInScale">
            {/* Encabezado */}
            <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 px-4 py-3 border-b border-cyan-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-cyan-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12,16L19.36,10.27L21,9L12,2L3,9L4.63,10.27M12,18.54L4.62,12.81L3,14.07L12,21.07L21,14.07L19.37,12.8"/>
                  </svg>
                  <span className="text-sm font-medium text-cyan-800">Vista del Mapa</span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-cyan-600 hover:text-cyan-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Opciones de capas */}
            <div className="py-2">
              {Object.entries(MAP_CONFIG.TILE_LAYERS).map(([key, layer], index) => (
                <button
                  key={key}
                  onClick={() => handleLayerSelect(key)}
                  className={`
                    w-full px-4 py-3 flex items-center space-x-3 transition-all duration-200 group
                    ${currentLayer === key
                      ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100'
                    }
                  `}
                >
                  {/* Icono */}
                  <div className={`
                    flex-shrink-0 p-2 rounded-lg transition-all duration-200
                    ${currentLayer === key
                      ? 'bg-white/20'
                      : 'bg-gray-100 group-hover:bg-gray-200'
                    }
                  `}>
                    {key === 'OPENSTREETMAP' ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M15,19L9,16.89V5L15,7.11M20.5,3C20.44,3 20.39,3 20.28,3L15,5.1L9,3L3.36,4.9C3.15,4.97 3,5.15 3,5.38V20.5A0.5,0.5 0 0,0 3.5,21C3.55,21 3.61,21 3.72,20.95L9,18.9L15,21L20.64,19.1C20.85,19 21,18.85 21,18.62V3.5A0.5,0.5 0 0,0 20.5,3Z"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,2A7,7 0 0,1 19,9C19,14.25 12,22 12,22C12,22 5,14.25 5,9A7,7 0 0,1 12,2M12,4A5,5 0 0,0 7,9C7,12 10.5,16.78 12,18.5C13.5,16.78 17,12 17,9A5,5 0 0,0 12,4M12,7A2,2 0 0,1 14,9A2,2 0 0,1 12,11A2,2 0 0,1 10,9A2,2 0 0,1 12,7Z"/>
                      </svg>
                    )}
                  </div>

                  {/* Texto */}
                  <div className="flex-1 text-left">
                    <div className={`
                      text-sm font-medium
                      ${currentLayer === key ? 'text-white' : 'text-gray-800 group-hover:text-gray-900'}
                    `}>
                      {layer.name}
                    </div>
                    <div className={`
                      text-xs
                      ${currentLayer === key ? 'text-cyan-100' : 'text-gray-500 group-hover:text-gray-600'}
                    `}>
                      {key === 'OPENSTREETMAP' ? 'Mapa de calles' : 'Vista satelital'}
                    </div>
                  </div>

                  {/* Indicador de selección */}
                  {currentLayer === key && (
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Estilos de animación */}
      <style jsx>{`
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