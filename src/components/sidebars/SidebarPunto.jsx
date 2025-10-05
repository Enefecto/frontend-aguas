import { TrophySpin, Slab } from 'react-loading-indicators';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ButtonOpenCloseSidebar } from '../Buttons/ButtonOpenCloseSidebar';
import { EstadisticBox } from '../UI/EstadisticBox';
import { PuntoGraphicsLoadingSkeleton } from '../UI/ChartSkeleton';
import { formatNumberCL } from '../../utils/formatNumberCL';
import { ModalDetalles } from '../UI/ModalDetalles';
import { useState, useEffect } from 'react';

export default function SidebarPunto({
  analisisPuntoSeleccionado,
  analisisPuntoSeleccionadoLoading,
  graphicsPuntosLoading,
  graficosPuntosData,
  loadPuntosGraphics,
  setRightSidebarAbiertoPunto,
  apiService
}) {

  const { analisis = {}, punto = {} } = analisisPuntoSeleccionado ?? {};

  // Extraer datos de caudal y nivel freático/altura según la estructura
  const caudal = analisis?.caudal || {};
  const nivelFreatico = analisis?.nivel_freatico;
  const alturaLimnimetrica = analisis?.altura_limnimetrica;

  const [isOpen, setIsOpen] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(null); // 'altura' o 'nivel' o null
  const [datosNivelFreatico, setDatosNivelFreatico] = useState(null);
  const [datosAlturaLimnimetrica, setDatosAlturaLimnimetrica] = useState(null);
  const [loadingNivelFreatico, setLoadingNivelFreatico] = useState(false);
  const [loadingAlturaLimnimetrica, setLoadingAlturaLimnimetrica] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsOpen(true);
    }, 100);
  },[])

  // Cargar datos de nivel freático si existe
  useEffect(() => {
    if (nivelFreatico && punto.utm_norte && punto.utm_este && apiService && graphicsPuntosLoading === 2) {
      setLoadingNivelFreatico(true);
      apiService.getPuntosSeriesTiempoNivelFreatico(punto.utm_norte, punto.utm_este)
        .then(data => {
          setDatosNivelFreatico(data);
        })
        .catch(error => {
          console.error('Error al cargar serie de tiempo de nivel freático:', error);
          setDatosNivelFreatico(null);
        })
        .finally(() => {
          setLoadingNivelFreatico(false);
        });
    }
  }, [nivelFreatico, punto.utm_norte, punto.utm_este, apiService, graphicsPuntosLoading]);

  // Cargar datos de altura limnimétrica si existe
  useEffect(() => {
    if (alturaLimnimetrica && punto.utm_norte && punto.utm_este && apiService && graphicsPuntosLoading === 2) {
      setLoadingAlturaLimnimetrica(true);
      apiService.getPuntosSeriesTiempoAlturaLimnimetrica(punto.utm_norte, punto.utm_este)
        .then(data => {
          setDatosAlturaLimnimetrica(data);
        })
        .catch(error => {
          console.error('Error al cargar serie de tiempo de altura limnimétrica:', error);
          setDatosAlturaLimnimetrica(null);
        })
        .finally(() => {
          setLoadingAlturaLimnimetrica(false);
        });
    }
  }, [alturaLimnimetrica, punto.utm_norte, punto.utm_este, apiService, graphicsPuntosLoading]);

  // Calcular rango de fechas para gráfico de caudal por tiempo
  const getDateRange = (data) => {
    if (!data || data.length === 0) return null;
    const dates = data.map(d => new Date(d.fecha_medicion));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    const formatDate = (date) => date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace('.', '');

    return `${formatDate(minDate)} - ${formatDate(maxDate)}`;
  }

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
      <ButtonOpenCloseSidebar toggleSidebar={setRightSidebarAbiertoPunto} setIsOpen={setIsOpen} />

      <h2 className="text-2xl font-bold border-b pb-2 mt-2">Análisis del punto</h2>

      <h3 className="text-lg font-semibold">
        Punto: <span className="text-cyan-800 font-bold">
          {punto.lat?.toFixed(5)} / {punto.lon?.toFixed(5)}
        </span>
      </h3>

      {/* Periodo de análisis */}
      {!analisisPuntoSeleccionadoLoading && caudal.primera_fecha && caudal.ultima_fecha && (
        <p className="text-sm text-gray-600">
          <strong>Periodo de análisis:</strong>{' '}
          {new Date(caudal.primera_fecha).toLocaleDateString('es-CL', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }).replace('.', '')}{' - '}
          {new Date(caudal.ultima_fecha).toLocaleDateString('es-CL', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }).replace('.', '')}
        </p>
      )}

      {alturaLimnimetrica && alturaLimnimetrica.promedio !== null && alturaLimnimetrica.promedio !== undefined && (
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-3 rounded-lg bg-cyan-50/80 px-3 py-2 border border-cyan-100 shadow-sm flex-1">
              {/* ícono gota */}
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-cyan-100">
                <svg width="18" height="18" viewBox="0 0 28 36" aria-hidden="true">
                  <path d="M14 2 C14 2 4 15 4 21 a10 10 0 0 0 20 0 C24 15 14 2 14 2z"
                        fill="#0891b2" stroke="white" strokeWidth="1.5" />
                </svg>
              </span>

              {/* texto */}
              <div className="leading-tight">
                <div className="text-[11px] uppercase tracking-wide text-cyan-700 font-semibold">
                  Altura limnimétrica promedio
                </div>
                <div className="text-xl font-extrabold text-cyan-900 tabular-nums">
                  {new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(alturaLimnimetrica.promedio)}
                  <span className="ml-1 text-sm font-semibold text-cyan-700">m</span>
                </div>
              </div>
            </div>

            {/* Botón Ver más */}
            <button
              onClick={() => setModalAbierto('altura')}
              className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold px-3 py-2 rounded transition-colors whitespace-nowrap"
              title="Ver detalles completos"
            >
              Ver más
            </button>
          </div>
        </div>
      )}

      {nivelFreatico && nivelFreatico.promedio !== null && nivelFreatico.promedio !== undefined && (
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-3 rounded-lg bg-orange-50/80 px-3 py-2 border border-orange-100 shadow-sm flex-1">
              {/* ícono gota */}
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100">
                <svg width="18" height="18" viewBox="0 0 28 36" aria-hidden="true">
                  <path d="M14 2 C14 2 4 15 4 21 a10 10 0 0 0 20 0 C24 15 14 2 14 2z"
                        fill="#FF5722" stroke="white" strokeWidth="1.5" />
                </svg>
              </span>

              {/* texto */}
              <div className="leading-tight">
                <div className="text-[11px] uppercase tracking-wide text-orange-700 font-semibold">
                  Nivel Freático promedio
                </div>
                <div className="text-xl font-extrabold text-orange-900 tabular-nums">
                  {new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(nivelFreatico.promedio)}
                  <span className="ml-1 text-sm font-semibold text-orange-700">m</span>
                </div>
              </div>
            </div>

            {/* Botón Ver más */}
            <button
              onClick={() => setModalAbierto('nivel')}
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold px-3 py-2 rounded transition-colors whitespace-nowrap"
              title="Ver detalles completos"
            >
              Ver más
            </button>
          </div>
        </div>
      )}

      {!analisisPuntoSeleccionadoLoading ? (
        <div className="space-y-4 pt-2">
          <h3 className="text-base font-semibold text-gray-700">Análisis Estadístico de Caudal</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">

            <EstadisticBox boxcolor="blue" label="Total de registros con caudal" value={caudal.total_registros} />
            <EstadisticBox boxcolor="green" label="Caudal promedio (L/s)" value={caudal.promedio} />
            <EstadisticBox boxcolor="yellow" label="Caudal mínimo (L/s)" value={caudal.minimo} />
            <EstadisticBox boxcolor="red" label="Caudal máximo (L/s)" value={caudal.maximo} />
            <EstadisticBox boxcolor="purple" label="Desviación estándar del caudal (L/s)" value={caudal.desviacion_estandar} />
          </div>
        </div>
      ) : (
        <div className="space-y-2 mt-16 mx-auto flex justify-center">
          <TrophySpin color="#155e75" size="large" text="Cargando..." textColor="#000000" />
        </div>
      )}

      {graphicsPuntosLoading === 0 && (
        <button
          onClick={() => loadPuntosGraphics(punto.utm_norte, punto.utm_este)}
          className="block mt-6 bg-cyan-700 text-white font-semibold px-4 py-2 rounded cursor-pointer hover:bg-cyan-600 transition"
        >
          Cargar Gráficos
        </button>
      )}

      {graphicsPuntosLoading === 1 && (
        <PuntoGraphicsLoadingSkeleton
          hasNivelFreatico={nivelFreatico && nivelFreatico.promedio !== null && nivelFreatico.promedio !== undefined}
          hasAlturaLimnimetrica={alturaLimnimetrica && alturaLimnimetrica.promedio !== null && alturaLimnimetrica.promedio !== undefined}
        />
      )}

      {graphicsPuntosLoading === 2 && (
        <div className="space-y-10 mt-6 border-t pt-6">
          <h3 className="text-lg font-semibold">Gráficos</h3>

          <div className="w-full h-[260px] md:h-80 lg:h-96">
            <h4 className="text-sm font-semibold mb-1 text-gray-700">Caudal por tiempo</h4>
            {graficosPuntosData.caudal_por_tiempo && graficosPuntosData.caudal_por_tiempo.length > 0 && (
              <p className="text-xs text-gray-500 mb-2">
                Periodo: {getDateRange(graficosPuntosData.caudal_por_tiempo)}
              </p>
            )}

            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={graficosPuntosData.caudal_por_tiempo}
                // más espacio a la izquierda para que no se corte el eje Y
                margin={{ top: 8, right: 10, left: 5, bottom: 24 }}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="fecha_medicion"
                  tickFormatter={(str) =>
                    new Date(str).toLocaleDateString('es-CL', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }).replace('.', '') // quita el punto de "sept."
                  }
                  minTickGap={30}
                  tickMargin={8}
                  tick={{ fontSize: 10 }}
                />

                <Tooltip
                  labelFormatter={(label) =>
                    new Date(label).toLocaleDateString('es-CL', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }).replace('.', '')
                  }
                  formatter={(value) => [`${formatNumberCL(value)} L/s`, 'Caudal']}
                />

                <YAxis
                  // dominio limpio: 0 a 5% sobre el máx
                  domain={[0, (dataMax) => (dataMax ?? 0) * 1.05]}
                  // ancho reservado para que quepan bien los números
                  width={64}
                  tick={{ fontSize: 10 }}
                  // formateo con miles y decimales
                  tickFormatter={(v) => formatNumberCL(v)}
                />

                <Tooltip
                  labelFormatter={(label) =>
                    new Date(label).toLocaleString('es-CL')
                  }
                  formatter={(value) => [`${formatNumberCL(value)} L/s`, 'Caudal']}
                />

                <Line type="monotone" dataKey="caudal" stroke="#2563eb" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Nivel Freático */}
          {nivelFreatico && (
            <div className="w-full h-[260px] md:h-80 lg:h-96 mt-10">
              <h4 className="text-sm font-semibold mb-1 text-gray-700">Nivel Freático por tiempo</h4>
              {loadingNivelFreatico ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                </div>
              ) : datosNivelFreatico?.nivel_por_tiempo && datosNivelFreatico.nivel_por_tiempo.length > 0 ? (
                <>
                  <p className="text-xs text-gray-500 mb-2">
                    Periodo: {getDateRange(datosNivelFreatico.nivel_por_tiempo)}
                  </p>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={datosNivelFreatico.nivel_por_tiempo}
                      margin={{ top: 8, right: 10, left: 5, bottom: 24 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="fecha_medicion"
                        tickFormatter={(str) =>
                          new Date(str).toLocaleDateString('es-CL', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          }).replace('.', '')
                        }
                        minTickGap={30}
                        tickMargin={8}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis
                        domain={[0, (dataMax) => (dataMax ?? 0) * 1.05]}
                        width={64}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => formatNumberCL(v)}
                      />
                      <Tooltip
                        labelFormatter={(label) =>
                          new Date(label).toLocaleDateString('es-CL', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          }).replace('.', '')
                        }
                        formatter={(value) => [`${formatNumberCL(value)} m`, 'Nivel Freático']}
                      />
                      <Line type="monotone" dataKey="nivel_freatico" stroke="#FF5722" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <p className="text-sm text-gray-500">No hay datos disponibles</p>
              )}
            </div>
          )}

          {/* Gráfico de Altura Limnimétrica */}
          {alturaLimnimetrica && (
            <div className="w-full h-[260px] md:h-80 lg:h-96 mt-10">
              <h4 className="text-sm font-semibold mb-1 text-gray-700">Altura Limnimétrica por tiempo</h4>
              {loadingAlturaLimnimetrica ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                </div>
              ) : datosAlturaLimnimetrica?.altura_por_tiempo && datosAlturaLimnimetrica.altura_por_tiempo.length > 0 ? (
                <>
                  <p className="text-xs text-gray-500 mb-2">
                    Periodo: {getDateRange(datosAlturaLimnimetrica.altura_por_tiempo)}
                  </p>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={datosAlturaLimnimetrica.altura_por_tiempo}
                      margin={{ top: 8, right: 10, left: 5, bottom: 24 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="fecha_medicion"
                        tickFormatter={(str) =>
                          new Date(str).toLocaleDateString('es-CL', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          }).replace('.', '')
                        }
                        minTickGap={30}
                        tickMargin={8}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis
                        domain={[0, (dataMax) => (dataMax ?? 0) * 1.05]}
                        width={64}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => formatNumberCL(v)}
                      />
                      <Tooltip
                        labelFormatter={(label) =>
                          new Date(label).toLocaleDateString('es-CL', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          }).replace('.', '')
                        }
                        formatter={(value) => [`${formatNumberCL(value)} m`, 'Altura Limnimétrica']}
                      />
                      <Line type="monotone" dataKey="altura_linimetrica" stroke="#0891b2" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <p className="text-sm text-gray-500">No hay datos disponibles</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modales */}
      <ModalDetalles
        isOpen={modalAbierto === 'altura'}
        onClose={() => setModalAbierto(null)}
        titulo="Detalles Altura Limnimétrica"
        datos={alturaLimnimetrica || {}}
      />

      <ModalDetalles
        isOpen={modalAbierto === 'nivel'}
        onClose={() => setModalAbierto(null)}
        titulo="Detalles Nivel Freático"
        datos={nivelFreatico || {}}
      />
    </div>
  );
}
