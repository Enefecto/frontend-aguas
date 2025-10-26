import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

export const ComparePointsModal = ({ isOpen, onClose, point1, point2, apiService }) => {
  const [loading, setLoading] = useState(false);
  const [data1, setData1] = useState(null);
  const [data2, setData2] = useState(null);
  const [point1Info, setPoint1Info] = useState(null);
  const [point2Info, setPoint2Info] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen && point1 && point2) {
      // Resetear estados inmediatamente para mostrar loading
      setIsClosing(false);
      setLoading(true);
      setData1(null);
      setData2(null);
      setPoint1Info(null);
      setPoint2Info(null);

      loadComparisonData();
    }
  }, [isOpen, point1, point2]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300); // Duración de la animación
  };

  const loadComparisonData = async () => {
    setLoading(true);
    try {
      // Verificar que los puntos tienen las coordenadas UTM necesarias
      if (!point1.utm_norte || !point1.utm_este) {
        setData1({ caudal: [], nivel_freatico: [], altura_limnimetrica: [] });
        setLoading(false);
        return;
      }
      if (!point2.utm_norte || !point2.utm_este) {
        setData2({ caudal: [], nivel_freatico: [], altura_limnimetrica: [] });
        setLoading(false);
        return;
      }

      // Cargar información completa de los puntos
      const [info1, info2] = await Promise.all([
        apiService.getPuntoInfo(point1.utm_norte, point1.utm_este).catch(() => ({})),
        apiService.getPuntoInfo(point2.utm_norte, point2.utm_este).catch(() => ({}))
      ]);

      setPoint1Info(info1);
      setPoint2Info(info2);

      // Helper para manejar errores de "No se encontraron datos" sin mostrar en consola
      const handleApiCall = async (apiCall) => {
        try {
          const result = await apiCall();
          return result;
        } catch (error) {
          // Suprimir completamente errores de consola (404 es normal cuando no hay datos)
          // No mostrar nada para mantener la API confidencial
          return { datos: [] };
        }
      };

      // Cargar datos de ambos puntos en paralelo
      const [caudal1, nivel1, altura1, caudal2, nivel2, altura2] = await Promise.all([
        handleApiCall(() => apiService.getPuntosSeriesTiempo(point1.utm_norte, point1.utm_este)),
        handleApiCall(() => apiService.getPuntosSeriesTiempoNivelFreatico(point1.utm_norte, point1.utm_este)),
        handleApiCall(() => apiService.getPuntosSeriesTiempoAlturaLimnimetrica(point1.utm_norte, point1.utm_este)),
        handleApiCall(() => apiService.getPuntosSeriesTiempo(point2.utm_norte, point2.utm_este)),
        handleApiCall(() => apiService.getPuntosSeriesTiempoNivelFreatico(point2.utm_norte, point2.utm_este)),
        handleApiCall(() => apiService.getPuntosSeriesTiempoAlturaLimnimetrica(point2.utm_norte, point2.utm_este))
      ]);

      // Normalizar datos: la API devuelve campos diferentes según el tipo de dato
      const normalizarCaudal = (data) => {
        if (!data) return [];
        const datos = data.caudal_por_tiempo || data.datos || [];
        return datos.map(item => ({
          fecha: item.fecha_medicion || item.fecha,
          valor: item.caudal !== undefined ? item.caudal : item.valor
        }));
      };

      const normalizarNivel = (data) => {
        if (!data) return [];
        // La API devuelve 'nivel_por_tiempo' con campo 'nivel_freatico'
        const datos = data.nivel_por_tiempo || data.nivel_freatico_por_tiempo || data.datos || [];
        return datos.map(item => ({
          fecha: item.fecha_medicion || item.fecha,
          valor: item.nivel_freatico !== undefined ? item.nivel_freatico : item.valor
        }));
      };

      const normalizarAltura = (data) => {
        if (!data) return [];
        // La API devuelve 'altura_por_tiempo' con campo 'altura_linimetrica'
        const datos = data.altura_por_tiempo || data.altura_limnimetrica_por_tiempo || data.datos || [];
        return datos.map(item => ({
          fecha: item.fecha_medicion || item.fecha,
          valor: item.altura_linimetrica !== undefined ? item.altura_linimetrica : (item.altura_limnimetrica !== undefined ? item.altura_limnimetrica : item.valor)
        }));
      };

      const data1Normalized = {
        caudal: normalizarCaudal(caudal1),
        nivel_freatico: normalizarNivel(nivel1),
        altura_limnimetrica: normalizarAltura(altura1)
      };

      const data2Normalized = {
        caudal: normalizarCaudal(caudal2),
        nivel_freatico: normalizarNivel(nivel2),
        altura_limnimetrica: normalizarAltura(altura2)
      };

      setData1(data1Normalized);
      setData2(data2Normalized);
    } catch (error) {
      // Suprimir errores de consola para mantener la API confidencial
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Determinar qué tipos de datos existen
  const hasCaudal1 = data1?.caudal && data1.caudal.length > 0;
  const hasCaudal2 = data2?.caudal && data2.caudal.length > 0;
  const hasNivel1 = data1?.nivel_freatico && data1.nivel_freatico.length > 0;
  const hasNivel2 = data2?.nivel_freatico && data2.nivel_freatico.length > 0;
  const hasAltura1 = data1?.altura_limnimetrica && data1.altura_limnimetrica.length > 0;
  const hasAltura2 = data2?.altura_limnimetrica && data2.altura_limnimetrica.length > 0;

  // Combinar datos para gráficos comparativos
  const getCombinedCaudalData = () => {
    if (!hasCaudal1 && !hasCaudal2) return null;

    const combined = [];
    const dates = new Set();

    if (hasCaudal1) {
      data1.caudal.forEach(item => {
        dates.add(item.fecha);
        combined.push({
          fecha: item.fecha,
          [`caudal_punto1`]: item.valor,
          [`caudal_punto2`]: null
        });
      });
    }

    if (hasCaudal2) {
      data2.caudal.forEach(item => {
        const existing = combined.find(d => d.fecha === item.fecha);
        if (existing) {
          existing[`caudal_punto2`] = item.valor;
        } else {
          combined.push({
            fecha: item.fecha,
            [`caudal_punto1`]: null,
            [`caudal_punto2`]: item.valor
          });
        }
      });
    }

    return combined.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  };

  const getCombinedNivelData = () => {
    if (!hasNivel1 && !hasNivel2) return null;

    const combined = [];

    if (hasNivel1) {
      data1.nivel_freatico.forEach(item => {
        combined.push({
          fecha: item.fecha,
          [`nivel_punto1`]: item.valor,
          [`nivel_punto2`]: null
        });
      });
    }

    if (hasNivel2) {
      data2.nivel_freatico.forEach(item => {
        const existing = combined.find(d => d.fecha === item.fecha);
        if (existing) {
          existing[`nivel_punto2`] = item.valor;
        } else {
          combined.push({
            fecha: item.fecha,
            [`nivel_punto1`]: null,
            [`nivel_punto2`]: item.valor
          });
        }
      });
    }

    return combined.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  };

  const getCombinedAlturaData = () => {
    if (!hasAltura1 && !hasAltura2) return null;

    const combined = [];

    if (hasAltura1) {
      data1.altura_limnimetrica.forEach(item => {
        combined.push({
          fecha: item.fecha,
          [`altura_punto1`]: item.valor,
          [`altura_punto2`]: null
        });
      });
    }

    if (hasAltura2) {
      data2.altura_limnimetrica.forEach(item => {
        const existing = combined.find(d => d.fecha === item.fecha);
        if (existing) {
          existing[`altura_punto2`] = item.valor;
        } else {
          combined.push({
            fecha: item.fecha,
            [`altura_punto1`]: null,
            [`altura_punto2`]: item.valor
          });
        }
      });
    }

    return combined.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  };

  const combinedCaudalData = getCombinedCaudalData();
  const combinedNivelData = getCombinedNivelData();
  const combinedAlturaData = getCombinedAlturaData();

  return (
    <>
      {/* Overlay con blur sin fondo negro */}
      <div
        className={`fixed inset-0 backdrop-blur-md z-[9998] transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`fixed z-[9999] bg-white shadow-2xl overflow-hidden
          inset-0
          md:inset-auto md:top-1/2 md:left-1/2 md:w-[90vw] md:max-w-6xl md:h-[85vh] md:rounded-2xl
          ${isClosing ? 'animate-slideDownOut' : 'animate-slideUpIn'}
        `}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19,3H14V5H19V18L14,12V21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M10,18H5L10,12M10,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H10V23H12V1H10V3Z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Comparación de Puntos</h2>
              <p className="text-cyan-100 text-sm">Análisis comparativo de series temporales</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-80px)] overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando datos de comparación...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Info de puntos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Punto 1 */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                      1
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-blue-900 text-lg mb-2">Punto 1</h3>
                      <div className="space-y-1 text-sm">
                        {point1Info?.codigo && (
                          <p className="text-blue-800">
                            <span className="font-medium">Código:</span> {point1Info.codigo}
                          </p>
                        )}
                        <p className="text-blue-700">
                          <span className="font-medium">Latitud:</span> {point1.lat?.toFixed(6)}
                        </p>
                        <p className="text-blue-700">
                          <span className="font-medium">Longitud:</span> {point1.lon?.toFixed(6)}
                        </p>
                        {point1Info?.nombre_cuenca && (
                          <p className="text-blue-700">
                            <span className="font-medium">Cuenca:</span> {point1Info.nombre_cuenca}
                          </p>
                        )}
                        <p className="text-blue-700">
                          <span className="font-medium">Subcuenca:</span> {point1Info?.nombre_subcuenca || 'Sin Registro'}
                        </p>
                        {point1Info?.tipo_extraccion && (
                          <p className="text-blue-700">
                            <span className="font-medium">Tipo:</span> {point1Info.tipo_extraccion}
                          </p>
                        )}
                        <div className="text-blue-700">
                          <span className="font-medium">Mediciones:</span>
                          <div className="ml-4 mt-1 space-y-0.5 text-xs">
                            <p>• Caudal: {data1?.caudal?.length || 0}</p>
                            <p>• Nivel freático: {data1?.nivel_freatico?.length || 0}</p>
                            <p>• Altura limnimétrica: {data1?.altura_limnimetrica?.length || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Punto 2 */}
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                      2
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-orange-900 text-lg mb-2">Punto 2</h3>
                      <div className="space-y-1 text-sm">
                        {point2Info?.codigo && (
                          <p className="text-orange-800">
                            <span className="font-medium">Código:</span> {point2Info.codigo}
                          </p>
                        )}
                        <p className="text-orange-700">
                          <span className="font-medium">Latitud:</span> {point2.lat?.toFixed(6)}
                        </p>
                        <p className="text-orange-700">
                          <span className="font-medium">Longitud:</span> {point2.lon?.toFixed(6)}
                        </p>
                        {point2Info?.nombre_cuenca && (
                          <p className="text-orange-700">
                            <span className="font-medium">Cuenca:</span> {point2Info.nombre_cuenca}
                          </p>
                        )}
                        <p className="text-orange-700">
                          <span className="font-medium">Subcuenca:</span> {point2Info?.nombre_subcuenca || 'Sin Registro'}
                        </p>
                        {point2Info?.tipo_extraccion && (
                          <p className="text-orange-700">
                            <span className="font-medium">Tipo:</span> {point2Info.tipo_extraccion}
                          </p>
                        )}
                        <div className="text-orange-700">
                          <span className="font-medium">Mediciones:</span>
                          <div className="ml-4 mt-1 space-y-0.5 text-xs">
                            <p>• Caudal: {data2?.caudal?.length || 0}</p>
                            <p>• Nivel freático: {data2?.nivel_freatico?.length || 0}</p>
                            <p>• Altura limnimétrica: {data2?.altura_limnimetrica?.length || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráficos */}
              <div className="space-y-8">
                {/* Caudal */}
                {combinedCaudalData ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-cyan-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,3.77L11.25,4.61C11.25,4.61 9.97,6.06 8.68,7.94C7.39,9.82 6,12.07 6,14.23A6,6 0 0,0 12,20.23A6,6 0 0,0 18,14.23C18,12.07 16.61,9.82 15.32,7.94C14.03,6.06 12.75,4.61 12.75,4.61L12,3.77M12,6.9C12.44,7.42 12.84,7.85 13.68,9.07C14.89,10.83 16,13.07 16,14.23C16,16.45 14.22,18.23 12,18.23C9.78,18.23 8,16.45 8,14.23C8,13.07 9.11,10.83 10.32,9.07C11.16,7.85 11.56,7.42 12,6.9Z"/>
                      </svg>
                      Comparación de Caudal (L/s)
                    </h3>
                    {!hasCaudal1 && hasCaudal2 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
                        ⚠️ El Punto 1 no tiene datos de caudal
                      </div>
                    )}
                    {hasCaudal1 && !hasCaudal2 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
                        ⚠️ El Punto 2 no tiene datos de caudal
                      </div>
                    )}
                    <ComparisonChart
                      data={combinedCaudalData}
                      dataKey1="caudal_punto1"
                      dataKey2="caudal_punto2"
                      label1="Punto 1"
                      label2="Punto 2"
                      color1="#3B82F6"
                      color2="#F97316"
                      yAxisLabel="Caudal (L/s)"
                      hasData1={hasCaudal1}
                      hasData2={hasCaudal2}
                    />
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600">No hay datos de caudal disponibles para ninguno de los puntos</p>
                  </div>
                )}

                {/* Nivel Freático */}
                {combinedNivelData && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-cyan-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,3.77L11.25,4.61C11.25,4.61 9.97,6.06 8.68,7.94C7.39,9.82 6,12.07 6,14.23A6,6 0 0,0 12,20.23A6,6 0 0,0 18,14.23C18,12.07 16.61,9.82 15.32,7.94C14.03,6.06 12.75,4.61 12.75,4.61L12,3.77M12,6.9C12.44,7.42 12.84,7.85 13.68,9.07C14.89,10.83 16,13.07 16,14.23C16,16.45 14.22,18.23 12,18.23C9.78,18.23 8,16.45 8,14.23C8,13.07 9.11,10.83 10.32,9.07C11.16,7.85 11.56,7.42 12,6.9Z"/>
                      </svg>
                      Comparación de Nivel Freático (m)
                    </h3>
                    {!hasNivel1 && hasNivel2 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
                        ⚠️ El Punto 1 no tiene datos de nivel freático
                      </div>
                    )}
                    {hasNivel1 && !hasNivel2 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
                        ⚠️ El Punto 2 no tiene datos de nivel freático
                      </div>
                    )}
                    <ComparisonChart
                      data={combinedNivelData}
                      dataKey1="nivel_punto1"
                      dataKey2="nivel_punto2"
                      label1="Punto 1"
                      label2="Punto 2"
                      color1="#3B82F6"
                      color2="#F97316"
                      yAxisLabel="Nivel (m)"
                      hasData1={hasNivel1}
                      hasData2={hasNivel2}
                    />
                  </div>
                )}

                {/* Altura Limnimétrica */}
                {combinedAlturaData && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-cyan-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,3.77L11.25,4.61C11.25,4.61 9.97,6.06 8.68,7.94C7.39,9.82 6,12.07 6,14.23A6,6 0 0,0 12,20.23A6,6 0 0,0 18,14.23C18,12.07 16.61,9.82 15.32,7.94C14.03,6.06 12.75,4.61 12.75,4.61L12,3.77M12,6.9C12.44,7.42 12.84,7.85 13.68,9.07C14.89,10.83 16,13.07 16,14.23C16,16.45 14.22,18.23 12,18.23C9.78,18.23 8,16.45 8,14.23C8,13.07 9.11,10.83 10.32,9.07C11.16,7.85 11.56,7.42 12,6.9Z"/>
                      </svg>
                      Comparación de Altura Limnimétrica (m)
                    </h3>
                    {!hasAltura1 && hasAltura2 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
                        ⚠️ El Punto 1 no tiene datos de altura limnimétrica
                      </div>
                    )}
                    {hasAltura1 && !hasAltura2 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
                        ⚠️ El Punto 2 no tiene datos de altura limnimétrica
                      </div>
                    )}
                    <ComparisonChart
                      data={combinedAlturaData}
                      dataKey1="altura_punto1"
                      dataKey2="altura_punto2"
                      label1="Punto 1"
                      label2="Punto 2"
                      color1="#3B82F6"
                      color2="#F97316"
                      yAxisLabel="Altura (m)"
                      hasData1={hasAltura1}
                      hasData2={hasAltura2}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Componente auxiliar para gráficos de comparación
const ComparisonChart = ({ data, dataKey1, dataKey2, label1, label2, color1, color2, yAxisLabel, hasData1 = true, hasData2 = true }) => {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('todos');

  // Calcular información del rango de fechas
  const dateRangeInfo = React.useMemo(() => {
    if (!data || data.length === 0) return null;

    const dates = data.map(d => new Date(d.fecha)).sort((a, b) => a - b);
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];

    // Calcular años de diferencia
    const diffYears = (lastDate - firstDate) / (1000 * 60 * 60 * 24 * 365.25);

    return {
      firstDate,
      lastDate,
      totalYears: diffYears
    };
  }, [data]);

  // Determinar qué botones de período mostrar
  const availablePeriods = React.useMemo(() => {
    if (!dateRangeInfo) return [];

    const periods = [1, 2, 3, 5];
    // Solo mostrar períodos que sean menores o iguales al rango total de datos
    return periods.filter(period => period <= dateRangeInfo.totalYears);
  }, [dateRangeInfo]);

  // Filtrar datos por período (relativo a la última fecha, NO a la fecha actual)
  const filteredData = React.useMemo(() => {
    if (!data || periodoSeleccionado === 'todos' || !dateRangeInfo) return data;

    const lastDate = dateRangeInfo.lastDate;
    const cutoffDate = new Date(lastDate);
    cutoffDate.setFullYear(lastDate.getFullYear() - periodoSeleccionado);

    return data.filter(d => new Date(d.fecha) >= cutoffDate);
  }, [data, periodoSeleccionado, dateRangeInfo]);

  // Downsampling con promediado para suavizado
  const downsampledData = React.useMemo(() => {
    if (!filteredData || filteredData.length === 0) return filteredData;

    const MAX_POINTS = 500; // Puntos a mostrar en el gráfico

    if (filteredData.length <= MAX_POINTS) {
      return filteredData;
    }

    const sampled = [];
    const bucketSize = filteredData.length / MAX_POINTS;

    for (let i = 0; i < MAX_POINTS; i++) {
      const start = Math.floor(i * bucketSize);
      const end = Math.floor((i + 1) * bucketSize);

      // Calcular promedios para suavizar
      let sumVal1 = 0;
      let sumVal2 = 0;
      let count1 = 0;
      let count2 = 0;
      let fecha = filteredData[start].fecha;

      for (let j = start; j < end && j < filteredData.length; j++) {
        const val1 = filteredData[j][dataKey1];
        const val2 = filteredData[j][dataKey2];

        if (val1 !== null && val1 !== undefined) {
          sumVal1 += val1;
          count1++;
        }
        if (val2 !== null && val2 !== undefined) {
          sumVal2 += val2;
          count2++;
        }

        // Usar la fecha del punto medio del bucket
        if (j === Math.floor((start + end) / 2)) {
          fecha = filteredData[j].fecha;
        }
      }

      sampled.push({
        fecha: fecha,
        [dataKey1]: count1 > 0 ? sumVal1 / count1 : null,
        [dataKey2]: count2 > 0 ? sumVal2 / count2 : null
      });
    }

    return sampled;
  }, [filteredData, dataKey1, dataKey2]);

  return (
    <div className="space-y-4">
      {/* Selector de período */}
      {dateRangeInfo && availablePeriods.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setPeriodoSeleccionado('todos')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              periodoSeleccionado === 'todos'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          {availablePeriods.map(years => (
            <button
              key={years}
              onClick={() => setPeriodoSeleccionado(years)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                periodoSeleccionado === years
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {years} {years === 1 ? 'año' : 'años'}
            </button>
          ))}
        </div>
      )}

      {/* Gráfico usando Recharts */}
      <div className="w-full h-[300px] md:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={downsampledData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="fecha"
              tickFormatter={(date) => new Date(date).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#6b7280' } }}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              labelFormatter={(date) => new Date(date).toLocaleDateString('es-ES')}
              formatter={(value, name) => {
                if (value === null || value === undefined) return ['-', name];
                return [value.toFixed(2), name === dataKey1 ? label1 : label2];
              }}
            />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            {hasData1 && (
              <Line
                type="monotone"
                dataKey={dataKey1}
                stroke={color1}
                strokeWidth={1.5}
                dot={false}
                name={label1}
                connectNulls={true}
                animationDuration={800}
                animationEasing="ease-in-out"
              />
            )}
            {hasData2 && (
              <Line
                type="monotone"
                dataKey={dataKey2}
                stroke={color2}
                strokeWidth={1.5}
                dot={false}
                name={label2}
                connectNulls={true}
                animationDuration={800}
                animationEasing="ease-in-out"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
