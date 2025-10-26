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
  color = "#0ea5e9"
}) {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('todos'); // Default: Todos
  const [dataFiltrada, setDataFiltrada] = useState([]);

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
    <>
      {/* Selector de período */}
      {opcionesPeriodo.length > 1 && (
        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm font-semibold text-gray-700">Período:</label>
          <select
            value={periodoSeleccionado}
            onChange={(e) => {
              const valor = e.target.value === 'todos' ? 'todos' : Number(e.target.value);
              setPeriodoSeleccionado(valor);
            }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all cursor-pointer shadow-sm"
          >
            {opcionesPeriodo.map(opcion => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.etiqueta}
              </option>
            ))}
          </select>
          {rangoFechas && (
            <span className="text-xs text-gray-500">
              Mostrando: {rangoFechas}
            </span>
          )}
        </div>
      )}

      {/* Título */}
      <h4 className="text-sm font-semibold mb-1 text-gray-700">{titulo}</h4>
      {rangoFechas && (
        <p className="text-xs text-gray-500 mb-2">
          Periodo: {rangoFechas}
        </p>
      )}

      {/* Gráfico */}
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
            width={64}
            tick={{ fontSize: 10 }}
            tickFormatter={(v) => formatNumberCL(v)}
          />
          <Tooltip content={CustomTooltip} />
          <Line type="monotone" dataKey={dataKey} stroke={color} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
});

export default SingleTimeSeriesChart;
