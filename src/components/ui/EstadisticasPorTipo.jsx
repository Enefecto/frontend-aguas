import { formatNumberCL } from '../../utils/formatNumberCL';

const GRUPOS = [
  { clave: 'superficial', titulo: 'Extracción superficial', color: 'orange' },
  { clave: 'subterranea', titulo: 'Extracción subterránea', color: 'blue' }
];

const ESTILOS = {
  orange: 'border-orange-200 bg-orange-50',
  blue: 'border-blue-200 bg-blue-50'
};

const Dato = ({ label, valor, unidad }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-sm font-semibold text-gray-800">
      {valor == null ? '—' : `${formatNumberCL(valor)}${unidad ? ` ${unidad}` : ''}`}
    </p>
  </div>
);

/**
 * Estadísticas de caudal separadas por tipo de extracción.
 *
 * Superficial y subterránea son cuerpos de agua distintos medidos de forma
 * distinta, y en la práctica sus magnitudes no son comparables: en la cuenca
 * 101 el promedio superficial es 917 L/s contra 6 L/s del subterráneo. Por eso
 * la DGA pidió separarlas (cat. 3.6) en vez de mostrar un agregado único.
 *
 * La desviación estándar no aparece acá a propósito: se muestra una sola vez,
 * para la cuenca completa, en el bloque de análisis estadístico.
 */
export const EstadisticasPorTipo = ({ stats, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {GRUPOS.map(g => (
          <div key={g.clave} className="h-32 rounded-lg border border-gray-200 bg-gray-50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  // Si no hay una sola obra con datos en ninguno de los dos grupos, no se muestra
  // nada: dos tarjetas en cero no aportan por encima del resto del panel.
  const hayDatos = GRUPOS.some(g => (stats[g.clave]?.obras_con_datos ?? 0) > 0);
  if (!hayDatos) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {GRUPOS.map(({ clave, titulo, color }) => {
        const d = stats[clave];
        const sinObras = !d || d.obras_con_datos === 0;

        return (
          <div key={clave} className={`rounded-lg border p-3 ${ESTILOS[color]}`}>
            <p className="text-sm font-semibold text-gray-700 mb-2">{titulo}</p>

            {sinObras ? (
              <p className="text-xs text-gray-500">Sin obras con mediciones en esta cuenca.</p>
            ) : (
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                <Dato label="N° de obras con datos" valor={d.obras_con_datos} />
                <Dato label="Caudal total" valor={d.caudal_total} unidad="L/s" />
                <Dato label="Caudal promedio" valor={d.caudal_promedio} unidad="L/s" />
                <Dato label="N° de mediciones" valor={d.total_mediciones} />
                <Dato label="Caudal mínimo" valor={d.caudal_minimo} unidad="L/s" />
                <Dato label="Caudal máximo" valor={d.caudal_maximo} unidad="L/s" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
