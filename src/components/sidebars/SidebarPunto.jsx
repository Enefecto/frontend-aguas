import { TrophySpin, Slab } from 'react-loading-indicators';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ButtonOpenCloseSidebar } from '../Buttons/ButtonOpenCloseSidebar';
import { EstadisticBox } from '../UI/EstadisticBox';

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
    
            <EstadisticBox boxcolor="blue" label="Total de registros con caudal" value={analisisPuntoSeleccionado.total_registros_con_caudal} />
            <EstadisticBox boxcolor="green" label="Caudal promedio (m³/s)" value={analisisPuntoSeleccionado.caudal_promedio} />
            <EstadisticBox boxcolor="yellow" label="Caudal mínimo (m³/s)" value={analisisPuntoSeleccionado.caudal_minimo} />
            <EstadisticBox boxcolor="red" label="Caudal máximo (m³/s)" value={analisisPuntoSeleccionado.caudal_maximo} />
            <EstadisticBox boxcolor="purple" label="Desviación estándar del caudal" value={analisisPuntoSeleccionado.desviacion_estandar_caudal} />
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
