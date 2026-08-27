/**
 * Reducción de series para graficar.
 *
 * La versión anterior de este archivo decía aplicar LTTB (Largest Triangle
 * Three Buckets), un algoritmo que elige de cada bloque el punto que más
 * contribuye a la silueta de la curva. No lo hacía: partía la serie en bloques
 * y se quedaba con el del medio. Sobre datos reales eso borraba picos —en la
 * cuenca 60 el máximo visible caía de 1.460 a 938 L/s, un 36 % menos— y en un
 * visualizador de extracciones el pico es justamente el dato que se mira.
 *
 * Acá hay dos funciones porque los gráficos tienen dos formas distintas:
 *
 * - `resumirEnvolvente` para las series de mín/prom/máx. Cada bloque conserva
 *   el mínimo de sus mínimos y el máximo de sus máximos, así la banda que
 *   dibuja el gráfico nunca se angosta al reducir.
 * - `downsampleData` (LTTB de verdad) para las series de una sola línea, donde
 *   no hay envolvente que preservar y lo que importa es la forma.
 *
 * Ojo con el orden de las operaciones: reducir primero y recortar después a la
 * ventana visible deja migajas. Con 9.583 días de historia y una ventana de dos
 * años, ese orden dibujaba 24 puntos para 730 días. Siempre recortar primero.
 */

/**
 * Encuentra la clave numérica de un punto, probando nombres conocidos.
 * @param {object} punto
 * @param {string[]} candidatos
 * @returns {string|null}
 */
const detectarClave = (punto, candidatos) =>
  candidatos.find(k => typeof punto?.[k] === 'number') ?? null;

/**
 * Reduce una serie preservando su forma, con LTTB.
 *
 * Para cada bloque elige el punto que forma el triángulo de mayor área junto
 * al punto ya seleccionado y al promedio del bloque siguiente. Los extremos de
 * un tramo son los que más área aportan, así que los picos sobreviven.
 *
 * @param {Array} data - Serie ordenada por fecha
 * @param {number} threshold - Cantidad máxima de puntos deseada
 * @param {string} [valueKey] - Clave numérica; si se omite se detecta
 * @returns {Array}
 */
export const downsampleData = (data, threshold = 500, valueKey = null) => {
  if (!Array.isArray(data) || data.length <= threshold || threshold < 3) {
    return data;
  }

  const clave = valueKey ?? detectarClave(data[0], [
    'caudal', 'valor', 'nivel_freatico', 'altura_linimetrica',
    'avg_caudal', 'max_caudal', 'promedio'
  ]);

  // Sin una clave numérica no hay forma que preservar: se cae al muestreo
  // regular, que al menos reparte los puntos de manera pareja.
  if (!clave) {
    const paso = (data.length - 2) / (threshold - 2);
    const salida = [data[0]];
    for (let i = 0; i < threshold - 2; i++) {
      const idx = Math.floor(i * paso) + 1;
      if (data[idx]) salida.push(data[idx]);
    }
    salida.push(data[data.length - 1]);
    return salida;
  }

  const y = (p) => (typeof p?.[clave] === 'number' ? p[clave] : 0);

  const tamBloque = (data.length - 2) / (threshold - 2);
  const salida = [data[0]];
  let anterior = 0;

  for (let i = 0; i < threshold - 2; i++) {
    // Promedio del bloque siguiente: es el tercer vértice del triángulo.
    let desdeProx = Math.floor((i + 1) * tamBloque) + 1;
    let hastaProx = Math.min(Math.floor((i + 2) * tamBloque) + 1, data.length);
    if (desdeProx >= hastaProx) desdeProx = hastaProx - 1;

    let sumaX = 0;
    let sumaY = 0;
    for (let j = desdeProx; j < hastaProx; j++) {
      sumaX += j;
      sumaY += y(data[j]);
    }
    const n = Math.max(hastaProx - desdeProx, 1);
    const promX = sumaX / n;
    const promY = sumaY / n;

    const desde = Math.floor(i * tamBloque) + 1;
    const hasta = Math.min(Math.floor((i + 1) * tamBloque) + 1, data.length);

    const anteriorX = anterior;
    const anteriorY = y(data[anterior]);

    let mejorArea = -1;
    let mejor = desde;
    for (let j = desde; j < hasta; j++) {
      const area = Math.abs(
        (anteriorX - promX) * (y(data[j]) - anteriorY) -
        (anteriorX - j) * (promY - anteriorY)
      );
      if (area > mejorArea) {
        mejorArea = area;
        mejor = j;
      }
    }

    if (data[mejor]) {
      salida.push(data[mejor]);
      anterior = mejor;
    }
  }

  salida.push(data[data.length - 1]);
  return salida;
};

/**
 * Reduce una serie de mín/prom/máx sin angostar la banda.
 *
 * En vez de elegir un punto representativo por bloque, lo resume: el mínimo de
 * los mínimos, el máximo de los máximos y el promedio ponderado de los
 * promedios. El gráfico dibuja exactamente el rango que dicen sus tres líneas,
 * a cualquier nivel de reducción.
 *
 * Los bloques que quedan enteramente sin datos conservan sus nulos, así la
 * línea se sigue cortando donde no hubo mediciones.
 *
 * La etiqueta del eje X viaja sola: cada bloque se construye a partir de su
 * punto central, así que conserva su `fecha` o su `mes` sin que haya que
 * decirle cuál de los dos es.
 *
 * @param {Array} data - Serie ordenada, con `min_<k>`, `avg_<k>`, `max_<k>`
 * @param {number} threshold - Cantidad máxima de bloques
 * @param {string} valueKey - Sufijo de las claves (ej. 'caudal')
 * @returns {Array}
 */
export const resumirEnvolvente = (data, threshold, valueKey) => {
  if (!Array.isArray(data) || data.length <= threshold || threshold < 1) {
    return data;
  }

  const kMin = `min_${valueKey}`;
  const kAvg = `avg_${valueKey}`;
  const kMax = `max_${valueKey}`;

  const tam = data.length / threshold;
  const salida = [];

  for (let i = 0; i < threshold; i++) {
    const desde = Math.floor(i * tam);
    const hasta = Math.min(Math.floor((i + 1) * tam), data.length);
    if (desde >= hasta) continue;

    let min = null;
    let max = null;
    let suma = 0;
    let cuenta = 0;

    for (let j = desde; j < hasta; j++) {
      const p = data[j];
      if (typeof p[kMin] === 'number') min = min === null ? p[kMin] : Math.min(min, p[kMin]);
      if (typeof p[kMax] === 'number') max = max === null ? p[kMax] : Math.max(max, p[kMax]);
      if (typeof p[kAvg] === 'number') { suma += p[kAvg]; cuenta++; }
    }

    // Se parte del punto central del bloque para que la etiqueta del eje X no
    // se corra hacia el principio del rango.
    salida.push({
      ...data[Math.floor((desde + hasta - 1) / 2)],
      [kMin]: min,
      [kAvg]: cuenta > 0 ? suma / cuenta : null,
      [kMax]: max
    });
  }

  return salida;
};

/**
 * Optimiza los datos de series de tiempo mensuales y diarias
 * @param {Object} seriesData - Objeto con {mensual, diario}
 * @param {number} maxMonthlyPoints - Máximo de puntos mensuales
 * @param {number} maxDailyPoints - Máximo de puntos diarios
 * @returns {Object} - Datos optimizados
 */
export const optimizeTimeSeriesData = (seriesData, maxMonthlyPoints = 500, maxDailyPoints = 300) => {
  if (!seriesData) return { mensual: [], diario: [] };

  return {
    mensual: downsampleData(seriesData.mensual, maxMonthlyPoints),
    diario: downsampleData(seriesData.diario, maxDailyPoints)
  };
};
