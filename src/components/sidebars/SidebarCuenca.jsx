import { TrophySpin } from 'react-loading-indicators';
import { ButtonOpenCloseSidebar } from '../Buttons/ButtonOpenCloseSidebar';
import { EstadisticBox } from '../UI/EstadisticBox';
import { GraphicsLoadingSkeleton } from '../UI/ChartSkeleton';
import TimeSeriesChartPair from '../charts/TimeSeriesChartPair';
import { useEffect, useState } from "react";

export default function SidebarCuenca({
  cuencaAnalysis,
  cuencaLoading,
  graphicsCuencasLoading,
  graficosData,
  setRightSidebarAbiertoCuencas,
  loadCuencasGraphics
}) {

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsOpen(true);
    }, 100);
  },[]);

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

      <ButtonOpenCloseSidebar toggleSidebar={setRightSidebarAbiertoCuencas} setIsOpen={setIsOpen}/>

      <h2 className="text-2xl font-bold border-b pb-2 mt-2">Análisis de Cuenca</h2>

      <h3 className="text-lg font-semibold">
        Cuenca: <span className="text-cyan-800 font-bold">{cuencaAnalysis.nombreCuenca}</span>
      </h3>

      {/* Periodo de análisis */}
      {!cuencaLoading && cuencaAnalysis.primera_fecha_medicion && cuencaAnalysis.ultima_fecha_medicion && (
        <p className="text-sm text-gray-600">
          <strong>Periodo de análisis:</strong>{' '}
          {new Date(cuencaAnalysis.primera_fecha_medicion).toLocaleDateString('es-CL', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }).replace('.', '')}{' - '}
          {new Date(cuencaAnalysis.ultima_fecha_medicion).toLocaleDateString('es-CL', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }).replace('.', '')}
        </p>
      )}

      {/* Estadísticos */}
      {!cuencaLoading ? (
        <div className="space-y-4 pt-2">
          <h3 className="text-base font-semibold text-gray-700">Análisis Estadístico</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
            <EstadisticBox boxcolor="blue" label="Total de registros con caudal" value={cuencaAnalysis.total_registros_con_caudal} />
            <EstadisticBox boxcolor="green" label="Caudal promedio (L/s)" value={cuencaAnalysis.caudal_promedio} />
            <EstadisticBox boxcolor="yellow" label="Caudal mínimo (L/s)" value={cuencaAnalysis.caudal_minimo} />
            <EstadisticBox boxcolor="red" label="Caudal máximo (L/s)" value={cuencaAnalysis.caudal_maximo} />
            <EstadisticBox boxcolor="purple" label="Desviación estándar del caudal (L/s)" value={cuencaAnalysis.desviacion_estandar_caudal} />
          </div>
        </div>
      ) : (
        <div className="space-y-2 mt-16 mx-auto flex justify-center">
          <TrophySpin color="#155e75" size="large" text="Cargando..." textColor="#000000" />
        </div>
      )}

      {/* Botón cargar gráficos */}
      {graphicsCuencasLoading.caudal === 0 &&
       graphicsCuencasLoading.altura_linimetrica === 0 &&
       graphicsCuencasLoading.nivel_freatico === 0 && (
        <button
          onClick={loadCuencasGraphics}
          className="block mt-6 bg-cyan-700 text-white font-semibold px-4 py-2 rounded cursor-pointer hover:bg-cyan-600 transition"
        >
          Cargar Gráficos
        </button>
      )}

      {/* Mostrar loader o gráficos según el estado de cada uno */}
      {(graphicsCuencasLoading.caudal !== 0 ||
        graphicsCuencasLoading.altura_linimetrica !== 0 ||
        graphicsCuencasLoading.nivel_freatico !== 0) && (
        <div className="space-y-10 mt-6 border-t pt-6">
          <h3 className="text-lg font-semibold">Gráficos de Series de Tiempo</h3>

          {/* Gráficos de Caudal */}
          {graphicsCuencasLoading.caudal === 1 && (
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
          {graphicsCuencasLoading.caudal === 2 && (
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
                  No hay datos de caudal disponibles para esta cuenca en el período especificado.
                </p>
              </div>
            )
          )}
          {graphicsCuencasLoading.caudal === 3 && (
            <div className="w-full p-6 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-600 text-center">
                No se encontraron datos de caudal para esta cuenca.
              </p>
            </div>
          )}

          {/* Gráficos de Altura Limnimétrica */}
          {graphicsCuencasLoading.altura_linimetrica === 1 && (
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
          {graphicsCuencasLoading.altura_linimetrica === 2 && (
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
                  No hay datos de altura limnimétrica disponibles para esta cuenca en el período especificado.
                </p>
              </div>
            )
          )}
          {graphicsCuencasLoading.altura_linimetrica === 3 && (
            <div className="w-full p-6 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-600 text-center">
                No se encontraron datos de altura limnimétrica para esta cuenca.
              </p>
            </div>
          )}

          {/* Gráficos de Nivel Freático */}
          {graphicsCuencasLoading.nivel_freatico === 1 && (
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
          {graphicsCuencasLoading.nivel_freatico === 2 && (
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
                  No hay datos de nivel freático disponibles para esta cuenca en el período especificado.
                </p>
              </div>
            )
          )}
          {graphicsCuencasLoading.nivel_freatico === 3 && (
            <div className="w-full p-6 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-600 text-center">
                No se encontraron datos de nivel freático para esta cuenca.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
