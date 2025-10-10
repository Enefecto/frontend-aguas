import { TrophySpin } from 'react-loading-indicators';
import { ButtonOpenCloseSidebar } from '../Buttons/ButtonOpenCloseSidebar';
import { EstadisticBox } from '../UI/EstadisticBox';
import { GraphicsLoadingSkeleton } from '../UI/ChartSkeleton';
import TimeSeriesChartPair from '../charts/TimeSeriesChartPair';
import { useEffect, useState } from "react";

export default function SidebarSubcuenca({
  subcuencaAnalysis,
  subcuencaLoading,
  graphicsSubcuencasLoading,
  graficosData,
  setRightSidebarAbiertoSubcuencas,
  loadSubcuencasGraphics
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

      <ButtonOpenCloseSidebar toggleSidebar={setRightSidebarAbiertoSubcuencas} setIsOpen={setIsOpen}/>

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
            <EstadisticBox boxcolor="purple" label="Desviación estándar del caudal" value={subcuencaAnalysis.desviacion_estandar_caudal} />
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
          className="block mt-6 bg-cyan-700 text-white font-semibold px-4 py-2 rounded cursor-pointer hover:bg-cyan-600 transition"
        >
          Cargar Gráficos
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
            <TimeSeriesChartPair
              dataMensual={graficosData.caudal?.mensual || []}
              dataDiario={graficosData.caudal?.diario || []}
              titulo="Caudal"
              unidad="L/s"
              valueKey="caudal"
            />
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
            <TimeSeriesChartPair
              dataMensual={graficosData.altura_linimetrica?.mensual || []}
              dataDiario={graficosData.altura_linimetrica?.diario || []}
              titulo="Altura Limnimétrica"
              unidad="m"
              valueKey="altura_linimetrica"
            />
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
            <TimeSeriesChartPair
              dataMensual={graficosData.nivel_freatico?.mensual || []}
              dataDiario={graficosData.nivel_freatico?.diario || []}
              titulo="Nivel Freático"
              unidad="m"
              valueKey="nivel_freatico"
            />
          )}
        </div>
      )}
    </div>
  );
}