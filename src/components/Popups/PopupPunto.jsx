import { useState, useEffect, useRef } from "react";
import { getPuntoTypeLabel, getMarkerColor } from "../../utils/mapUtils";
import { sanitizeText, safeFormatNumber } from "../../utils/sanitize";
import { getTiposTransmision, TIPO_TRANSMISION_LABEL } from "../../constants/tipoTransmision";

// Caché global para evitar peticiones duplicadas
const puntoInfoCache = new Map();

export const PopupPunto = ({ punto, handleShowSidebarCuencas, handleShowSidebarSubcuencas, handleShowSidebarShac, handleShowSidebarPunto, apiService }) => {
  const [puntoInfo, setPuntoInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Evitar fetch si ya se hizo para este componente
    if (hasFetchedRef.current) return;

    const cacheKey = `${punto.utm_norte}-${punto.utm_este}`;

    // Verificar si ya está en caché
    if (puntoInfoCache.has(cacheKey)) {
      setPuntoInfo(puntoInfoCache.get(cacheKey));
      setLoading(false);
      hasFetchedRef.current = true;
      return;
    }

    const fetchPuntoInfo = async () => {
      try {
        setLoading(true);
        const info = await apiService.getPuntoInfo(punto.utm_norte, punto.utm_este);

        // Guardar en caché
        puntoInfoCache.set(cacheKey, info);

        setPuntoInfo(info);
        hasFetchedRef.current = true;
      } catch (error) {
        console.error("Error al cargar información del punto:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPuntoInfo();
  }, [punto.utm_norte, punto.utm_este, apiService]);

  if (loading) {
    return (
      <div className="text-sm flex flex-col justify-center items-center" style={{ minWidth: '280px', minHeight: '200px', padding: '1rem' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-800"></div>
        <p className="mt-2 text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (!puntoInfo) {
    return (
      <div className="text-sm text-red-600">
        Error al cargar la información del punto
      </div>
    );
  }

  const subcuencaNombre = sanitizeText(puntoInfo.nombre_subcuenca) || 'Sin registro';
  const subcuencaCodigo = puntoInfo.cod_subcuenca || 'sin_registro';

  const safeCuencaNombre = sanitizeText(puntoInfo.nombre_cuenca);
  const safeTipo = sanitizeText(getPuntoTypeLabel(puntoInfo));
  const safeCodigo = sanitizeText(puntoInfo.codigo) || 'Sin código';
  const esSuperficial = puntoInfo.es_pozo_subterraneo === false;
  const geoLabel = esSuperficial ? 'Subsubcuenca' : 'SHAC';
  const geoValue = esSuperficial
    ? (sanitizeText(puntoInfo.nombre_subsubcuenca) || '—')
    : (sanitizeText(puntoInfo.sector_sha) || '—');
  const safeCaudalPromedio = safeFormatNumber(puntoInfo.caudal_promedio, 'es-CL', 'N/A');
  const safeMediciones = safeFormatNumber(puntoInfo.n_mediciones, 'es-CL', '0');

  const accentColor = getMarkerColor(puntoInfo);

  const showJunta = puntoInfo.parte_junta === true && puntoInfo.id_junta != null;
  const showCanal = (puntoInfo.canales_transmision?.length > 0)
    || (puntoInfo.canal_transmision != null && String(puntoInfo.canal_transmision).trim() !== '');
  const safeCanal = showCanal
    ? sanitizeText(getTiposTransmision(puntoInfo.canales_transmision, puntoInfo.canal_transmision))
    : null;

  return (
    <div
      className="text-sm bg-white rounded-md overflow-hidden border-l-4 px-3 py-2"
      style={{ minWidth: '280px', borderLeftColor: accentColor }}
    >
      <div className="mb-2">
        <p className="text-sm font-semibold text-gray-900 leading-tight">{safeTipo}</p>
        <p className="text-xs font-mono font-bold text-gray-900">{safeCodigo}</p>
      </div>

      <hr className="border-gray-200 mb-2" />

      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 items-baseline">
        <span className="text-xs font-semibold text-gray-500">Cuenca</span>
        <span
          onClick={() => handleShowSidebarCuencas(puntoInfo.nombre_cuenca, puntoInfo.cod_cuenca)}
          className="font-medium underline underline-offset-2 cursor-pointer hover:opacity-70 transition-opacity"
          style={{ color: accentColor }}
        >
          {safeCuencaNombre}
        </span>

        <span className="text-xs font-semibold text-gray-500">Subcuenca</span>
        <span
          onClick={() => handleShowSidebarSubcuencas(subcuencaNombre, subcuencaCodigo, puntoInfo.cod_cuenca, puntoInfo.nombre_cuenca)}
          className="font-medium underline underline-offset-2 cursor-pointer hover:opacity-70 transition-opacity"
          style={{ color: accentColor }}
        >
          {subcuencaNombre}
        </span>

        {puntoInfo.sector_sha && puntoInfo.cod_sector_sha != null && (
          <>
            <span className="text-xs font-semibold text-gray-500">SHAC</span>
            <span
              onClick={() => handleShowSidebarShac(puntoInfo.sector_sha, puntoInfo.cod_sector_sha)}
              className="font-medium underline underline-offset-2 cursor-pointer hover:opacity-70 transition-opacity"
              style={{ color: accentColor }}
            >
              {puntoInfo.sector_sha}
            </span>
          </>
        )}

        <span className="text-xs font-semibold text-gray-500">{geoLabel}</span>
        <span className="text-gray-900">{geoValue}</span>

        {showJunta && (
          <>
            <span className="text-xs font-semibold text-gray-500">Junta vigil.</span>
            <span className="text-gray-900">
              Junta {puntoInfo.id_junta}
            </span>
          </>
        )}

        {showCanal && (
          <>
            <span className="text-xs font-semibold text-gray-500">{TIPO_TRANSMISION_LABEL}</span>
            <span className="text-gray-900">{safeCanal}</span>
          </>
        )}

        <span className="text-xs font-semibold text-gray-500">Caudal prom. histórico</span>
        <span className="text-gray-900">{safeCaudalPromedio} L/s</span>

        <span className="text-xs font-semibold text-gray-500">Nº mediciones históricas</span>
        <span className="text-gray-900">{safeMediciones}</span>
      </div>

      <button
        className="w-full mt-3 px-3 py-2 text-sm font-semibold text-white rounded cursor-pointer transition-opacity hover:opacity-90"
        style={{ backgroundColor: accentColor }}
        onClick={() => handleShowSidebarPunto({ ...punto, ...puntoInfo })}
      >
        Analizar Punto
      </button>
    </div>
  );
}
