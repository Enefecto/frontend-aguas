import { useState, useEffect } from 'react';
import CaudalConDerechosChart from '../charts/CaudalConDerechosChart';
import ExtraccionesVsPermitidoChart from '../charts/ExtraccionesVsPermitidoChart';
import { MESES, SEGUNDOS_POR_MES } from '../../utils/timeConstants';

const MESES_ABREV = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

const NUM_ES = new Intl.NumberFormat('es-CL');

export default function DerechosTab({
  punto,
  apiService,
  caudalData,
  graficosListos,
  graphicsPuntosLoading,
  loadPuntosGraphics,
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
  const volumenCalculado = derechos.volumen_anual == null;
  const volumenFallback = volumenCalculado
    ? MESES.reduce((sum, mes) => {
        const caudal = derechos.caudal_mensual[mes];
        if (caudal == null || caudal === 0) return sum;
        return sum + (caudal / 1000) * SEGUNDOS_POR_MES[mes];
      }, 0) || null
    : null;
  const volumenDisplay = derechos.volumen_anual ?? volumenFallback;

  return (
    <div className="space-y-4 pt-2">

      {/* Titular de la obra. Va antes de los stat boxes porque identifica a la
          obra, no es una cifra del derecho. El dato sale de la tabla base: el
          pipeline no lo arrastra a Puntos_Mapa. */}
      {derechos.usuario_obra && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-700 font-semibold mb-1">Usuario de la obra</p>
          <p className="text-sm font-bold text-green-900 break-words">{derechos.usuario_obra}</p>
        </div>
      )}

      {/* Stat boxes */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-xs text-green-700 font-semibold mb-1">Tipo derecho</p>
          <p className="text-base font-bold text-green-900">{derechos.tipo_derecho_label}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-xs text-green-700 font-semibold mb-1">Volumen anual permitido</p>
          <p className="text-base font-bold text-green-900">
            {volumenDisplay != null
              ? <>{NUM_ES.format(Math.round(volumenDisplay * 10) / 10)} m³{volumenCalculado && <span className="text-yellow-600">*</span>}</>
              : '—'}
          </p>
          {volumenCalculado && volumenDisplay != null && (
            <p className="text-[10px] text-yellow-600 mt-1">
              * Dato calculado a partir del CPA.
            </p>
          )}
        </div>
      </div>

      {/* Bar chart — caudal mensual autorizado */}
      <div className="bg-white border border-green-200 rounded-lg p-3">
        {/* Rotulado como CPA a pedido de la DGA. El dato real de CPA depende de la entrega de DTI (cat. 7). */}
        <p className="text-xs font-semibold text-green-700 mb-3">CPA (L/s)</p>
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
        <>
          <CaudalConDerechosChart
            data={caudalData}
            caudalMensual={derechos.caudal_mensual}
            titulo="Caudal medido vs autorizado"
            unidad="L/s"
          />
          <ExtraccionesVsPermitidoChart
            caudalData={caudalData}
            caudalMensual={derechos.caudal_mensual}
            volumenAnual={derechos.volumen_anual}
          />
        </>
      ) : graphicsPuntosLoading === 1 ? (
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      ) : (
        <button
          onClick={() => loadPuntosGraphics(punto.utm_norte, punto.utm_este)}
          disabled={!punto.utm_norte || !punto.utm_este}
          className="block w-full mt-2 font-semibold px-4 py-2 rounded transition bg-green-700 text-white cursor-pointer hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Cargar Gráficos
        </button>
      )}
    </div>
  );
}
