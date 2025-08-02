import { TrophySpin, Slab } from 'react-loading-indicators';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ButtonOpenCloseSidebar } from '../Buttons/ButtonOpenCloseSidebar';
import { EstadisticBox } from '../UI/EstadisticBox';

export default function SidebarCuenca({
  cuencaAnalysis,
  cuencaLoading,
  graphicsCuencasLoading,
  graficosData,
  setRightSidebarAbiertoCuencas,
  loadCuencasGraphics
}) {
  return (
    <div
      className="absolute right-0 top-0 z-[1000] h-full bg-white shadow-md text-sm p-8 space-y-6 overflow-y-auto"
      style={{ width: '45rem', maxHeight: '100vh' }}
    >

      <ButtonOpenCloseSidebar toggleSidebar={setRightSidebarAbiertoCuencas}/>

      <h2 className="text-2xl font-bold border-b pb-2 mt-2">Análisis de Cuenca</h2>

      <h3 className="text-lg font-semibold">
        Cuenca: <span className="text-cyan-800 font-bold">{cuencaAnalysis.nombreCuenca}</span>
      </h3>

      {!cuencaLoading ? (
        <div className="space-y-4 pt-2">
          <h3 className="text-base font-semibold text-gray-700">Análisis Estadístico</h3>

          <div className="grid grid-cols-1 gap-4">

            <EstadisticBox boxcolor="blue" label="Total de registros con caudal" value={cuencaAnalysis.total_registros_con_caudal} />
            <EstadisticBox boxcolor="green" label="Caudal promedio (m³/s)" value={cuencaAnalysis.caudal_promedio} />
            <EstadisticBox boxcolor="yellow" label="Caudal mínimo (m³/s)" value={cuencaAnalysis.caudal_minimo} />
            <EstadisticBox boxcolor="red" label="Caudal máximo (m³/s)" value={cuencaAnalysis.caudal_maximo} />
            <EstadisticBox boxcolor="purple" label="Desviación estándar del caudal" value={cuencaAnalysis.desviacion_estandar_caudal} />

          </div>
        </div>
      ) : (
        <div className="space-y-2 mt-16 mx-auto flex justify-center">
          <TrophySpin color="#155e75" size="large" text="Cargando..." textColor="#000000" />
        </div>
      )}

      {graphicsCuencasLoading === 0 && (
        <button
          onClick={loadCuencasGraphics}
          className="block mt-6 bg-cyan-700 text-white font-semibold px-4 py-2 rounded cursor-pointer hover:bg-cyan-600 transition"
        >
          Cargar Gráficos
        </button>
      )}

      {graphicsCuencasLoading === 1 && (
        <div className="space-y-2 mt-16 mx-auto flex justify-center">
          <Slab color="#155e75" size="large" text="Cargando..." textColor="#000000" />
        </div>
      )}

      {graphicsCuencasLoading === 2 && (
        <div className="space-y-10 mt-6 border-t pt-6">
          <h3 className="text-lg font-semibold">Gráficos</h3>

          <div className="w-full h-96">
            <h4 className="text-sm font-semibold mb-1 text-gray-700">Registros por Informante</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graficosData.grafico_cantidad_registros_por_informante.slice(0, 20)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="informante" angle={-45} textAnchor="end" interval={0} height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad_registros" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full h-96">
            <h4 className="text-sm font-semibold mb-1 text-gray-700">Caudal Total Extraído</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graficosData.grafico_caudal_total_por_informante.slice(0, 20)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="informante" angle={-45} textAnchor="end" interval={0} height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="caudal_total_extraido" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full h-96">
            <h4 className="text-sm font-semibold mb-1 text-gray-700">Obras Únicas por Informante</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graficosData.grafico_cantidad_obras_unicas_por_informante.slice(0, 20)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="informante" angle={-45} textAnchor="end" interval={0} height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad_obras_unicas" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
