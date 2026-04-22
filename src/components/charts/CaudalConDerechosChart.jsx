import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts';
import { formatNumberCL } from '../../utils/formatNumberCL';
import { downsampleData } from '../../utils/dataOptimization';

const MONTH_KEYS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const CaudalConDerechosChart = memo(function CaudalConDerechosChart({
  data = [],
  caudalMensual = null,
  titulo = "Caudal medido vs autorizado",
  unidad = "L/s",
  dataKey = "caudal",
}) {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('todos');
  const [dataFiltrada, setDataFiltrada] = useState([]);

  const dataOptimizada = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.length > 400 ? downsampleData(data, 400) : data;
  }, [data]);

  const dataMerged = useMemo(() => {
    if (!caudalMensual) return dataOptimizada;
    return dataOptimizada.map(point => {
      const monthIndex = new Date(point.fecha_medicion).getMonth();
      const mesKey = MONTH_KEYS[monthIndex];
      return { ...point, caudal_autorizado: caudalMensual[mesKey] ?? null };
    });
  }, [dataOptimizada, caudalMensual]);

  const opcionesPeriodo = useMemo(() => {
    if (dataOptimizada.length === 0) return [];
    const fechas = dataOptimizada.map(d => new Date(d.fecha_medicion));
    const diffYears = (Math.max(...fechas) - Math.min(...fechas)) / (1000 * 60 * 60 * 24 * 365.25);
    const opciones = [];
    for (let i = 1; i <= 5; i++) {
      if (diffYears >= i * 0.5) opciones.push({ valor: i, etiqueta: `${i} año${i > 1 ? 's' : ''}` });
    }
    opciones.push({ valor: 'todos', etiqueta: 'Todos' });
    return opciones;
  }, [dataOptimizada]);

  useEffect(() => {
    if (dataMerged.length === 0) return;
    if (periodoSeleccionado === 'todos') {
      setDataFiltrada(dataMerged);
      return;
    }
    const fechas = dataMerged.map(d => new Date(d.fecha_medicion));
    const fechaMax = new Date(Math.max(...fechas));
    const fechaLimite = new Date(fechaMax);
    fechaLimite.setFullYear(fechaMax.getFullYear() - periodoSeleccionado);
    setDataFiltrada(dataMerged.filter(d => new Date(d.fecha_medicion) >= fechaLimite));
  }, [dataMerged, periodoSeleccionado]);

  const CustomTooltip = useCallback(({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const fecha = new Date(payload[0].payload.fecha_medicion).toLocaleDateString('es-CL', {
      day: '2-digit', month: 'short', year: 'numeric'
    }).replace('.', '');
    return (
      <div className="bg-white p-2 border rounded shadow text-sm">
        <p><strong>{fecha}</strong></p>
        {payload.map(p => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {formatNumberCL(p.value)} {unidad}
          </p>
        ))}
      </div>
    );
  }, [unidad]);

  if (data.length === 0) {
    return <p className="text-sm text-gray-500">Sin datos de caudal medido.</p>;
  }

  return (
    <>
      {opcionesPeriodo.length > 1 && (
        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm font-semibold text-gray-700">Período:</label>
          <select
            value={periodoSeleccionado}
            onChange={e => setPeriodoSeleccionado(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all cursor-pointer shadow-sm"
          >
            {opcionesPeriodo.map(o => (
              <option key={o.valor} value={o.valor}>{o.etiqueta}</option>
            ))}
          </select>
        </div>
      )}

      <h4 className="text-sm font-semibold mb-2 text-gray-700">{titulo}</h4>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dataFiltrada} margin={{ top: 8, right: 10, left: 5, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="fecha_medicion"
            tickFormatter={str => new Date(str).toLocaleDateString('es-CL', {
              day: '2-digit', month: 'short', year: 'numeric'
            }).replace('.', '')}
            minTickGap={30}
            tickMargin={8}
            tick={{ fontSize: 10 }}
          />
          <YAxis
            domain={[0, dataMax => (dataMax ?? 0) * 1.05]}
            width={64}
            tick={{ fontSize: 10 }}
            tickFormatter={v => formatNumberCL(v)}
          />
          <Tooltip content={CustomTooltip} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="#2563eb"
            dot={false}
            name="Medido"
          />
          {caudalMensual && (
            <Line
              type="monotone"
              dataKey="caudal_autorizado"
              stroke="#16a34a"
              strokeDasharray="5 3"
              dot={false}
              name="Autorizado"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </>
  );
});

export default CaudalConDerechosChart;
