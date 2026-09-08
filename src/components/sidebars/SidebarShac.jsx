import { TrophySpin } from 'react-loading-indicators';
import { ButtonOpenCloseSidebar } from '../Buttons/ButtonOpenCloseSidebar';
import { EstadisticBox } from '../UI/EstadisticBox';
import { EstadisticasPorTipo } from '../ui/EstadisticasPorTipo.jsx';
import { GraphicsLoadingSkeleton } from '../UI/ChartSkeleton';
import TimeSeriesChartPair from '../charts/TimeSeriesChartPair';
import { useEffect, useState, useRef } from "react";
import ApiService from '../../services/apiService';
import { obtenerTopUsuarios } from '../../utils/topUsuarios.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function SidebarShac({
  shacAnalysis,
  shacLoading,
  graphicsShacsLoading,
  graficosShacsData,
  setRightSidebarAbiertoShac,
  loadShacsGraphics,
  apiService
}) {

  const [isOpen, setIsOpen] = useState(false);
  const [topUsuarios, setTopUsuarios] = useState([]);
  const [statsPorTipo, setStatsPorTipo] = useState(null);
  const [loadingStatsPorTipo, setLoadingStatsPorTipo] = useState(false);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  // Sin opción "Todos": mezclar extracción superficial y subterránea en una
  // misma serie no tiene sentido físico. A diferencia de cuenca, acá se arranca
  // en subterráneo: un SHAC es un sector de acuífero y la observación 4.8 lo
  // pidió justamente "para aguas subterráneas".
  const [filtroTipoExtraccion, setFiltroTipoExtraccion] = useState(true);
  const isInitialMount = useRef(true);

  // Recargar gráficos si cambia el filtro y ya estaban cargados/cargándose
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (graphicsShacsLoading.caudal !== 0 || graphicsShacsLoading.nivel_freatico !== 0) {
      loadShacsGraphics(filtroTipoExtraccion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroTipoExtraccion]);

  useEffect(() => {
    setTimeout(() => {
      setIsOpen(true);
    }, 100);
  }, []);

  // Estadísticas separadas por tipo de extracción, igual que en cuenca
  useEffect(() => {
    const codigo = shacAnalysis?.codigoShac;
    if (!codigo || !apiService) {
      setStatsPorTipo(null);
      return;
    }
    let vigente = true;
    setLoadingStatsPorTipo(true);
    apiService.getCuencasStatsPorTipo({ shac: codigo })
      .then(data => { if (vigente) setStatsPorTipo(data); })
      .catch(() => { if (vigente) setStatsPorTipo(null); })
      .finally(() => { if (vigente) setLoadingStatsPorTipo(false); });
    // Una respuesta vieja no debe pisar la del sector que se está mirando
    return () => { vigente = false; };
  }, [shacAnalysis?.codigoShac, apiService]);

  // Cargar usuarios cuando se soliciten los gráficos
  useEffect(() => {
    // Si graphicsShacsLoading.caudal no es 0, significa que se pulsó el botón "Cargar Gráficos"
    if (shacAnalysis && shacAnalysis.codigoShac && apiService && graphicsShacsLoading.caudal !== 0 && topUsuarios.length === 0) {
      setLoadingUsuarios(true);

      // Usuarios, no informantes: el informante carga la medición, el usuario
      // es el titular del derecho. Vienen de un archivo precalculado y ya
      // ordenado por número de obras (cat. 3.8); no se reordena acá.
      obtenerTopUsuarios('shac', shacAnalysis.codigoShac)
        .then(data => {
          setTopUsuarios(data || []);
        })
        .catch(err => {
          console.error("Error al cargar usuarios:", err);
          setTopUsuarios([]);
        })
        .finally(() => {
          setLoadingUsuarios(false);
        });
    }
    // Limpiar el top de usuarios si se cierra o cambia de sector sin apretar el botón
    if (graphicsShacsLoading.caudal === 0) {
      setTopUsuarios([]);
    }
  }, [shacAnalysis, graphicsShacsLoading, apiService]);

  return (
    <div
      data-sidebar="right"
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

      <ButtonOpenCloseSidebar toggleSidebar={setRightSidebarAbiertoShac} setIsOpen={setIsOpen} />

      <h2 className="text-2xl font-bold border-b pb-2 mt-2">Análisis de SHAC</h2>

      <h3 className="text-lg font-semibold">
        Sector: <span className="text-cyan-800 font-bold">{shacAnalysis.nombreShac}</span>
      </h3>

      {/* Estadísticos */}
      {!shacLoading ? (
        <div className="space-y-4 pt-2">
          <h3 className="text-base font-semibold text-gray-700">Análisis Estadístico</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
            <EstadisticBox boxcolor="blue" label="Total de registros con caudal" value={shacAnalysis.total_registros_con_caudal} />
            <EstadisticBox boxcolor="cyan" label="N° de obras con datos" value={shacAnalysis.obras_con_datos} />
            <EstadisticBox boxcolor="green" label="Caudal promedio (L/s)" value={shacAnalysis.caudal_promedio} />
            <EstadisticBox boxcolor="yellow" label="Caudal mínimo (L/s)" value={shacAnalysis.caudal_minimo} />
            <EstadisticBox boxcolor="red" label="Caudal máximo (L/s)" value={shacAnalysis.caudal_maximo} />
            {/* "entre obras" a propósito: acá la desviación mide la dispersión
                del caudal promedio de una obra a otra dentro del sector, no la
                de las mediciones individuales. Esa segunda no se puede
                reconstruir desde una tabla ya agregada por punto. */}
            <EstadisticBox boxcolor="purple" label="Desviación estándar entre obras (L/s)" value={shacAnalysis.desviacion_estandar_caudal} />
          </div>

          <h4 className="text-sm font-semibold text-gray-700 pt-2">Por tipo de extracción</h4>
          <EstadisticasPorTipo stats={statsPorTipo} loading={loadingStatsPorTipo} />
        </div>
      ) : (
        <div className="space-y-2 mt-16 mx-auto flex justify-center">
          <TrophySpin color="#155e75" size="large" text="Cargando..." textColor="#000000" />
        </div>
      )}

      {/* Filtro de Tipo de Extracción */}
      <div className="mt-8 mb-2">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Tipo de Extracción a graficar:</h3>
        <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setFiltroTipoExtraccion(false)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filtroTipoExtraccion === false ? 'bg-white shadow-sm text-cyan-800' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Superficial
          </button>
          <button
            onClick={() => setFiltroTipoExtraccion(true)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filtroTipoExtraccion === true ? 'bg-white shadow-sm text-cyan-800' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Subterráneo
          </button>
        </div>
      </div>

      {/* Botón cargar gráficos */}
      {graphicsShacsLoading.caudal === 0 &&
        graphicsShacsLoading.nivel_freatico === 0 && (
          <button
            onClick={() => loadShacsGraphics(filtroTipoExtraccion)}
            disabled={!shacAnalysis.codigoShac || shacLoading}
            className={`block mt-4 font-semibold px-4 py-2 rounded transition ${!shacAnalysis.codigoShac || shacLoading
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-cyan-700 text-white cursor-pointer hover:bg-cyan-600'
              }`}
          >
            {shacLoading ? 'Cargando datos...' : 'Cargar Gráficos'}
          </button>
        )}

      {/* Mostrar loader o gráficos según el estado de cada uno */}
      {(graphicsShacsLoading.caudal !== 0 ||
        graphicsShacsLoading.nivel_freatico !== 0) && (
          <div className="space-y-10 mt-6 border-t pt-6">
            <h3 className="text-lg font-semibold">Gráficos de Series de Tiempo</h3>

            {/* Gráficos de Caudal */}
            {graphicsShacsLoading.caudal === 1 && (
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
            {graphicsShacsLoading.caudal === 2 && (
              graficosShacsData.caudal?.mensual?.length > 0 ? (
                <TimeSeriesChartPair
                  key={`caudal-${shacAnalysis?.codigoShac}`}
                  dataMensual={graficosShacsData.caudal.mensual}
                  dataDiario={graficosShacsData.caudal.diario}
                  titulo="Caudal"
                  unidad="L/s"
                  valueKey="caudal"
                />
              ) : (
                <div className="w-full p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 text-center">
                    No hay datos de caudal disponibles para este sector en el período especificado.
                  </p>
                </div>
              )
            )}
            {graphicsShacsLoading.caudal === 3 && (
              <div className="w-full p-6 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-600 text-center">
                  No se encontraron datos de caudal para este sector.
                </p>
              </div>
            )}

            {/* Gráficos de Nivel Freático — solo para extracción subterránea:
                el nivel freático es una medida de acuífero, no de cauce. */}
            {filtroTipoExtraccion === true && graphicsShacsLoading.nivel_freatico === 1 && (
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
            {filtroTipoExtraccion === true && graphicsShacsLoading.nivel_freatico === 2 && (
              graficosShacsData.nivel_freatico?.mensual?.length > 0 ? (
                <TimeSeriesChartPair
                  dataMensual={graficosShacsData.nivel_freatico.mensual}
                  dataDiario={graficosShacsData.nivel_freatico.diario}
                  titulo="Nivel Freático"
                  unidad="m"
                  valueKey="nivel_freatico"
                />
              ) : (
                <div className="w-full p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 text-center">
                    No hay datos de nivel freático disponibles para este sector en el período especificado.
                  </p>
                </div>
              )
            )}
            {filtroTipoExtraccion === true && graphicsShacsLoading.nivel_freatico === 3 && (
              <div className="w-full p-6 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-600 text-center">
                  No se encontraron datos de nivel freático para este sector.
                </p>
              </div>
            )}

            {/* Top Usuarios */}
            {(topUsuarios.length > 0 || loadingUsuarios) && (
              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Top 10 Usuarios en el SHAC</h3>

                {loadingUsuarios ? (
                  <div className="flex items-center justify-center w-full h-[260px] md:h-80 lg:h-96 bg-gray-100 rounded-lg border">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600"></div>
                      <span className="text-sm font-medium">Cargando Usuarios...</span>
                    </div>
                  </div>
                ) : topUsuarios.length > 0 ? (
                  <div className="w-full h-[260px] md:h-80 lg:h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topUsuarios}
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
                          formatter={(value, _n, item) => [
                            `${value} obras · ${(item?.payload?.reportes ?? 0).toLocaleString('es-CL')} reportes`,
                            'Usuario'
                          ]}
                        />
                        <Bar dataKey="obras" radius={[0, 4, 4, 0]} barSize={20} fill="#0ea5e9">
                          {topUsuarios.map((entry, index) => (
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
