import { TrophySpin } from 'react-loading-indicators';
import { ButtonOpenCloseSidebar } from '../Buttons/ButtonOpenCloseSidebar';
import { EstadisticBox } from '../UI/EstadisticBox';
import { GraphicsLoadingSkeleton } from '../UI/ChartSkeleton';
import TimeSeriesChartPair from '../charts/TimeSeriesChartPair';
import { useEffect, useState } from "react";
import ApiService from '../../services/apiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function SidebarSubcuenca({
  subcuencaAnalysis,
  subcuencaLoading,
  graphicsSubcuencasLoading,
  graficosData,
  setRightSidebarAbiertoSubcuencas,
  loadSubcuencasGraphics,
  apiService
}) {

  const [isOpen, setIsOpen] = useState(false);
  const [topInformantes, setTopInformantes] = useState([]);
  const [loadingInformantes, setLoadingInformantes] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsOpen(true);
    }, 100);
  }, []);

  // Cargar informantes cuando se soliciten los gráficos
  useEffect(() => {
    // Si graphicsSubcuencasLoading.caudal no es 0, significa que se pulsó el botón "Cargar Gráficos"
    if (subcuencaAnalysis && subcuencaAnalysis.codigoSubcuenca && apiService && graphicsSubcuencasLoading.caudal !== 0 && topInformantes.length === 0) {
      setLoadingInformantes(true);

      apiService.getInformantes({
        cod_subcuenca: subcuencaAnalysis.codigoSubcuenca,
        limit: 10
      })
        .then(data => {
          // Formatear datos para el gráfico
          const chartData = (data || []).map(inf => ({
            nombre: inf.nombre_completo || 'Desconocido',
            reportes: inf.cantidad_reportes || 0
          })).sort((a, b) => b.reportes - a.reportes);

          setTopInformantes(chartData);
        })
        .catch(err => {
          console.error("Error al cargar informantes:", err);
          setTopInformantes([]);
        })
        .finally(() => {
          setLoadingInformantes(false);
        });
    }
    // Limpiar gráficos de informantes si se cierra o cambia de subcuenca sin apretar el botón
    if (graphicsSubcuencasLoading.caudal === 0) {
      setTopInformantes([]);
    }
  }, [subcuencaAnalysis, graphicsSubcuencasLoading, apiService]);

  return (
    <div
      className={`
        fixed inset-0 z-[1000] bg-white text-sm overflow-y-auto
        p-4 space-y-6
        md:absolute md:inset-auto md:right-0 md:top-0 md:h-full md:shadow-md
        md:p-6 lg:p-8
        w-screen md:w-[24rem] lg:w-[32rem] xl:w-[45rem]

        transform transition-transform duration-500 ease-in-out
        ${isOpen ? "translate-x-0" : "translate-x-full"}
      `}
    >

      <ButtonOpenCloseSidebar toggleSidebar={setRightSidebarAbiertoSubcuencas} setIsOpen={setIsOpen} />

      <h2 className="text-2xl font-bold border-b pb-2 mt-2">Análisis de Subcuenca</h2>

      {subcuencaAnalysis.codigoSubcuenca === 'sin_registro' ? (
        <h3 className="text-lg font-semibold">
          Registros sin subcuenca de: <span className="text-cyan-800 font-bold">{subcuencaAnalysis.nombreCuenca}</span>
        </h3>
      ) : (
        <h3 className="text-lg font-semibold">
          Subcuenca: <span className="text-cyan-800 font-bold">{subcuencaAnalysis.nombreSubcuenca}</span>
        </h3>
      )}

      {/* Periodo de análisis */}
      {!subcuencaLoading && subcuencaAnalysis.primera_fecha_medicion && subcuencaAnalysis.ultima_fecha_medicion && (
        <p className="text-sm text-gray-600">
          <strong>Periodo de análisis:</strong>{' '}
          {new Date(subcuencaAnalysis.primera_fecha_medicion).toLocaleDateString('es-CL', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }).replace('.', '')}{' - '}
          {new Date(subcuencaAnalysis.ultima_fecha_medicion).toLocaleDateString('es-CL', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }).replace('.', '')}
        </p>
      )}

      {/* Estadísticos */}
      {!subcuencaLoading ? (
        <div className="space-y-4 pt-2">
          <h3 className="text-base font-semibold text-gray-700">Análisis Estadístico</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
            <EstadisticBox boxcolor="blue" label="Total de registros con caudal" value={subcuencaAnalysis.total_registros_con_caudal} />
            <EstadisticBox boxcolor="green" label="Caudal promedio (L/s)" value={subcuencaAnalysis.caudal_promedio} />
            <EstadisticBox boxcolor="yellow" label="Caudal mínimo (L/s)" value={subcuencaAnalysis.caudal_minimo} />
            <EstadisticBox boxcolor="red" label="Caudal máximo (L/s)" value={subcuencaAnalysis.caudal_maximo} />
            <EstadisticBox boxcolor="purple" label="Desviación estándar del caudal (L/s)" value={subcuencaAnalysis.desviacion_estandar_caudal} />
          </div>
        </div>
      ) : (
        <div className="space-y-2 mt-16 mx-auto flex justify-center">
          <TrophySpin color="#155e75" size="large" text="Cargando..." textColor="#000000" />
        </div>
      )}

      {/* Botón cargar gráficos */}
      {graphicsSubcuencasLoading.caudal === 0 &&
        graphicsSubcuencasLoading.altura_linimetrica === 0 &&
        graphicsSubcuencasLoading.nivel_freatico === 0 && (
          <button
            onClick={loadSubcuencasGraphics}
            disabled={!subcuencaAnalysis.codigoSubcuenca || !subcuencaAnalysis.codigoCuenca || subcuencaLoading}
            className={`block mt-6 font-semibold px-4 py-2 rounded transition ${!subcuencaAnalysis.codigoSubcuenca || !subcuencaAnalysis.codigoCuenca || subcuencaLoading
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-cyan-700 text-white cursor-pointer hover:bg-cyan-600'
              }`}
          >
            {subcuencaLoading ? 'Cargando datos...' : 'Cargar Gráficos'}
          </button>
        )}

      {/* Mostrar loader o gráficos según el estado de cada uno */}
      {(graphicsSubcuencasLoading.caudal !== 0 ||
        graphicsSubcuencasLoading.altura_linimetrica !== 0 ||
        graphicsSubcuencasLoading.nivel_freatico !== 0) && (
          <div className="space-y-10 mt-6 border-t pt-6">
            <h3 className="text-lg font-semibold">Gráficos de Series de Tiempo</h3>

            {/* Gráficos de Caudal */}
            {graphicsSubcuencasLoading.caudal === 1 && (
              <div className="space-y-10">
                <div className="w-full h-[260px] md:h-80 lg:h-96 animate-pulse">
                  <div className="h-4 bg-gray-300 rounded w-32 mb-1"></div>
                  <div className="w-full h-full bg-gray-100 rounded-lg border flex items-center justify-center">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600"></div>
                      <span className="text-sm font-medium">Cargando Caudal...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {graphicsSubcuencasLoading.caudal === 2 && (
              graficosData.caudal?.mensual?.length > 0 ? (
                <TimeSeriesChartPair
                  dataMensual={graficosData.caudal.mensual}
                  dataDiario={graficosData.caudal.diario}
                  titulo="Caudal"
                  unidad="L/s"
                  valueKey="caudal"
                />
              ) : (
                <div className="w-full p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 text-center">
                    No hay datos de caudal disponibles para esta subcuenca en el período especificado.
                  </p>
                </div>
              )
            )}
            {graphicsSubcuencasLoading.caudal === 3 && (
              <div className="w-full p-6 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-600 text-center">
                  No se encontraron datos de caudal para esta subcuenca.
                </p>
              </div>
            )}

            {/* Gráficos de Altura Limnimétrica */}
            {graphicsSubcuencasLoading.altura_linimetrica === 1 && (
              <div className="space-y-10">
                <div className="w-full h-[260px] md:h-80 lg:h-96 animate-pulse">
                  <div className="h-4 bg-gray-300 rounded w-48 mb-1"></div>
                  <div className="w-full h-full bg-gray-100 rounded-lg border flex items-center justify-center">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600"></div>
                      <span className="text-sm font-medium">Cargando Altura Limnimétrica...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {graphicsSubcuencasLoading.altura_linimetrica === 2 && (
              graficosData.altura_linimetrica?.mensual?.length > 0 ? (
                <TimeSeriesChartPair
                  dataMensual={graficosData.altura_linimetrica.mensual}
                  dataDiario={graficosData.altura_linimetrica.diario}
                  titulo="Altura Limnimétrica"
                  unidad="m"
                  valueKey="altura_linimetrica"
                />
              ) : (
                <div className="w-full p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 text-center">
                    No hay datos de altura limnimétrica disponibles para esta subcuenca en el período especificado.
                  </p>
                </div>
              )
            )}
            {graphicsSubcuencasLoading.altura_linimetrica === 3 && (
              <div className="w-full p-6 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-600 text-center">
                  No se encontraron datos de altura limnimétrica para esta subcuenca.
                </p>
              </div>
            )}

            {/* Gráficos de Nivel Freático */}
            {graphicsSubcuencasLoading.nivel_freatico === 1 && (
              <div className="space-y-10">
                <div className="w-full h-[260px] md:h-80 lg:h-96 animate-pulse">
                  <div className="h-4 bg-gray-300 rounded w-40 mb-1"></div>
                  <div className="w-full h-full bg-gray-100 rounded-lg border flex items-center justify-center">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600"></div>
                      <span className="text-sm font-medium">Cargando Nivel Freático...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {graphicsSubcuencasLoading.nivel_freatico === 2 && (
              graficosData.nivel_freatico?.mensual?.length > 0 ? (
                <TimeSeriesChartPair
                  dataMensual={graficosData.nivel_freatico.mensual}
                  dataDiario={graficosData.nivel_freatico.diario}
                  titulo="Nivel Freático"
                  unidad="m"
                  valueKey="nivel_freatico"
                />
              ) : (
                <div className="w-full p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 text-center">
                    No hay datos de nivel freático disponibles para esta subcuenca en el período especificado.
                  </p>
                </div>
              )
            )}
            {graphicsSubcuencasLoading.nivel_freatico === 3 && (
              <div className="w-full p-6 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-600 text-center">
                  No se encontraron datos de nivel freático para esta subcuenca.
                </p>
              </div>
            )}

            {/* Top Informantes */}
            {(topInformantes.length > 0 || loadingInformantes) && (
              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Top 10 Informantes en la Subcuenca</h3>

                {loadingInformantes ? (
                  <div className="flex items-center justify-center w-full h-[260px] md:h-80 lg:h-96 bg-gray-100 rounded-lg border">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600"></div>
                      <span className="text-sm font-medium">Cargando Informantes...</span>
                    </div>
                  </div>
                ) : topInformantes.length > 0 ? (
                  <div className="w-full h-[260px] md:h-80 lg:h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topInformantes}
                        layout="vertical"
                        margin={{ top: 8, right: 10, left: 5, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(v) => v.toLocaleString('es-CL')}
                        />
                        <YAxis
                          dataKey="nombre"
                          type="category"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#4b5563' }}
                          width={140}
                        />
                        <Tooltip
                          cursor={{ fill: '#f3f4f6' }}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '0.875rem' }}
                          formatter={(value) => [value, 'Reportes']}
                        />
                        <Bar dataKey="reportes" radius={[0, 4, 4, 0]} barSize={20} fill="#0ea5e9">
                          {topInformantes.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill="#0ea5e9" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
    </div>
  );
}