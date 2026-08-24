import { TrophySpin, Slab } from 'react-loading-indicators';
import { ButtonOpenCloseSidebar } from '../Buttons/ButtonOpenCloseSidebar';
import { EstadisticBox } from '../UI/EstadisticBox';
import { PuntoGraphicsLoadingSkeleton } from '../UI/ChartSkeleton';
import { ModalDetalles } from '../UI/ModalDetalles';
import { useState, useEffect } from 'react';
import SingleTimeSeriesChart from '../charts/SingleTimeSeriesChart';
import DerechosTab from './DerechosTab';
import { filterByMinYear } from '../../utils/timeConstants';
import { getTiposTransmision, TIPO_TRANSMISION_LABEL } from '../../constants/tipoTransmision';
import { getUTMParaMostrar, formatUTM } from '../../utils/utmConverter.js';

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

  // El punto ya viene con zone_used desde convertPuntoUTMtoLatLon (useFilterLogic)
  const utmPunto = formatUTM(getUTMParaMostrar(punto));

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('mediciones');
  const [modalAbierto, setModalAbierto] = useState(null); // 'altura' o 'nivel' o null
  const [datosNivelFreatico, setDatosNivelFreatico] = useState(null);
  const [datosAlturaLimnimetrica, setDatosAlturaLimnimetrica] = useState(null);
  const [loadingNivelFreatico, setLoadingNivelFreatico] = useState(false);
  const [loadingAlturaLimnimetrica, setLoadingAlturaLimnimetrica] = useState(false);

  // Punto info detallado (sector_sha, canal, junta, subsubcuenca)
  const [puntoInfo, setPuntoInfo] = useState(null);

  useEffect(() => {
    const id = setTimeout(() => setIsOpen(true), 100);
    return () => clearTimeout(id);
  }, [])

  // Cargar datos de nivel freático si existe
  useEffect(() => {
    if (nivelFreatico && punto.utm_norte && punto.utm_este && apiService && graphicsPuntosLoading === 2) {
      setLoadingNivelFreatico(true);
      apiService.getPuntosSeriesTiempoNivelFreatico(punto.utm_norte, punto.utm_este)
        .then(data => {
          // Ordenar los datos por fecha ascendente
          if (data?.nivel_por_tiempo) {
            // TEMP: drop pre-2014 readings until DB filters handle it.
            data.nivel_por_tiempo = filterByMinYear(data.nivel_por_tiempo)
              .sort((a, b) => new Date(a.fecha_medicion) - new Date(b.fecha_medicion));
          }
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
          // Ordenar los datos por fecha ascendente
          if (data?.altura_por_tiempo) {
            // TEMP: drop pre-2014 readings until DB filters handle it.
            data.altura_por_tiempo = filterByMinYear(data.altura_por_tiempo)
              .sort((a, b) => new Date(a.fecha_medicion) - new Date(b.fecha_medicion));
          }
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

  // Cargar info detallada del punto desde /puntos/info
  useEffect(() => {
    if (punto.utm_norte && punto.utm_este && apiService) {
      apiService.getPuntoInfo(punto.utm_norte, punto.utm_este)
        .then(data => setPuntoInfo(data))
        .catch(() => setPuntoInfo(null));
    }
  }, [punto.utm_norte, punto.utm_este, apiService]);

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
      <ButtonOpenCloseSidebar toggleSidebar={setRightSidebarAbiertoPunto} setIsOpen={setIsOpen} />

      <h2 className="text-2xl font-bold border-b pb-2 mt-2">Análisis del punto</h2>

      {/* Tab navigation */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab('mediciones')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'mediciones'
              ? 'text-cyan-700 border-b-2 border-cyan-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📈 Mediciones
        </button>
        <button
          onClick={() => setActiveTab('derechos')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'derechos'
              ? 'text-green-700 border-b-2 border-green-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ⚖️ Derechos
        </button>
      </div>

      {activeTab === 'mediciones' && (
        <>
      <h3 className="text-lg font-semibold">
        Coordenadas: <span className="text-cyan-800 font-bold">
          {punto.lat?.toFixed(5)} / {punto.lon?.toFixed(5)}
        </span>
      </h3>
      {utmPunto && (
        <p className="text-sm text-gray-600 mt-1">
          <strong>UTM (WGS84):</strong> {utmPunto}
        </p>
      )}
      {punto.codigo && (
        <p className="text-base text-gray-700 mt-1">
          <strong>Código de obra:</strong> {punto.codigo}
        </p>
      )}

      {(puntoInfo?.sector_sha || punto.sector_sha) && (
        <p className="text-sm text-gray-600 mt-1">
          <strong>SHAC:</strong> {puntoInfo?.sector_sha || punto.sector_sha}
        </p>
      )}

      {(puntoInfo?.apr ?? punto.apr) !== null && (puntoInfo?.apr ?? punto.apr) !== undefined && (
        <p className="text-sm text-gray-600 mt-1">
          <strong>APR:</strong> {(puntoInfo?.apr ?? punto.apr) ? 'Sí' : 'No'}
        </p>
      )}

      {(puntoInfo?.id_junta || punto.id_junta) && (
        <p className="text-sm text-gray-600 mt-1">
          <strong>Junta de Vigilancia:</strong> ID {puntoInfo?.id_junta || punto.id_junta}
          {puntoInfo?.parte_junta !== null && puntoInfo?.parte_junta !== undefined && (
            <span> | Participa: {puntoInfo.parte_junta ? 'Sí' : 'No'}</span>
          )}
        </p>
      )}

      {(puntoInfo?.canales_transmision?.length > 0 || puntoInfo?.canal_transmision != null) && (
        <p className="text-sm text-gray-600 mt-1">
          <strong>{TIPO_TRANSMISION_LABEL}:</strong>{' '}
          {getTiposTransmision(puntoInfo.canales_transmision, puntoInfo.canal_transmision)}
        </p>
      )}

      {puntoInfo?.nombre_subsubcuenca && (
        <p className="text-sm text-gray-600 mt-1">
          <strong>Subsubcuenca:</strong> {puntoInfo.nombre_subsubcuenca}
        </p>
      )}

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
                  Altura limnimétrica promedio
                </div>
                <div className="text-xl font-extrabold text-orange-900 tabular-nums">
                  {new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(alturaLimnimetrica.promedio)}
                  <span className="ml-1 text-sm font-semibold text-orange-700">m</span>
                </div>
              </div>
            </div>

            {/* Botón Ver más */}
            <button
              onClick={() => setModalAbierto('altura')}
              className="group bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap shadow-md hover:shadow-lg hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
              title="Ver detalles completos"
            >
              Ver más
              <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {nivelFreatico && nivelFreatico.promedio !== null && nivelFreatico.promedio !== undefined && (
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
                  Nivel Freático promedio
                </div>
                <div className="text-xl font-extrabold text-cyan-900 tabular-nums">
                  {new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(nivelFreatico.promedio)}
                  <span className="ml-1 text-sm font-semibold text-cyan-700">m</span>
                </div>
              </div>
            </div>

            {/* Botón Ver más */}
            <button
              onClick={() => setModalAbierto('nivel')}
              className="group bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap shadow-md hover:shadow-lg hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
              title="Ver detalles completos"
            >
              Ver más
              <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
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
            {/* /puntos/estadisticas devuelve `desviacion_estandar`, no `caudal_desviacion_estandar` */}
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
          disabled={!punto.utm_norte || !punto.utm_este || analisisPuntoSeleccionadoLoading}
          className={`block mt-6 font-semibold px-4 py-2 rounded transition ${!punto.utm_norte || !punto.utm_este || analisisPuntoSeleccionadoLoading
            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
            : 'bg-cyan-700 text-white cursor-pointer hover:bg-cyan-600'
            }`}
        >
          {analisisPuntoSeleccionadoLoading ? 'Cargando datos...' : 'Cargar Gráficos'}
        </button>
      )}

      {graphicsPuntosLoading === 1 && (
        <PuntoGraphicsLoadingSkeleton
          hasNivelFreatico={nivelFreatico && nivelFreatico.promedio !== null && nivelFreatico.promedio !== undefined}
          hasAlturaLimnimetrica={alturaLimnimetrica && alturaLimnimetrica.promedio !== null && alturaLimnimetrica.promedio !== undefined}
        />
      )}

      {graphicsPuntosLoading === 2 && (
        <div className="space-y-28 mt-6 border-t pt-6">
          <h3 className="text-lg font-semibold">Gráficos</h3>

          {/* Gráfico de Caudal */}
          <div className="w-full">
            <SingleTimeSeriesChart
              data={graficosPuntosData.caudal_por_tiempo || []}
              titulo="Caudal por tiempo"
              unidad="L/s"
              dataKey="caudal"
              color="#2563eb"
            />
          </div>

          {/* Gráfico de Nivel Freático */}
          {nivelFreatico && (
            <div className="w-full">
              {loadingNivelFreatico ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                </div>
              ) : datosNivelFreatico?.nivel_por_tiempo && datosNivelFreatico.nivel_por_tiempo.length > 0 ? (
                <SingleTimeSeriesChart
                  data={datosNivelFreatico.nivel_por_tiempo}
                  titulo="Nivel Freático por tiempo"
                  unidad="m"
                  dataKey="nivel_freatico"
                  color="#0891b2"
                  allowYAxisInvert={true}
                />
              ) : (
                <p className="text-sm text-gray-500">No hay datos disponibles</p>
              )}
            </div>
          )}

          {/* Gráfico de Altura Limnimétrica */}
          {alturaLimnimetrica && (
            <div className="w-full">
              {loadingAlturaLimnimetrica ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                </div>
              ) : datosAlturaLimnimetrica?.altura_por_tiempo && datosAlturaLimnimetrica.altura_por_tiempo.length > 0 ? (
                <SingleTimeSeriesChart
                  data={datosAlturaLimnimetrica.altura_por_tiempo}
                  titulo="Altura Limnimétrica por tiempo"
                  unidad="m"
                  dataKey="altura_linimetrica"
                  color="#FF5722"
                />
              ) : (
                <p className="text-sm text-gray-500">No hay datos disponibles</p>
              )}
            </div>
          )}
        </div>
      )}

        </>
      )}

      {activeTab === 'derechos' && (
        <DerechosTab
          punto={punto}
          apiService={apiService}
          caudalData={graficosPuntosData?.caudal_por_tiempo || []}
          graficosListos={graphicsPuntosLoading === 2}
          graphicsPuntosLoading={graphicsPuntosLoading}
          loadPuntosGraphics={loadPuntosGraphics}
        />
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
