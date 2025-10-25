export const EstadisticBox = ({ boxcolor = 'blue', label, value }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-800',
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-800',
    },
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-800',
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-800',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-800',
    },
    gray: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
    },
  };

  const { bg, text } = colorClasses[boxcolor] || colorClasses.gray;

  // Función para formatear el número
  const formatNumber = (num) => {
    // Solo mostrar '-' si es null o undefined, no si es 0
    if (num === null || num === undefined) return '-';
    return num.toLocaleString('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className={`${bg} p-4 rounded shadow-sm`}>
      <p className="text-gray-500 text-xs">{label}</p>
      <p className={`${text} font-extrabold text-xl`}>
        {formatNumber(value)}
      </p>
    </div>
  );
};
