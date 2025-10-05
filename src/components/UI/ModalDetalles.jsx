import { useEffect, useState } from 'react';

export const ModalDetalles = ({ isOpen, onClose, titulo, datos }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
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

  return (
    <div
      className={`fixed inset-0 z-[2000] flex items-center justify-center transition-opacity duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      {/* Backdrop semi-transparente */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }} />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 transform transition-all duration-300 ${
          isAnimating ? 'scale-100' : 'scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
          className="mt-6 w-full bg-cyan-700 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded transition-colors cursor-pointer"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
