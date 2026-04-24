import { useState, useEffect } from 'react';
import CaudalConDerechosChart from '../charts/CaudalConDerechosChart';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const MESES_ABREV = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

const NUM_ES = new Intl.NumberFormat('es-CL');

export default function DerechosTab({
  punto,
  apiService,
  caudalData,
  graficosListos,
}) {
  const [derechos, setDerechos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tooltipMes, setTooltipMes] = useState(null);

  useEffect(() => {
    if (!punto?.utm_norte || !punto?.utm_este || !apiService) return;
    setLoading(true);
    setDerechos(null);
    setError(null);
    apiService.getPuntoDerechos(punto.utm_norte, punto.utm_este)
      .then(data => setDerechos(data))
      .catch(err => {
        if (err?.response?.status === 404) {
          setDerechos(null);
        } else {
          setError('Error al cargar derechos de agua.');
        }
      })
      .finally(() => setLoading(false));
  }, [punto?.utm_norte, punto?.utm_este, apiService]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500 p-4">{error}</p>;
  }

  if (!derechos) {
    return (
      <p className="text-sm text-gray-500 p-4">Sin derechos de agua registrados para este punto.</p>
    );
  }

  const valores = MESES.map(m => derechos.caudal_mensual[m] ?? 0);
  const maxValor = Math.max(...valores, 0.001);
  const caudalAnualTotal = valores.reduce((acc, v) => acc + v, 0);

  return (
    <div className="space-y-4 pt-2">

      {/* Stat boxes */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-xs text-green-700 font-semibold mb-1">Tipo derecho</p>
          <p className="text-base font-bold text-green-900">{derechos.tipo_derecho_label}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-xs text-green-700 font-semibold mb-1">Caudal anual permitido</p>
          <p className="text-base font-bold text-green-900">
            {NUM_ES.format(Math.round(caudalAnualTotal * 10) / 10)} L/s
          </p>
        </div>
      </div>

      {/* Bar chart — caudal mensual autorizado */}
      <div className="bg-white border border-green-200 rounded-lg p-3">
        <p className="text-xs font-semibold text-green-700 mb-3">Caudal autorizado por mes (L/s)</p>
        <div className="relative">
          {/* Tooltip */}
          {tooltipMes !== null && (
            <div
              className="absolute z-10 bg-white border border-green-400 rounded px-2 py-1 text-xs shadow pointer-events-none"
              style={{
                left: `calc(${(tooltipMes / 12) * 100}% + 4px)`,
                top: '-28px',
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
              }}
            >
              {MESES[tooltipMes].charAt(0).toUpperCase() + MESES[tooltipMes].slice(1)}: {valores[tooltipMes].toFixed(1)} L/s
            </div>
          )}

          {/* Bars */}
          <div className="flex items-end gap-1" style={{ height: '80px' }}>
            {valores.map((val, i) => {
              const height = Math.round((val / maxValor) * 48);
              return (
                <div
                  key={MESES[i]}
                  className="flex-1 flex flex-col items-end justify-end cursor-pointer"
                  onMouseEnter={() => setTooltipMes(i)}
                  onMouseLeave={() => setTooltipMes(null)}
                >
                  {val > 0 && (
                    <span
                      className="text-[7px] text-green-800 font-semibold leading-none mb-0.5 w-full text-center"
                      style={{ fontSize: '6px' }}
                    >
                      {val % 1 === 0 ? val : val.toFixed(1)}
                    </span>
                  )}
                  <div
                    className="w-full rounded-t transition-colors"
                    style={{
                      height: `${height}px`,
                      backgroundColor: tooltipMes === i ? '#16a34a' : '#4ade80',
                    }}
                  />
                  <span className="text-[9px] text-gray-500 w-full text-center">{MESES_ABREV[i]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Time series */}
      {graficosListos ? (
        <div className="w-full h-[260px] md:h-80">
          <CaudalConDerechosChart
            data={caudalData}
            caudalMensual={derechos.caudal_mensual}
            titulo="Caudal medido vs autorizado"
            unidad="L/s"
          />
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">
          Carga los gráficos en la pestaña Mediciones para ver la serie temporal.
        </p>
      )}
    </div>
  );
}
