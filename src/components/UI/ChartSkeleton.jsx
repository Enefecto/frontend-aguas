import React from 'react';

export const ChartSkeleton = ({ title, type = "line" }) => {
  return (
    <div className="w-full h-[260px] md:h-80 lg:h-96 animate-pulse">
      <div className="flex justify-between items-center mb-1">
        <div className="h-4 bg-gray-300 rounded w-32"></div>
        {title === "Caudal mensual" && (
          <div className="h-3 bg-gray-200 rounded w-48"></div>
        )}
      </div>

      <div className="w-full h-full bg-gray-100 rounded-lg border relative overflow-hidden">
        {/* Simulación de ejes */}
        <div className="absolute bottom-0 left-0 w-full h-px bg-gray-300"></div>
        <div className="absolute bottom-0 left-0 w-px h-full bg-gray-300"></div>

        {/* Simulación de líneas de grid */}
        <div className="absolute inset-0 flex flex-col justify-between py-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-full h-px bg-gray-200 opacity-50"></div>
          ))}
        </div>

        {type === "line" ? (
          /* Simulación de líneas de gráfico */
          <div className="absolute inset-4">
            <svg className="w-full h-full">
              <path
                d="M10,80 Q50,60 90,70 T170,50 Q210,40 250,45 T330,35"
                stroke="#0ea5e9"
                strokeWidth="2"
                fill="none"
                className="opacity-30"
              />
              <path
                d="M10,90 Q50,85 90,88 T170,75 Q210,70 250,72 T330,65"
                stroke="#f97316"
                strokeWidth="2"
                fill="none"
                className="opacity-30"
              />
              <path
                d="M10,60 Q50,40 90,45 T170,25 Q210,20 250,22 T330,15"
                stroke="#2563eb"
                strokeWidth="2"
                fill="none"
                className="opacity-30"
              />
            </svg>
          </div>
        ) : (
          /* Simulación de barras de gráfico */
          <div className="absolute bottom-8 left-8 right-8 flex items-end space-x-2">
            {[40, 60, 35, 80, 25, 70, 45, 55, 90, 30].map((height, i) => (
              <div
                key={i}
                className="bg-gray-300 opacity-30 rounded-t"
                style={{ height: `${height}%`, width: '8%' }}
              ></div>
            ))}
          </div>
        )}

        {/* Indicador de carga */}
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70">
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600"></div>
            <span className="text-sm font-medium">Cargando {title || 'gráfico'}...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GraphicsLoadingSkeleton = () => {
  return (
    <div className="space-y-10 mt-6 border-t pt-6">
      <h3 className="text-lg font-semibold">Gráficos</h3>

      {/* LineChart mensual skeleton */}
      <ChartSkeleton title="Caudal mensual" type="line" />

      {/* LineChart diario skeleton */}
      <div className="w-full h-[260px] md:h-80 lg:h-96 mt-18 animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-48 mb-1"></div>
        <div className="w-full h-full bg-gray-100 rounded-lg border relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-full h-px bg-gray-300"></div>
          <div className="absolute bottom-0 left-0 w-px h-full bg-gray-300"></div>
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70">
            <div className="flex items-center space-x-2 text-gray-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">Selecciona un mes en el gráfico superior</span>
            </div>
          </div>
        </div>
      </div>

      {/* BarChart skeletons */}
      <ChartSkeleton title="Registros por Informante" type="bar" />
      <ChartSkeleton title="Caudal Total Extraído" type="bar" />
      <ChartSkeleton title="Obras Únicas por Informante" type="bar" />
    </div>
  );
};

export const PuntoGraphicsLoadingSkeleton = () => {
  return (
    <div className="space-y-10 mt-6 border-t pt-6">
      <h3 className="text-lg font-semibold">Gráficos</h3>

      {/* Gráfico de series temporales de caudal */}
      <div className="w-full h-[260px] md:h-80 lg:h-96 animate-pulse">
        <div className="flex justify-between items-center mb-1">
          <div className="h-4 bg-gray-300 rounded w-40"></div>
        </div>

        <div className="w-full h-full bg-gray-100 rounded-lg border relative overflow-hidden">
          {/* Simulación de ejes */}
          <div className="absolute bottom-0 left-0 w-full h-px bg-gray-300"></div>
          <div className="absolute bottom-0 left-16 w-px h-full bg-gray-300"></div>

          {/* Simulación de líneas de grid */}
          <div className="absolute inset-0 flex flex-col justify-between py-4 pl-16">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-full h-px bg-gray-200 opacity-50"></div>
            ))}
          </div>

          {/* Simulación de línea de tiempo */}
          <div className="absolute inset-4 pl-12">
            <svg className="w-full h-full">
              <path
                d="M0,60 Q30,45 60,50 T120,40 Q150,35 180,38 T240,30 Q270,25 300,28 T360,20 Q390,15 420,18"
                stroke="#2563eb"
                strokeWidth="2"
                fill="none"
                className="opacity-30"
              />
              {/* Puntos de datos */}
              {[0, 60, 120, 180, 240, 300, 360, 420].map((x, i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={[60, 50, 40, 38, 30, 28, 20, 18][i]}
                  r="2"
                  fill="#2563eb"
                  className="opacity-30"
                />
              ))}
            </svg>
          </div>

          {/* Simulación de etiquetas de eje X (fechas) */}
          <div className="absolute bottom-2 left-16 right-4 flex justify-between text-xs text-gray-400">
            <div className="h-3 bg-gray-300 rounded w-12 opacity-50"></div>
            <div className="h-3 bg-gray-300 rounded w-12 opacity-50"></div>
            <div className="h-3 bg-gray-300 rounded w-12 opacity-50"></div>
            <div className="h-3 bg-gray-300 rounded w-12 opacity-50"></div>
          </div>

          {/* Simulación de etiquetas de eje Y (valores) */}
          <div className="absolute left-2 top-4 bottom-8 flex flex-col justify-between text-xs text-gray-400">
            <div className="h-3 bg-gray-300 rounded w-8 opacity-50"></div>
            <div className="h-3 bg-gray-300 rounded w-8 opacity-50"></div>
            <div className="h-3 bg-gray-300 rounded w-8 opacity-50"></div>
            <div className="h-3 bg-gray-300 rounded w-8 opacity-50"></div>
            <div className="h-3 bg-gray-300 rounded w-8 opacity-50"></div>
          </div>

          {/* Indicador de carga */}
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70">
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600"></div>
              <span className="text-sm font-medium">Cargando series de tiempo...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};