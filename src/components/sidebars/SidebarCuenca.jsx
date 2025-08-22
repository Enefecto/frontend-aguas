import { TrophySpin, Slab } from 'react-loading-indicators';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ButtonOpenCloseSidebar } from '../Buttons/ButtonOpenCloseSidebar';
import { EstadisticBox } from '../UI/EstadisticBox';
import { useEffect, useState } from "react";

export default function SidebarCuenca({
  cuencaAnalysis,
  cuencaLoading,
  graphicsCuencasLoading,
  graficosData,
  setRightSidebarAbiertoCuencas,
  loadCuencasGraphics
}) {

  const [selectedMes, setSelectedMes] = useState(null);
  const [caudalDiarioFiltrado, setCaudalDiarioFiltrado] = useState(null);

  const formatNumberCL = (num) =>
    (num ?? 0).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  // --- Función para limpiar outliers ---
  function winsorizeData(data, keys = ["min_caudal", "avg_caudal", "max_caudal"]) {
    const cleaned = [...data];
    const hardLimit = 200;

    keys.forEach((key) => {
      const values = cleaned
        .map(d => d[key])
        .filter(v => v > 0 && Number.isFinite(v))
        .sort((a, b) => a - b);

      if (values.length === 0) return;

      const q1 = values[Math.floor(values.length * 0.25)];
      const q3 = values[Math.floor(values.length * 0.75)];
      const iqr = q3 - q1;
      const upperLimit = q3 + 1.5 * iqr;

      cleaned.forEach(d => {
        if (d[key] > upperLimit) d[key] = q3;
        if (d[key] > hardLimit) d[key] = hardLimit;
      });
    });

    return cleaned;
  }

  // --- Aplicar limpieza ---
  const caudalMensualLimpio = winsorizeData(graficosData.grafico_caudal_mensual_min_prom_max || []);
  const caudalDiario = graficosData.grafico_caudal_diario_min_prom_max || [];

  // --- Al cargar, setear primer mes disponible ---
  useEffect(() => {
    if (!selectedMes && caudalMensualLimpio.length > 0) {
      setSelectedMes(caudalMensualLimpio[0].mes);
    }
  }, [caudalMensualLimpio, selectedMes]);
  
  useEffect(() => {
    if (!selectedMes) return;

    const [selectedAñoStr, selectedMesStr] = selectedMes.split("-");
    const selectedAño = Number(selectedAñoStr);
    const selectedM = Number(selectedMesStr);

    const caudalDiarioFiltradoParaSetear = winsorizeData(
      caudalDiario
        .filter(d => {
          const [añoStr, mesStr] = d.fecha.split("-");
          const año = Number(añoStr);
          const mes = Number(mesStr);
          return año === selectedAño && mes === selectedM;
        })
        .map(d => ({ ...d, dia: Number(d.fecha.split("-")[2]) })) // dia como número
    );

    setCaudalDiarioFiltrado(caudalDiarioFiltradoParaSetear);

  }, [selectedMes]);



  return (
    <div
      className="
        fixed inset-0 z-[1000] bg-white text-sm overflow-y-auto
        p-4 space-y-6
        md:absolute md:inset-auto md:right-0 md:top-0 md:h-full md:shadow-md
        md:p-6 lg:p-8
        w-screen md:w-[24rem] lg:w-[32rem] xl:w-[45rem]
      "
    >

      <ButtonOpenCloseSidebar toggleSidebar={setRightSidebarAbiertoCuencas}/>

      <h2 className="text-2xl font-bold border-b pb-2 mt-2">Análisis de Cuenca</h2>

      <h3 className="text-lg font-semibold">
        Cuenca: <span className="text-cyan-800 font-bold">{cuencaAnalysis.nombreCuenca}</span>
      </h3>

      {/* Estadísticos */}
      {!cuencaLoading ? (
        <div className="space-y-4 pt-2">
          <h3 className="text-base font-semibold text-gray-700">Análisis Estadístico</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
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

      {/* Botón cargar gráficos */}
      {graphicsCuencasLoading === 0 && (
        <button
          onClick={loadCuencasGraphics}
          className="block mt-6 bg-cyan-700 text-white font-semibold px-4 py-2 rounded cursor-pointer hover:bg-cyan-600 transition"
        >
          Cargar Gráficos
        </button>
      )}

      {/* Loader */}
      {graphicsCuencasLoading === 1 && (
        <div className="space-y-2 mt-16 mx-auto flex justify-center">
          <Slab color="#155e75" size="large" text="Cargando..." textColor="#000000" />
        </div>
      )}

      {/* Gráficos */}
      {graphicsCuencasLoading === 2 && (
        <div className="space-y-10 mt-6 border-t pt-6">
          <h3 className="text-lg font-semibold">Gráficos</h3>

          {/* LineChart mensual */}
          <div className="w-full h-[260px] md:h-80 lg:h-96">
            <h4 className="text-sm font-semibold mb-1 text-gray-700">Caudal mensual</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={caudalMensualLimpio}
                margin={{ top: 8, right: 10, left: 5, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" angle={-45} textAnchor="end" interval={5} height={80} tickMargin={8} tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatNumberCL(v)} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      setSelectedMes(label);
                      return (
                        <div className="bg-white p-2 border rounded shadow text-sm">
                          <p><strong>{label}</strong></p>
                          {payload.map((item, i) => (
                            <p key={i} style={{ color: item.color }}>
                              {item.name}: {formatNumberCL(item.value)} m³/s
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="avg_caudal" stroke="#0ea5e9" name="Promedio" dot={false} />
                <Line type="monotone" dataKey="min_caudal" stroke="#f97316" name="Mínimo" dot={false} />
                <Line type="monotone" dataKey="max_caudal" stroke="#2563eb" name="Máximo" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* LineChart diario */}
          {selectedMes && (
            <div className="w-full h-[260px] md:h-80 lg:h-96">
              <h4 className="text-sm font-semibold mb-1 text-gray-700">
                Caudal diario para {selectedMes}
              </h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={caudalDiarioFiltrado}
                  margin={{ top: 8, right: 10, left: 5, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" angle={-45} textAnchor="end"  height={80} tickMargin={8} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatNumberCL(v)} />
                  <Tooltip
                    formatter={(v, name) => [`${formatNumberCL(v)} m³/s`, name]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="avg_caudal" stroke="#0ea5e9" name="Promedio" dot={false} />
                  <Line type="monotone" dataKey="min_caudal" stroke="#f97316" name="Mínimo" dot={false} />
                  <Line type="monotone" dataKey="max_caudal" stroke="#2563eb" name="Máximo" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Otros gráficos existentes */}
          <div className="w-full h-[260px] md:h-80 lg:h-96">
            <h4 className="text-sm font-semibold mb-1 text-gray-700">Registros por Informante</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={graficosData.grafico_cantidad_registros_por_informante.slice(0, 20)}
                margin={{ top: 8, right: 10, left: 2, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="informante" angle={-45} textAnchor="end" interval={0} height={80} tickMargin={8} tick={{ fontSize: 10 }}/>
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatNumberCL(v)} />
                <Tooltip formatter={(v) => [formatNumberCL(v), 'Registros']} />
                <Bar dataKey="cantidad_registros" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full h-[260px] md:h-80 lg:h-96">
            <h4 className="text-sm font-semibold mb-1 text-gray-700">Caudal Total Extraído</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={graficosData.grafico_caudal_total_por_informante.slice(0, 20)}
                margin={{ top: 8, right: 10, left: 5, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="informante" angle={-45} textAnchor="end" interval={0} height={80} tickMargin={8} tick={{ fontSize: 10 }}/>
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatNumberCL(v)} />
                <Tooltip formatter={(v) => [`${formatNumberCL(v)} m³/s`, 'Caudal total']} />
                <Bar dataKey="caudal_total_extraido" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full h-[260px] md:h-80 lg:h-96">
            <h4 className="text-sm font-semibold mb-1 text-gray-700">Obras Únicas por Informante</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={graficosData.grafico_cantidad_obras_unicas_por_informante.slice(0, 20)}
                margin={{ top: 8, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="informante" angle={-45} textAnchor="end" interval={0} height={80} tickMargin={8} tick={{ fontSize: 10 }}/>
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatNumberCL(v)} />
                <Tooltip formatter={(v) => [formatNumberCL(v), 'Obras únicas']} />
                <Bar dataKey="cantidad_obras_unicas" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
