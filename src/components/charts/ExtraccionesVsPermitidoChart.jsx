import { memo, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine
} from 'recharts';
import { formatNumberCL } from '../../utils/formatNumberCL';
import {
  MESES,
  SEGUNDOS_POR_MES,
  SEGUNDOS_POR_AÑO,
  SEGUNDOS_POR_AÑO_BISIESTO,
  esBisiesto,
} from '../../utils/timeConstants';

const NUM_ES = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });

const ExtraccionesVsPermitidoChart = memo(function ExtraccionesVsPermitidoChart({
  caudalData = [],
  caudalMensual = null,
  volumenAnual = null,
}) {
  const permitidoLitros = useMemo(() => {
    if (volumenAnual != null) return volumenAnual * 1000;
    if (!caudalMensual) return null;
    let total = 0;
    let any = false;
    for (const mes of MESES) {
      const v = caudalMensual[mes];
      if (v == null || v === 0) continue;
      total += v * SEGUNDOS_POR_MES[mes];
      any = true;
    }
    return any ? total : null;
  }, [caudalMensual, volumenAnual]);

  const dataAnual = useMemo(() => {
    if (!caudalData || caudalData.length === 0) return [];
    const yearMap = {};
    for (const item of caudalData) {
      const valor = Number(item.caudal);
      if (!Number.isFinite(valor) || valor <= 0) continue;
      const fecha = new Date(item.fecha_medicion);
      if (Number.isNaN(fecha.getTime())) continue;
      const año = fecha.getUTCFullYear();
      const monthIdx = fecha.getUTCMonth();
      if (!yearMap[año]) yearMap[año] = {};
      if (!yearMap[año][monthIdx]) yearMap[año][monthIdx] = [];
      yearMap[año][monthIdx].push(valor);
    }

    return Object.keys(yearMap)
      .map(Number)
      .sort((a, b) => a - b)
      .map(año => {
        const byMonth = yearMap[año];
        const monthIdxs = Object.keys(byMonth).map(Number);
        const monthAvgs = monthIdxs.map(mi => {
          const arr = byMonth[mi];
          return arr.reduce((s, v) => s + v, 0) / arr.length;
        });

        const promMensual = monthAvgs.reduce((s, v) => s + v, 0) / monthAvgs.length;
        const segAño = esBisiesto(año) ? SEGUNDOS_POR_AÑO_BISIESTO : SEGUNDOS_POR_AÑO;
        const promedioAnual = promMensual * segAño;

        return {
          año,
          promedio: Math.round(promedioAnual),
        };
      });
  }, [caudalData]);

  const CustomTooltip = useCallback(({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white p-2 border rounded shadow text-xs">
        <p className="font-semibold mb-1">Año {label}</p>
        {payload.map(p => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {formatNumberCL(p.value)} L
          </p>
        ))}
        {permitidoLitros != null && (
          <p style={{ color: '#16a34a' }}>
            Permitido: {formatNumberCL(Math.round(permitidoLitros))} L
          </p>
        )}
      </div>
    );
  }, [permitidoLitros]);

  if (!caudalData || caudalData.length === 0) {
    return <p className="text-sm text-gray-500">Sin datos de extracciones medidas.</p>;
  }

  return (
    <div className="bg-white border border-green-200 rounded-lg p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h4 className="text-sm font-semibold text-green-700">
          Extracciones anuales vs volumen permitido (L/año)
        </h4>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-green-700">
            <span className="inline-block w-3 border-t-2 border-dashed border-green-600" />
            Permitido
          </span>
        </div>
      </div>

      <div className="w-full h-[260px] md:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dataAnual} margin={{ top: 8, right: 10, left: 5, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="año" tick={{ fontSize: 10 }} />
            <YAxis
              width={72}
              tick={{ fontSize: 10 }}
              tickFormatter={v => NUM_ES.format(v)}
            />
            <Tooltip content={CustomTooltip} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="promedio" name="Promedio anual" fill="#a78bfa" />
            {permitidoLitros != null && (
              <ReferenceLine
                y={permitidoLitros}
                stroke="#16a34a"
                strokeDasharray="5 3"
                ifOverflow="extendDomain"
                label={{
                  value: 'Permitido',
                  position: 'right',
                  fill: '#16a34a',
                  fontSize: 10,
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default ExtraccionesVsPermitidoChart;
