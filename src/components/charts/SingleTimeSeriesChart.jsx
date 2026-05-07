import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { formatNumberCL } from '../../utils/formatNumberCL';
import { downsampleData } from '../../utils/dataOptimization';

/**
 * Componente para mostrar un gráfico simple de serie de tiempo con selector de período por años
 *
 * @param {Array} data - Datos con estructura: {fecha_medicion, valor}
 * @param {string} titulo - Título del gráfico
 * @param {string} unidad - Unidad de medida (ej: "L/s", "m")
 * @param {string} dataKey - Clave para acceder al valor en los datos
 * @param {string} color - Color de la línea del gráfico
 */
const SingleTimeSeriesChart = memo(function SingleTimeSeriesChart({
  data = [],
  titulo = "Serie de Tiempo",
  unidad = "",
  dataKey = "valor",
  color = "#0ea5e9",
  allowYAxisInvert = false
}) {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('todos'); // Default: Todos
  const [dataFiltrada, setDataFiltrada] = useState([]);
  const [yAxisInvertido, setYAxisInvertido] = useState(allowYAxisInvert);

  // Optimizar datos con downsampling (memoizado)
  const dataOptimizada = useMemo(() => {
    if (!data || data.length === 0) return [];
    // Solo aplicar downsampling si hay más de 400 puntos
    return data.length > 400 ? downsampleData(data, 400) : data;
  }, [data]);

  // Calcular opciones de período disponibles basadas en los datos (memoizado)
  const opcionesPeriodo = useMemo(() => {
    if (dataOptimizada.length === 0) return [];

    const fechas = dataOptimizada.map(d => new Date(d.fecha_medicion));
    const fechaMin = new Date(Math.min(...fechas));
    const fechaMax = new Date(Math.max(...fechas));

    // Calcular diferencia en años
    const diffMs = fechaMax - fechaMin;
    const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);

    const opciones = [];

    // Agregar opciones de 1 a 5 años según disponibilidad
    for (let i = 1; i <= 5; i++) {
      if (diffYears >= i * 0.5) {
        opciones.push({ valor: i, etiqueta: `${i} año${i > 1 ? 's' : ''}` });
      }
    }

    // Siempre agregar opción "Todos"
    opciones.push({ valor: 'todos', etiqueta: 'Todos' });

    return opciones;
  }, [dataOptimizada]);

  // Filtrar datos según el período seleccionado
  useEffect(() => {
    if (dataOptimizada.length === 0) return;

    if (periodoSeleccionado === 'todos') {
      setDataFiltrada(dataOptimizada);
    } else {
      // Filtrar por años desde la fecha más reciente hacia atrás
      const fechas = dataOptimizada.map(d => new Date(d.fecha_medicion));
      const fechaMax = new Date(Math.max(...fechas));

      // Calcular fecha límite
      const fechaLimite = new Date(fechaMax);
      fechaLimite.setFullYear(fechaMax.getFullYear() - periodoSeleccionado);

      const filtrada = dataOptimizada.filter(d => {
        const fecha = new Date(d.fecha_medicion);
        return fecha >= fechaLimite;
      });

      setDataFiltrada(filtrada);
    }
  }, [dataOptimizada, periodoSeleccionado]);

  // Calcular rango de fechas (memoizado)
  const rangoFechas = useMemo(() => {
    if (!dataFiltrada || dataFiltrada.length === 0) return null;

    const fechas = dataFiltrada.map(d => new Date(d.fecha_medicion));
    const minDate = new Date(Math.min(...fechas));
    const maxDate = new Date(Math.max(...fechas));

    const formatDate = (date) => date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace('.', '');

    return `${formatDate(minDate)} - ${formatDate(maxDate)}`;
  }, [dataFiltrada]);

  // Tooltip personalizado (memoizado)
  const CustomTooltip = useCallback(({ active, payload }) => {
    if (active && payload && payload.length) {
      const fecha = new Date(payload[0].payload.fecha_medicion);
      const fechaFormateada = fecha.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).replace('.', '');

      return (
        <div className="bg-white p-2 border rounded shadow text-sm">
          <p><strong>{fechaFormateada}</strong></p>
          <p style={{ color: payload[0].color }}>
            {titulo}: {formatNumberCL(payload[0].value)} {unidad}
          </p>
        </div>
      );
    }
    return null;
  }, [titulo, unidad]);

  return (
    <div className="bg-white border border-blue-200 rounded-lg p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h4 className="text-sm font-semibold text-blue-700">{titulo}</h4>
        <div className="flex items-center gap-2">
          {opcionesPeriodo.length > 1 && (
            <>
              <label className="text-xs font-semibold text-gray-700">Período:</label>
              <select
                value={periodoSeleccionado}
                onChange={(e) => {
                  const valor = e.target.value === 'todos' ? 'todos' : Number(e.target.value);
                  setPeriodoSeleccionado(valor);
                }}
                className="px-2 py-1 text-xs border border-gray-300 rounded bg-white hover:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {opcionesPeriodo.map(opcion => (
                  <option key={opcion.valor} value={opcion.valor}>
                    {opcion.etiqueta}
                  </option>
                ))}
              </select>
            </>
          )}
          {allowYAxisInvert && (
            <button
              onClick={() => setYAxisInvertido(v => !v)}
              title="Invertir eje Y"
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded border transition-all ${
                yAxisInvertido
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 16V4m0 0L3 8m4-4l4 4"/>
                <path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
              </svg>
              Invertir Y
            </button>
          )}
        </div>
      </div>

      {rangoFechas && (
        <p className="text-xs text-gray-500 mb-2">Periodo: {rangoFechas}</p>
      )}

      <div className="w-full h-[260px] md:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={dataFiltrada}
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
              reversed={yAxisInvertido}
              width={64}
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => formatNumberCL(v)}
            />
            <Tooltip content={CustomTooltip} />
            <Line type="monotone" dataKey={dataKey} stroke={color} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default SingleTimeSeriesChart;
