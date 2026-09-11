import { memo, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine
} from 'recharts';
import { formatNumberCL } from '../../utils/formatNumberCL';
import { MESES, SEGUNDOS_POR_MES } from '../../utils/timeConstants';

const NUM_ES = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });

// Por qué un año puede quedar sin extracción. El backend manda la clave; acá
// se traduce para el tooltip, porque un "-" sin explicación se lee como
// "no extrajo agua", que es justo lo contrario de lo que significa.
const MOTIVOS = {
  reinicio_o_cambio_flujometro:
    'El totalizador terminó el año más abajo de lo que empezó: hubo cambio de flujómetro o un reinicio a cero.',
  sin_avance: 'El totalizador no avanzó en el año.',
  lectura_unica: 'Solo hay una lectura de totalizador en el año.',
  sin_lectura: 'No hay lecturas de totalizador en el año.',
};

const ExtraccionesVsPermitidoChart = memo(function ExtraccionesVsPermitidoChart({
  extraccionAnual = [],
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

  // La extracción anual la calcula la API desde el totalizador (último del año
  // menos el primero, solo si avanzó). Acá no se recalcula nada: los años sin
  // valor llegan en null y Recharts no dibuja barra, que es el "-" que pidió
  // la observación 6.4.
  const dataAnual = useMemo(
    () =>
      (extraccionAnual || [])
        .map(r => ({
          año: r.anio,
          extraccion: r.extraccion_litros,
          motivo: r.motivo_sin_dato,
          totalizadorInicial: r.totalizador_inicial,
          totalizadorFinal: r.totalizador_final,
        }))
        .sort((a, b) => a.año - b.año),
    [extraccionAnual]
  );

  const añosSinDato = useMemo(
    () => dataAnual.filter(d => d.extraccion == null).length,
    [dataAnual]
  );

  const CustomTooltip = useCallback(({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const fila = payload[0]?.payload;
    if (!fila) return null;
    return (
      <div className="bg-white p-2 border rounded shadow text-xs max-w-[16rem]">
        <p className="font-semibold mb-1">Año {label}</p>
        {fila.extraccion != null ? (
          <p style={{ color: '#a78bfa' }}>
            Extracción: {formatNumberCL(Math.round(fila.extraccion))} L
          </p>
        ) : (
          <>
            <p className="text-gray-600">Extracción: -</p>
            <p className="text-gray-500 mt-1">{MOTIVOS[fila.motivo] ?? 'Sin dato.'}</p>
          </>
        )}
        {fila.totalizadorInicial != null && fila.totalizadorFinal != null && (
          <p className="text-gray-400 mt-1">
            Totalizador: {formatNumberCL(Math.round(fila.totalizadorInicial))} →{' '}
            {formatNumberCL(Math.round(fila.totalizadorFinal))} m³
          </p>
        )}
        {permitidoLitros != null && (
          <p style={{ color: '#16a34a' }} className="mt-1">
            Permitido: {formatNumberCL(Math.round(permitidoLitros))} L
          </p>
        )}
      </div>
    );
  }, [permitidoLitros]);

  if (dataAnual.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Sin lecturas de totalizador: no se puede calcular la extracción anual.
      </p>
    );
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
            <Bar dataKey="extraccion" name="Extracción anual" fill="#a78bfa" />
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

      <p className="text-[11px] text-gray-500 mt-2">
        Calculada desde el totalizador: última lectura del año menos la primera, solo si el
        contador avanzó.
        {añosSinDato > 0 && (
          <>
            {' '}
            {añosSinDato === 1
              ? 'Hay 1 año sin barra'
              : `Hay ${añosSinDato} años sin barra`}{' '}
            por cambio de flujómetro, reinicio a cero o falta de lecturas.
          </>
        )}
      </p>
    </div>
  );
});

export default ExtraccionesVsPermitidoChart;
