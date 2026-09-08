import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Modal de descarga de las mediciones de una obra.
 *
 * Cubre la observación 7.1 del seguimiento con la DGA: el Convenio exige que
 * toda la data obtenida se pueda descargar en Excel o texto plano.
 *
 * El catálogo de columnas y sus descripciones vienen del backend
 * (/api/mediciones/columnas), que es la única fuente de verdad de los alias.
 * Acá nunca se ven los nombres reales de las columnas del data warehouse.
 */
export default function ModalDescargaDatos({ isOpen, onClose, codigoObra, apiService }) {
  const [catalogo, setCatalogo] = useState(null);
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [formato, setFormato] = useState('csv');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [preview, setPreview] = useState(null);
  const [cargandoPreview, setCargandoPreview] = useState(false);
  const [error, setError] = useState(null);
  const [mostrarInfo, setMostrarInfo] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // El catálogo se pide una sola vez y no cambia entre obras.
  useEffect(() => {
    if (!isOpen || catalogo || !apiService) return;
    apiService.getColumnasDescarga()
      .then((data) => {
        setCatalogo(data);
        setSeleccionadas(data.por_defecto);
      })
      .catch(() => setError('No se pudo cargar el catálogo de columnas.'));
  }, [isOpen, catalogo, apiService]);

  // El preview se rearma cuando cambian las fechas o las columnas. El debounce
  // evita disparar una consulta por cada checkbox que el usuario toca: cada
  // preview es hoy un scan de la tabla base.
  useEffect(() => {
    if (!isOpen || !codigoObra || !seleccionadas.length || !apiService) return;

    setCargandoPreview(true);
    setError(null);
    const id = setTimeout(() => {
      apiService.getPreviewDescarga({
        codigoObra,
        fechaInicio: fechaInicio || null,
        fechaFin: fechaFin || null,
        columnas: seleccionadas,
      })
        .then(setPreview)
        .catch(() => setError('No se pudo obtener la vista previa de los datos.'))
        .finally(() => setCargandoPreview(false));
    }, 400);

    return () => clearTimeout(id);
  }, [isOpen, codigoObra, seleccionadas, fechaInicio, fechaFin, apiService]);

  const grupos = useMemo(() => {
    if (!catalogo) return [];
    const porGrupo = new Map();
    catalogo.columnas.forEach((col) => {
      if (!porGrupo.has(col.grupo)) porGrupo.set(col.grupo, []);
      porGrupo.get(col.grupo).push(col);
    });
    return [...porGrupo.entries()];
  }, [catalogo]);

  const limiteExcel = preview?.limite_excel ?? 100000;
  const excedeExcel = preview?.excede_limite_excel ?? false;
  const filasQueSeDescargan = formato === 'excel' && excedeExcel
    ? limiteExcel
    : preview?.total_filas ?? 0;

  const alternarColumna = (clave) => {
    setSeleccionadas((previas) => previas.includes(clave)
      ? previas.filter((c) => c !== clave)
      : catalogo.columnas.filter((col) => previas.includes(col.clave) || col.clave === clave).map((col) => col.clave));
  };

  const descargar = () => {
    const url = apiService.getUrlDescarga({
      codigoObra,
      fechaInicio: fechaInicio || null,
      fechaFin: fechaFin || null,
      columnas: seleccionadas,
      formato,
    });
    // Navegación directa: deja que el navegador maneje el Content-Disposition.
    window.location.href = url;
  };

  if (!isOpen) return null;

  const formatearNumero = (n) => (n ?? 0).toLocaleString('es-CL');

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
         onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl"
           onClick={(e) => e.stopPropagation()}>

        {/* Encabezado */}
        <div className="flex items-start justify-between border-b border-gray-200 p-5">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Descargar datos de la obra</h2>
            <p className="mt-1 text-sm text-gray-600">
              Código de obra: <span className="font-semibold text-cyan-800">{codigoObra}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMostrarInfo((v) => !v)}
              aria-label="Información sobre las columnas"
              title="¿Qué significa cada columna?"
              className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold transition ${
                mostrarInfo
                  ? 'border-cyan-700 bg-cyan-700 text-white'
                  : 'border-gray-300 text-gray-600 hover:border-cyan-700 hover:text-cyan-700'
              }`}
            >
              i
            </button>
            <button type="button" onClick={onClose} aria-label="Cerrar"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-2xl leading-none text-gray-400 hover:text-gray-700">
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}

          {/* Panel de información de columnas */}
          {mostrarInfo && catalogo && (
            <div className="mb-5 rounded border border-cyan-200 bg-cyan-50 p-4">
              <h3 className="mb-2 font-semibold text-cyan-900">¿Qué significa cada columna?</h3>
              <dl className="space-y-2">
                {catalogo.columnas.map((col) => (
                  <div key={col.clave}>
                    <dt className="text-sm font-semibold text-gray-800">{col.etiqueta}</dt>
                    <dd className="text-sm text-gray-600">{col.descripcion}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 border-t border-cyan-200 pt-2 text-xs text-gray-600">
                Los datos provienen del Software de Monitoreo de Extracciones Efectivas de la DGA,
                cargados por los titulares de los derechos de aprovechamiento, quienes son
                responsables de su veracidad.
              </p>
            </div>
          )}

          {/* Filtro de fechas */}
          <section className="mb-5">
            <h3 className="mb-2 font-semibold text-gray-800">Rango de fechas</h3>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm text-gray-700">
                <span className="mb-1 block">Desde</span>
                <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
                       className="rounded border border-gray-300 px-2 py-1 text-sm" />
              </label>
              <label className="text-sm text-gray-700">
                <span className="mb-1 block">Hasta</span>
                <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
                       className="rounded border border-gray-300 px-2 py-1 text-sm" />
              </label>
              {(fechaInicio || fechaFin) && (
                <button type="button" onClick={() => { setFechaInicio(''); setFechaFin(''); }}
                        className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50">
                  Limpiar
                </button>
              )}
            </div>
            {preview?.rango_fechas?.primera && (
              <p className="mt-2 text-xs text-gray-500">
                Datos disponibles entre {preview.rango_fechas.primera} y {preview.rango_fechas.ultima}.
                Si no eligés un rango, se descarga todo.
              </p>
            )}
          </section>

          {/* Selección de columnas */}
          <section className="mb-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">
                Columnas a descargar
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({seleccionadas.length} seleccionadas)
                </span>
              </h3>
              {catalogo && (
                <button type="button" onClick={() => setSeleccionadas(catalogo.por_defecto)}
                        className="text-sm text-cyan-700 hover:underline">
                  Restablecer
                </button>
              )}
            </div>
            {!catalogo && <p className="text-sm text-gray-500">Cargando columnas…</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              {grupos.map(([grupo, columnas]) => (
                <div key={grupo}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{grupo}</p>
                  {columnas.map((col) => (
                    <label key={col.clave} className="flex items-start gap-2 py-0.5 text-sm text-gray-700">
                      <input type="checkbox" checked={seleccionadas.includes(col.clave)}
                             onChange={() => alternarColumna(col.clave)}
                             className="mt-0.5 accent-cyan-700" />
                      <span>{col.etiqueta}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
            {seleccionadas.length === 0 && (
              <p className="mt-2 text-sm text-amber-700">Elegí al menos una columna.</p>
            )}
          </section>

          {/* Vista previa */}
          <section className="mb-5">
            <h3 className="mb-2 font-semibold text-gray-800">
              Vista previa
              <span className="ml-2 text-sm font-normal text-gray-500">
                (primeras {preview?.filas?.length ?? 10} filas)
              </span>
            </h3>
            {cargandoPreview && <p className="text-sm text-gray-500">Cargando vista previa…</p>}
            {!cargandoPreview && preview?.filas?.length === 0 && (
              <p className="text-sm text-gray-600">
                No hay mediciones para esta obra en el rango seleccionado.
              </p>
            )}
            {!cargandoPreview && preview?.filas?.length > 0 && (
              <div className="overflow-x-auto rounded border border-gray-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {preview.columnas.map((col) => (
                        <th key={col.clave} className="whitespace-nowrap px-3 py-2 font-semibold text-gray-700">
                          {col.etiqueta}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.filas.map((fila, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        {preview.columnas.map((col) => (
                          <td key={col.clave} className="whitespace-nowrap px-3 py-1.5 text-gray-600">
                            {fila[col.etiqueta] ?? '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Formato */}
          <section>
            <h3 className="mb-2 font-semibold text-gray-800">Formato del archivo</h3>
            <div className="flex flex-wrap gap-2">
              {(catalogo?.formatos ?? []).map((f) => (
                <button key={f.clave} type="button" onClick={() => setFormato(f.clave)}
                        className={`rounded border px-4 py-2 text-sm transition ${
                          formato === f.clave
                            ? 'border-cyan-700 bg-cyan-700 font-semibold text-white'
                            : 'border-gray-300 text-gray-700 hover:border-cyan-700'
                        }`}>
                  {f.etiqueta}
                </button>
              ))}
            </div>

            {formato === 'excel' && (
              <p className={`mt-3 rounded border p-3 text-sm ${
                excedeExcel
                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                  : 'border-gray-200 bg-gray-50 text-gray-600'
              }`}>
                {excedeExcel ? (
                  <>
                    <strong>El archivo Excel va a quedar recortado.</strong> Esta obra tiene{' '}
                    {formatearNumero(preview?.total_filas)} mediciones y el Excel se limita a{' '}
                    {formatearNumero(limiteExcel)} filas para que el archivo siga siendo manejable.
                    Si necesitás la serie completa, descargá en CSV o Parquet, que no tienen tope.
                  </>
                ) : (
                  <>
                    El formato Excel se limita a {formatearNumero(limiteExcel)} filas. Esta obra
                    tiene {formatearNumero(preview?.total_filas)}, así que entra completa.
                  </>
                )}
              </p>
            )}
          </section>
        </div>

        {/* Pie */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 p-5">
          <p className="text-sm text-gray-600">
            {preview
              ? <>Se descargarán <strong>{formatearNumero(filasQueSeDescargan)}</strong> filas
                  {' '}× {seleccionadas.length} columnas</>
              : 'Calculando el tamaño de la descarga…'}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
                    className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="button" onClick={descargar}
                    disabled={!seleccionadas.length || !preview?.total_filas}
                    className={`rounded px-4 py-2 text-sm font-semibold text-white transition ${
                      !seleccionadas.length || !preview?.total_filas
                        ? 'cursor-not-allowed bg-gray-300'
                        : 'bg-cyan-700 hover:bg-cyan-800'
                    }`}>
              Descargar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
