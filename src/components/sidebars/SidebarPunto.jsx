import React from 'react';
import { TrophySpin, Slab } from 'react-loading-indicators';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ButtonOpenCloseSidebar } from '../Buttons/ButtonOpenCloseSidebar';

export default function SidebarPunto({
  analisisPuntoSeleccionado,
  analisisPuntoSeleccionadoLoading,
  graphicsPuntosLoading,
  graficosPuntosData,
  loadPuntosGraphics,
  setRightSidebarAbiertoPunto
}) {
  return (
    <div className="absolute right-0 top-0 z-[1000] h-full bg-white shadow-md text-sm p-8 space-y-6 overflow-y-auto" style={{ width: '45rem', maxHeight: '100vh' }}>
      <ButtonOpenCloseSidebar toggleSidebar={setRightSidebarAbiertoPunto} />

      <h2 className="text-2xl font-bold border-b pb-2 mt-2">Análisis del punto</h2>

      <h3 className="text-lg font-semibold">
        Punto: <span className="text-cyan-800 font-bold">{analisisPuntoSeleccionado.utm_norte} - {analisisPuntoSeleccionado.utm_este}</span>
      </h3>

      {!analisisPuntoSeleccionadoLoading ? (
        <div className="space-y-4 pt-2">
          <h3 className="text-base font-semibold text-gray-700">Análisis Estadístico</h3>
          <div className="grid grid-cols-1 gap-4">
            {[
              ['Total de registros con caudal', 'total_registros_con_caudal', 'text-blue-800', 'bg-blue-50'],
              ['Caudal promedio (m³/s)', 'caudal_promedio', 'text-green-800', 'bg-green-50'],
              ['Caudal mínimo (m³/s)', 'caudal_minimo', 'text-yellow-800', 'bg-yellow-50'],
              ['Caudal máximo (m³/s)', 'caudal_maximo', 'text-red-800', 'bg-red-50'],
              ['Desviación estándar del caudal', 'desviacion_estandar_caudal', 'text-purple-800', 'bg-purple-50']
            ].map(([label, key, textColor, bgColor]) => (
              <div className={`${bgColor} p-4 rounded shadow-sm`} key={key}>
                <p className="text-gray-500 text-xs">{label}</p>
                <p className={`${textColor} font-extrabold text-xl`}>
                  {analisisPuntoSeleccionado[key] != null
                    ? Number(analisisPuntoSeleccionado[key].toFixed(2)).toLocaleString()
                    : '-'}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2 mt-16 mx-auto flex justify-center">
          <TrophySpin color="#155e75" size="large" text="Cargando..." textColor="#000000" />
        </div>
      )}

      {graphicsPuntosLoading === 0 && (
        <button
          onClick={() => loadPuntosGraphics(analisisPuntoSeleccionado.utm_norte, analisisPuntoSeleccionado.utm_este)}
          className="block mt-6 bg-cyan-700 text-white font-semibold px-4 py-2 rounded cursor-pointer hover:bg-cyan-600 transition"
        >
          Cargar Gráficos
        </button>
      )}

      {graphicsPuntosLoading === 1 && (
        <div className="space-y-2 mt-16 mx-auto flex justify-center">
          <Slab color="#155e75" size="large" text="Cargando..." textColor="#000000" />
        </div>
      )}

      {graphicsPuntosLoading === 2 && (
        <div className="space-y-10 mt-6 border-t pt-6">
          <h3 className="text-lg font-semibold">Gráficos</h3>
          <div className="w-full h-96">
            <h4 className="text-sm font-semibold mb-1 text-gray-700">Caudal por tiempo</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graficosPuntosData.caudal_por_tiempo}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="fecha_medicion"
                  tickFormatter={(str) => new Date(str).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit' })}
                  minTickGap={30}
                />
                <YAxis domain={['dataMin - 0.01', 'dataMax + 0.01']} />
                <Tooltip
                  labelFormatter={(label) => new Date(label).toLocaleString('es-CL')}
                  formatter={(value) => [`${value} m³/s`, 'Caudal']}
                />
                <Line type="monotone" dataKey="caudal" stroke="#2563eb" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
