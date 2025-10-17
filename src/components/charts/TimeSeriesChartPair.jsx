import { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { formatNumberCL } from '../../utils/formatNumberCL';

/**
 * Componente reutilizable para mostrar un par de gráficos de series de tiempo:
 * - Gráfico mensual con click para seleccionar mes
 * - Gráfico diario basado en el mes seleccionado
 *
 * @param {Object} props
 * @param {Array} props.dataMensual - Datos mensuales con estructura: {mes, min_valor, avg_valor, max_valor}
 * @param {Array} props.dataDiario - Datos diarios con estructura: {fecha, min_valor, avg_valor, max_valor}
 * @param {string} props.titulo - Título del gráfico (ej: "Caudal", "Altura Limnimétrica")
 * @param {string} props.unidad - Unidad de medida (ej: "L/s", "m")
 * @param {string} props.valueKey - Clave para acceder al valor (ej: "caudal", "altura_linimetrica")
 */
export default function TimeSeriesChartPair({
  dataMensual = [],
  dataDiario = [],
  titulo = "Serie de Tiempo",
  unidad = "",
  valueKey = "valor"
}) {
  const [selectedMes, setSelectedMes] = useState(null);
  const [dataDiarioFiltrado, setDataDiarioFiltrado] = useState(null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(2); // Default: 2 años
  const [dataMensualFiltrado, setDataMensualFiltrado] = useState([]);
  const [dataDiarioFiltradoPorPeriodo, setDataDiarioFiltradoPorPeriodo] = useState([]);

  // Calcular opciones de período disponibles basadas en los datos
  const calcularOpcionesPeriodo = () => {
    if (dataMensual.length === 0) return [];

    const fechas = dataMensual.map(d => new Date(d.mes + "-01"));
    const fechaMin = new Date(Math.min(...fechas));
    const fechaMax = new Date(Math.max(...fechas));

    // Calcular diferencia en años (con decimales)
    const diffMs = fechaMax - fechaMin;
    const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);

    const opciones = [];

    // Agregar opciones de 1 a 5 años según disponibilidad
    for (let i = 1; i <= 5; i++) {
      if (diffYears >= i * 0.5) { // Mostrar opción si hay al menos la mitad del período
        opciones.push({ valor: i, etiqueta: `${i} año${i > 1 ? 's' : ''}` });
      }
    }

    // Siempre agregar opción "Todos"
    opciones.push({ valor: 'todos', etiqueta: 'Todos' });

    return opciones;
  };

  const opcionesPeriodo = calcularOpcionesPeriodo();

  // Filtrar datos mensuales y diarios según el período seleccionado
  useEffect(() => {
    if (dataMensual.length === 0) return;

    if (periodoSeleccionado === 'todos') {
      // Mostrar todos los datos
      setDataMensualFiltrado(dataMensual);
      setDataDiarioFiltradoPorPeriodo(dataDiario);
    } else {
      // Filtrar por años desde la fecha más reciente hacia atrás
      const fechas = dataMensual.map(d => new Date(d.mes + "-01"));
      const fechaMax = new Date(Math.max(...fechas));

      // Calcular fecha límite (años hacia atrás desde la fecha más reciente)
      const fechaLimite = new Date(fechaMax);
      fechaLimite.setFullYear(fechaMax.getFullYear() - periodoSeleccionado);

      // Filtrar datos mensuales
      const mensualFiltrado = dataMensual.filter(d => {
        const fecha = new Date(d.mes + "-01");
        return fecha >= fechaLimite;
      });

      // Filtrar datos diarios
      const diarioFiltrado = dataDiario.filter(d => {
        const fecha = new Date(d.fecha);
        return fecha >= fechaLimite;
      });

      setDataMensualFiltrado(mensualFiltrado);
      setDataDiarioFiltradoPorPeriodo(diarioFiltrado);
    }
  }, [dataMensual, dataDiario, periodoSeleccionado]);

  // Al cargar, setear primer mes disponible del rango filtrado
  useEffect(() => {
    if (dataMensualFiltrado.length > 0) {
      // Si el mes seleccionado no está en el rango filtrado, seleccionar el primero
      const mesExisteEnFiltrado = dataMensualFiltrado.some(d => d.mes === selectedMes);
      if (!mesExisteEnFiltrado) {
        setSelectedMes(dataMensualFiltrado[0].mes);
      }
    }
  }, [dataMensualFiltrado, selectedMes]);

  // Filtrar datos diarios cuando se selecciona un mes (usar datos ya filtrados por período)
  useEffect(() => {
    if (!selectedMes) return;

    const [selectedAñoStr, selectedMesStr] = selectedMes.split("-");
    const selectedAño = Number(selectedAñoStr);
    const selectedM = Number(selectedMesStr);

    const filtrados = dataDiarioFiltradoPorPeriodo
      .filter(d => {
        const [añoStr, mesStr] = d.fecha.split("-");
        const año = Number(añoStr);
        const mes = Number(mesStr);
        return año === selectedAño && mes === selectedM;
      })
      .map(d => ({
        ...d,
        dia: Number(d.fecha.split("-")[2]),
        fecha: d.fecha
      }));

    setDataDiarioFiltrado(filtrados);
  }, [selectedMes, dataDiarioFiltradoPorPeriodo]);

  // Calcular rango de fechas
  const getMonthlyDateRange = (data) => {
    if (!data || data.length === 0) return null;
    const months = data.map(d => d.mes);
    return `${months[0]} - ${months[months.length - 1]}`;
  };

  return (
    <div className="space-y-10">
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
          {dataMensualFiltrado.length > 0 && (
            <span className="text-xs text-gray-500">
              Mostrando: {getMonthlyDateRange(dataMensualFiltrado)}
            </span>
          )}
        </div>
      )}

      {/* Gráfico Mensual */}
      <div className="w-full h-[260px] md:h-80 lg:h-96">
        <div className="flex justify-between items-center mb-1">
          <h4 className="text-sm font-semibold text-gray-700">{titulo} mensual</h4>
          <p className="text-xs text-gray-500">Haz clic en un punto para ver detalles diarios</p>
        </div>
        {selectedMes && (
          <p className="text-xs text-cyan-600 mb-2">
            <strong>Mes seleccionado:</strong> {selectedMes}
          </p>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={dataMensualFiltrado}
            margin={{ top: 8, right: 10, left: 5, bottom: 20 }}
            onClick={(data) => {
              if (data && data.activeLabel) {
                setSelectedMes(data.activeLabel);
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" angle={-45} textAnchor="end" interval={5} height={80} tickMargin={8} tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatNumberCL(v)} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-2 border rounded shadow text-sm">
                      <p><strong>{label}</strong></p>
                      {payload.map((item, i) => (
                        <p key={i} style={{ color: item.color }}>
                          {item.name}: {formatNumberCL(item.value)} {unidad}
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line type="monotone" dataKey={`avg_${valueKey}`} stroke="#0ea5e9" name="Promedio" dot={false} />
            <Line type="monotone" dataKey={`min_${valueKey}`} stroke="#f97316" name="Mínimo" dot={false} />
            <Line type="monotone" dataKey={`max_${valueKey}`} stroke="#2563eb" name="Máximo" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico Diario */}
      {selectedMes && dataDiarioFiltrado && dataDiarioFiltrado.length > 0 && (
        <div className="w-full h-[260px] md:h-80 lg:h-96 mt-18">
          <h4 className="text-sm font-semibold mb-1 text-gray-700">
            {titulo} diario para {selectedMes}
          </h4>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={dataDiarioFiltrado}
              margin={{ top: 8, right: 10, left: 5, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" angle={-45} textAnchor="end" height={80} tickMargin={8} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatNumberCL(v)} />
              <Tooltip
                formatter={(v, name) => [`${formatNumberCL(v)} ${unidad}`, name]}
              />
              <Legend />
              <Line type="monotone" dataKey={`avg_${valueKey}`} stroke="#0ea5e9" name="Promedio" dot={false} />
              <Line type="monotone" dataKey={`min_${valueKey}`} stroke="#f97316" name="Mínimo" dot={false} />
              <Line type="monotone" dataKey={`max_${valueKey}`} stroke="#2563eb" name="Máximo" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
