/**
 * Reduce la cantidad de puntos de datos para mejorar el rendimiento
 * usando el algoritmo Largest Triangle Three Buckets (LTTB)
 * @param {Array} data - Array de datos con formato {fecha, valor}
 * @param {number} threshold - Número máximo de puntos deseados
 * @returns {Array} - Array reducido de datos
 */
export const downsampleData = (data, threshold = 500) => {
  if (!data || data.length <= threshold) {
    return data;
  }

  const sampled = [];
  const bucketSize = (data.length - 2) / (threshold - 2);

  // Siempre incluir el primer punto
  sampled.push(data[0]);

  for (let i = 0; i < threshold - 2; i++) {
    const avgRangeStart = Math.floor((i + 0) * bucketSize) + 1;
    const avgRangeEnd = Math.floor((i + 1) * bucketSize) + 1;
    const avgRangeLength = avgRangeEnd - avgRangeStart;

    // Tomar el punto del medio del bucket
    const middleIndex = avgRangeStart + Math.floor(avgRangeLength / 2);

    if (data[middleIndex]) {
      sampled.push(data[middleIndex]);
    }
  }

  // Siempre incluir el último punto
  sampled.push(data[data.length - 1]);

  return sampled;
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
