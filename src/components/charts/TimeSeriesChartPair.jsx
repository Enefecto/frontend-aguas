import { useEffect, useState, useMemo, memo, useCallback } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { formatNumberCL } from '../../utils/formatNumberCL';
import { downsampleData } from '../../utils/dataOptimization';

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
const TimeSeriesChartPair = memo(function TimeSeriesChartPair({
  dataMensual = [],
  dataDiario = [],
  titulo = "Serie de Tiempo",
  unidad = "",
  valueKey = "valor"
}) {
  const [lineasVisibles, setLineasVisibles] = useState({
    avg: true,
    min: true,
    max: true
  });
  const [selectedPeriodo, setSelectedPeriodo] = useState(null);
  const [dataSecundaria, setDataSecundaria] = useState(null);
  const [agrupacion, setAgrupacion] = useState('mes'); // 'mes' o 'año'
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(2); // Default: 2 años
  const [dataMensualFiltrado, setDataMensualFiltrado] = useState([]);
  const [dataDiarioFiltradoPorPeriodo, setDataDiarioFiltradoPorPeriodo] = useState([]);

  // Calcular opciones de período disponibles basadas en los datos (memoizado)
  const opcionesPeriodo = useMemo(() => {
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
  }, [dataMensual]);

  // Optimizar datos mensuales con downsampling usando useMemo
  const dataMensualOptimizado = useMemo(() => {
    if (!dataMensual || dataMensual.length === 0) return [];
    // Solo aplicar downsampling si hay más de 500 puntos
    return dataMensual.length > 500 ? downsampleData(dataMensual, 500) : dataMensual;
  }, [dataMensual]);

  // Optimizar datos diarios con downsampling usando useMemo
  const dataDiarioOptimizado = useMemo(() => {
    if (!dataDiario || dataDiario.length === 0) return [];
    // Solo aplicar downsampling si hay más de 300 puntos
    return dataDiario.length > 300 ? downsampleData(dataDiario, 300) : dataDiario;
  }, [dataDiario]);

  // Filtrar datos mensuales y diarios según el período seleccionado
  useEffect(() => {
    if (dataMensualOptimizado.length === 0) return;

    if (periodoSeleccionado === 'todos') {
      // Mostrar todos los datos
      setDataMensualFiltrado(dataMensualOptimizado);
      setDataDiarioFiltradoPorPeriodo(dataDiarioOptimizado);
    } else {
      // Filtrar por años desde la fecha más reciente hacia atrás
      const fechas = dataMensualOptimizado.map(d => new Date(d.mes + "-01"));
      const fechaMax = new Date(Math.max(...fechas));

      // Calcular fecha límite (años hacia atrás desde la fecha más reciente)
      const fechaLimite = new Date(fechaMax);
      fechaLimite.setFullYear(fechaMax.getFullYear() - periodoSeleccionado);

      // Filtrar datos mensuales
      const mensualFiltrado = dataMensualOptimizado.filter(d => {
        const fecha = new Date(d.mes + "-01");
        return fecha >= fechaLimite;
      });

      // Filtrar datos diarios
      const diarioFiltrado = dataDiarioOptimizado.filter(d => {
        const fecha = new Date(d.fecha);
        return fecha >= fechaLimite;
      });

      setDataMensualFiltrado(mensualFiltrado);
      setDataDiarioFiltradoPorPeriodo(diarioFiltrado);
    }
  }, [dataMensualOptimizado, dataDiarioOptimizado, periodoSeleccionado]);

  const dataAnualFiltrado = useMemo(() => {
    if (!dataMensualFiltrado || dataMensualFiltrado.length === 0) return [];
    const agrupado = {};
    dataMensualFiltrado.forEach(d => {
      const year = d.mes.split('-')[0];
      if (!agrupado[year]) {
        agrupado[year] = {
          periodo: year,
          sum_avg: 0,
          count_avg: 0,
          min: Infinity,
          max: -Infinity
        };
      }
      if (d[`avg_${valueKey}`] != null) {
        agrupado[year].sum_avg += d[`avg_${valueKey}`];
        agrupado[year].count_avg += 1;
      }
      if (d[`min_${valueKey}`] != null) {
        agrupado[year].min = Math.min(agrupado[year].min, d[`min_${valueKey}`]);
      }
      if (d[`max_${valueKey}`] != null) {
        agrupado[year].max = Math.max(agrupado[year].max, d[`max_${valueKey}`]);
      }
    });

    return Object.values(agrupado).map(d => ({
      periodo: d.periodo,
      [`avg_${valueKey}`]: d.count_avg > 0 ? d.sum_avg / d.count_avg : null,
      [`min_${valueKey}`]: d.min === Infinity ? null : d.min,
      [`max_${valueKey}`]: d.max === -Infinity ? null : d.max,
    })).sort((a, b) => a.periodo.localeCompare(b.periodo));
  }, [dataMensualFiltrado, valueKey]);

  const dataPrincipal = useMemo(() => {
    if (agrupacion === 'mes') {
      return dataMensualFiltrado.map(d => ({ ...d, periodo: d.mes }));
    } else {
      return dataAnualFiltrado;
    }
  }, [agrupacion, dataMensualFiltrado, dataAnualFiltrado]);

  // Al cambiar datos o filtro, deseleccionar si el periodo actual ya no existe
  useEffect(() => {
    if (selectedPeriodo !== null) {
      const periodoExisteEnFiltrado = dataPrincipal.some(d => d.periodo === selectedPeriodo);
      if (!periodoExisteEnFiltrado) {
        setSelectedPeriodo(null);
      }
    }
  }, [dataPrincipal, selectedPeriodo]);

  // Filtrar datos secundarios cuando se selecciona un periodo principal
  useEffect(() => {
    if (!selectedPeriodo) return;

    if (agrupacion === 'mes') {
      const [selectedAñoStr, selectedMesStr] = selectedPeriodo.split("-");
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
          subPeriodo: Number(d.fecha.split("-")[2]).toString(),
          fecha: d.fecha
        }));

      setDataSecundaria(filtrados);
    } else {
      // Agrupación anual: mostrar meses de ese año
      const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const filtrados = dataMensualFiltrado
        .filter(d => d.mes.startsWith(selectedPeriodo))
        .map(d => ({
          ...d,
          subPeriodo: mesesNombres[Number(d.mes.split("-")[1]) - 1],
          fecha: d.mes
        }));

      setDataSecundaria(filtrados);
    }
  }, [selectedPeriodo, agrupacion, dataDiarioFiltradoPorPeriodo, dataMensualFiltrado]);

  // Calcular rango de fechas (memoizado)
  const rangoFechas = useMemo(() => {
    if (!dataPrincipal || dataPrincipal.length === 0) return null;
    const periodos = dataPrincipal.map(d => d.periodo);
    return `${periodos[0]} - ${periodos[periodos.length - 1]}`;
  }, [dataPrincipal]);

  // Handler del click en gráfico principal (memoizado)
  const handlePeriodoClick = useCallback((data) => {
    if (data && data.activeLabel) {
      setSelectedPeriodo(data.activeLabel);
    }
  }, []);

  // Tooltip principal personalizado (memoizado)
  const CustomTooltipPrincipal = useCallback(({ active, payload, label }) => {
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
  }, [unidad]);

  // Tooltip secundario personalizado (memoizado)
  const CustomTooltipSecundario = useCallback(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow text-sm">
          <p><strong>{agrupacion === 'mes' ? `Día ${label}` : `Mes ${label}`}</strong></p>
          {payload.map((item, i) => (
            <p key={i} style={{ color: item.color }}>
              {item.name}: {formatNumberCL(item.value)} {unidad}
            </p>
          ))}
        </div>
      );
    }
    return null;
  }, [unidad, agrupacion]);

  return (
    <div className="space-y-4">
      {/* Controles del gráfico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          {/* Selector de agrupación */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Agrupar por:</label>
            <select
              value={agrupacion}
              onChange={(e) => setAgrupacion(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm"
            >
              <option value="mes">Mes</option>
              <option value="año">Año</option>
            </select>
          </div>

          {/* Selector de período */}
          {opcionesPeriodo.length > 1 && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Período:</label>
              <select
                value={periodoSeleccionado}
                onChange={(e) => {
                  const valor = e.target.value === 'todos' ? 'todos' : Number(e.target.value);
                  setPeriodoSeleccionado(valor);
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm"
              >
                {opcionesPeriodo.map(opcion => (
                  <option key={opcion.valor} value={opcion.valor}>
                    {opcion.etiqueta}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Toggles de líneas */}
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-1.5 text-sm cursor-pointer hover:opacity-80 transition-opacity">
            <input 
              type="checkbox" 
              checked={lineasVisibles.max}
              onChange={(e) => setLineasVisibles(prev => ({...prev, max: e.target.checked}))}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="font-medium text-gray-700" style={{color: '#2563eb'}}>Máximo</span>
          </label>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer hover:opacity-80 transition-opacity">
            <input 
              type="checkbox" 
              checked={lineasVisibles.avg}
              onChange={(e) => setLineasVisibles(prev => ({...prev, avg: e.target.checked}))}
              className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 cursor-pointer"
            />
            <span className="font-medium text-gray-700" style={{color: '#0ea5e9'}}>Promedio</span>
          </label>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer hover:opacity-80 transition-opacity">
            <input 
              type="checkbox" 
              checked={lineasVisibles.min}
              onChange={(e) => setLineasVisibles(prev => ({...prev, min: e.target.checked}))}
              className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 cursor-pointer"
            />
            <span className="font-medium text-gray-700" style={{color: '#f97316'}}>Mínimo</span>
          </label>
        </div>
      </div>

      {rangoFechas && (
        <div className="text-xs text-gray-500 text-right">
          Mostrando: {rangoFechas}
        </div>
      )}

      {/* Gráfico Principal */}
      <div className="w-full h-[260px] md:h-80 lg:h-96 mt-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1 gap-2">
          <h4 className="text-sm font-semibold text-gray-700">
            {titulo} {agrupacion === 'mes' ? 'mensual' : 'anual'}
          </h4>
          <p className="text-xs text-gray-500">
            Haz clic en un punto para ver detalles {agrupacion === 'mes' ? 'diarios' : 'mensuales'}
          </p>
        </div>
        {selectedPeriodo && (
          <p className="text-xs text-cyan-600 mb-2">
            <strong>{agrupacion === 'mes' ? 'Mes' : 'Año'} seleccionado:</strong> {selectedPeriodo}
          </p>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={dataPrincipal}
            margin={{ top: 8, right: 10, left: 5, bottom: 20 }}
            onClick={handlePeriodoClick}
            style={{ cursor: 'pointer' }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="periodo" angle={-45} textAnchor="end" interval={agrupacion === 'mes' ? 5 : 0} height={80} tickMargin={8} tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatNumberCL(v)} />
            <Tooltip content={CustomTooltipPrincipal} />
            <Legend />
            {lineasVisibles.avg && <Line type="monotone" dataKey={`avg_${valueKey}`} stroke="#0ea5e9" name="Promedio" dot={false} strokeWidth={2} />}
            {lineasVisibles.min && <Line type="monotone" dataKey={`min_${valueKey}`} stroke="#f97316" name="Mínimo" dot={false} strokeWidth={1.5} />}
            {lineasVisibles.max && <Line type="monotone" dataKey={`max_${valueKey}`} stroke="#2563eb" name="Máximo" dot={false} strokeWidth={1.5} />}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico Secundario */}
      {selectedPeriodo && dataSecundaria && dataSecundaria.length > 0 && (
        <div className="w-full h-[260px] md:h-80 lg:h-96 mt-12 pt-8 border-t border-gray-100">
          <h4 className="text-sm font-semibold mb-1 text-gray-700">
            {titulo} {agrupacion === 'mes' ? 'diario' : 'mensual'} para {selectedPeriodo}
          </h4>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={dataSecundaria}
              margin={{ top: 8, right: 10, left: 5, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subPeriodo" angle={-45} textAnchor="end" height={80} tickMargin={8} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatNumberCL(v)} />
              <Tooltip content={CustomTooltipSecundario} />
              <Legend />
              {lineasVisibles.avg && <Line type="monotone" dataKey={`avg_${valueKey}`} stroke="#0ea5e9" name="Promedio" dot={false} strokeWidth={2} />}
              {lineasVisibles.min && <Line type="monotone" dataKey={`min_${valueKey}`} stroke="#f97316" name="Mínimo" dot={false} strokeWidth={1.5} />}
              {lineasVisibles.max && <Line type="monotone" dataKey={`max_${valueKey}`} stroke="#2563eb" name="Máximo" dot={false} strokeWidth={1.5} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
});

export default TimeSeriesChartPair;
