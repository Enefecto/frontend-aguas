import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export const ModalDetalles = ({ isOpen, onClose, titulo, datos }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Bloquear scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    } else {
      // Restaurar scroll del body cuando el modal se cierra
      document.body.style.overflow = 'unset';
    }

    // Cleanup al desmontar
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isOpen) return null;

  const formatFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace('.', '');
  };

  const modalContent = (
    <>
      {/* Backdrop fijo - Portal al top level */}
      <div
        className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-4"
        style={{
          zIndex: 9999,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          opacity: isAnimating ? 1 : 0,
          transition: 'opacity 300ms ease-in-out'
        }}
        onClick={handleClose}
      >
        {/* Modal - Siempre centrado con scroll interno */}
        <div
          className="relative bg-white rounded-xl shadow-2xl w-full p-6"
          style={{
            maxWidth: '28rem',
            maxHeight: '90vh',
            overflowY: 'auto',
            transform: isAnimating ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(1rem)',
            transition: 'transform 300ms ease-in-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
        {/* Botón cerrar */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-all duration-200 cursor-pointer"
          aria-label="Cerrar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Título */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 pr-8">
          {titulo}
        </h3>

        {/* Periodo de análisis */}
        <div className="bg-gray-100 rounded-lg p-3 mb-4">
          <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Periodo de Análisis</p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">
              {formatFecha(datos.primera_fecha)}
            </p>
            <span className="text-gray-400">→</span>
            <p className="text-sm font-semibold text-gray-900">
              {formatFecha(datos.ultima_fecha)}
            </p>
          </div>
        </div>

        {/* Contenido */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Total Registros</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {datos.total_registros?.toLocaleString('es-CL') || '-'}
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">Promedio</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {datos.promedio != null ? new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(datos.promedio) : '-'}
              </p>
            </div>

            <div className="bg-yellow-50 rounded-lg p-3">
              <p className="text-xs text-yellow-700 font-semibold uppercase tracking-wide">Mínimo</p>
              <p className="text-2xl font-bold text-yellow-900 mt-1">
                {datos.minimo != null ? new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(datos.minimo) : '-'}
              </p>
            </div>

            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-xs text-red-600 font-semibold uppercase tracking-wide">Máximo</p>
              <p className="text-2xl font-bold text-red-900 mt-1">
                {datos.maximo != null ? new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(datos.maximo) : '-'}
              </p>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide">Desviación Estándar</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">
              {datos.desviacion_estandar != null ? new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(datos.desviacion_estandar) : '-'}
            </p>
          </div>
        </div>

        {/* Botón cerrar inferior */}
        <button
          onClick={handleClose}
          className="mt-6 w-full bg-cyan-700 hover:bg-cyan-600 active:bg-cyan-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
        >
          Cerrar
        </button>
        </div>
      </div>
    </>
  );

  // Usar Portal para renderizar el modal fuera del árbol DOM del sidebar
  return createPortal(modalContent, document.body);
};
