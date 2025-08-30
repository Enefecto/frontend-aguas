import { TrophySpin, Slab } from 'react-loading-indicators';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ButtonOpenCloseSidebar } from '../Buttons/ButtonOpenCloseSidebar';
import { EstadisticBox } from '../UI/EstadisticBox';
import { formatNumberCL } from '../../utils/formatNumberCL';
import { useState, useEffect } from 'react';

export default function SidebarPunto({
  analisisPuntoSeleccionado,
  analisisPuntoSeleccionadoLoading,
  graphicsPuntosLoading,
  graficosPuntosData,
  loadPuntosGraphics,
  setRightSidebarAbiertoPunto
}) {

  const { analisis = {}, punto = {} } = analisisPuntoSeleccionado ?? {};

  const [isOpen, setIsOpen] = useState(false); 

  useEffect(() => {
    setTimeout(() => {
      setIsOpen(true);
    }, 100);
  },[])

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


      {punto.tipoPunto?.altura !== null && punto.tipoPunto?.altura !== undefined && (
        <div className="mt-3">
          <div className="inline-flex items-center gap-3 rounded-lg bg-cyan-50/80 px-3 py-2 border border-cyan-100 shadow-sm">
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
                Altura limnimétrica
              </div>
              <div className="text-xl font-extrabold text-cyan-900 tabular-nums">
                {new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(punto.tipoPunto?.altura)}
                <span className="ml-1 text-sm font-semibold text-cyan-700">m</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {punto.tipoPunto?.nivel_freatico !== null && punto.tipoPunto?.nivel_freatico !== undefined && (
        <div className="mt-3">
          <div className="inline-flex items-center gap-3 rounded-lg bg-orange-50/80 px-3 py-2 border border-orange-100 shadow-sm">
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
                Nivel Freatico
              </div>
              <div className="text-xl font-extrabold text-orange-900 tabular-nums">
                {new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(punto.tipoPunto?.nivel_freatico)}
                <span className="ml-1 text-sm font-semibold text-orange-700">m</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!analisisPuntoSeleccionadoLoading ? (
        <div className="space-y-4 pt-2">
          <h3 className="text-base font-semibold text-gray-700">Análisis Estadístico</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
    
            <EstadisticBox boxcolor="blue" label="Total de registros con caudal" value={analisis.total_registros_con_caudal} />
            <EstadisticBox boxcolor="green" label="Caudal promedio (m³/s)" value={analisis.caudal_promedio} />
            <EstadisticBox boxcolor="yellow" label="Caudal mínimo (m³/s)" value={analisis.caudal_minimo} />
            <EstadisticBox boxcolor="red" label="Caudal máximo (m³/s)" value={analisis.caudal_maximo} />
            <EstadisticBox boxcolor="purple" label="Desviación estándar del caudal (m³/s)" value={analisis.desviacion_estandar_caudal} />
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
        <div className="space-y-2 mt-16 mx-auto flex justify-center">
          <Slab color="#155e75" size="large" text="Cargando..." textColor="#000000" />
        </div>
      )}

      {graphicsPuntosLoading === 2 && (
        <div className="space-y-10 mt-6 border-t pt-6">
          <h3 className="text-lg font-semibold">Gráficos</h3>

          <div className="w-full h-[260px] md:h-80 lg:h-96">
            <h4 className="text-sm font-semibold mb-1 text-gray-700">Caudal por tiempo</h4>

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
                  formatter={(value) => [`${formatNumberCL(value)} m³/s`, 'Caudal']}
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
                  formatter={(value) => [`${formatNumberCL(value)} m³/s`, 'Caudal']}
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
