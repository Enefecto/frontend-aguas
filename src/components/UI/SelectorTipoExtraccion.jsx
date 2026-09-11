/**
 * Selector de tipo de extracción para los paneles de cuenca y subcuenca.
 *
 * Va arriba del panel y filtra todo lo que viene abajo, no solo los gráficos.
 * La razón es que superficial y subterránea no son comparables: en la cuenca 73
 * el caudal promedio superficial es de 13.422 L/s y el subterráneo de 8,85 L/s
 * —tres órdenes de magnitud— así que un resumen que promedie los dos no
 * describe nada real. Antes el panel mostraba ese promedio mezclado arriba y el
 * desglose por tipo más abajo; ahora hay un solo resumen y es el del tipo
 * elegido.
 *
 * No hay opción "Todos" a propósito, por lo mismo.
 */
export function SelectorTipoExtraccion({ valor, onChange, disabled = false }) {
  const botones = [
    { etiqueta: 'Superficial', v: false },
    { etiqueta: 'Subterránea', v: true },
  ];

  return (
    <div className="rounded-lg border-2 border-cyan-700 bg-cyan-50 p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-xs font-bold uppercase tracking-wide text-cyan-900">
          Tipo de extracción
        </span>
        <div className="flex bg-white/80 p-1 rounded-lg w-fit border border-cyan-200">
          {botones.map(({ etiqueta, v }) => (
            <button
              key={etiqueta}
              onClick={() => onChange(v)}
              disabled={disabled}
              aria-pressed={valor === v}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                valor === v
                  ? 'bg-cyan-700 text-white shadow-sm'
                  : 'text-cyan-900 hover:bg-cyan-100'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {etiqueta}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-cyan-900/80 mt-2">
        Todo el panel muestra solo extracción{' '}
        <strong>{valor ? 'subterránea' : 'superficial'}</strong>. Los dos tipos no se comparan
        entre sí: sus caudales difieren en órdenes de magnitud.
      </p>
    </div>
  );
}

/** Etiqueta para repetir el tipo elegido en los títulos de cada sección. */
export const etiquetaTipoExtraccion = valor =>
  valor ? 'extracción subterránea' : 'extracción superficial';
