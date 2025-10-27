import { useState, useEffect, useRef } from "react";
import { formatNumberCL } from "../../utils/formatNumberCL";
import { getPuntoTypeLabel } from "../../utils/mapUtils";
import { sanitizeText, safeFormatNumber } from "../../utils/sanitize";

// Caché global para evitar peticiones duplicadas
const puntoInfoCache = new Map();

export const PopupPunto = ({punto, handleShowSidebarCuencas, handleShowSidebarSubcuencas, handleShowSidebarPunto, apiService}) => {
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

  // Determinar si la subcuenca tiene registro o no
  const subcuencaNombre = sanitizeText(puntoInfo.nombre_subcuenca) || 'Sin registro';
  const subcuencaCodigo = puntoInfo.cod_subcuenca || 'sin_registro';

  // Sanitizar y validar datos antes de renderizar
  const safeCuencaNombre = sanitizeText(puntoInfo.nombre_cuenca);
  const safeTipo = sanitizeText(getPuntoTypeLabel(puntoInfo));
  const safeCaudalPromedio = safeFormatNumber(puntoInfo.caudal_promedio, 'es-CL', 'N/A');
  const safeMediciones = safeFormatNumber(puntoInfo.n_mediciones, 'es-CL', '0');

  return (
    <div className="text-sm flex flex-col justify-between items-start gap-2" style={{ minWidth: '280px' }}>
      <p className='flex gap-2 flex-wrap'>
        <strong>Cuenca:</strong> {safeCuencaNombre}
        <span
          onClick={() => handleShowSidebarCuencas(puntoInfo.nombre_cuenca, puntoInfo.cod_cuenca)}
          className='cuenca-analizar'
        >
          (Ver Detalles)
        </span>
      </p>
      <p className='flex gap-2 flex-wrap'>
        <strong>Subcuenca:</strong> {subcuencaNombre}
        <span
          onClick={() => handleShowSidebarSubcuencas(subcuencaNombre, subcuencaCodigo, puntoInfo.cod_cuenca, puntoInfo.nombre_cuenca)}
          className='subcuenca-analizar'
        >
          (Ver Detalles)
        </span>
      </p>
      <p><strong>Tipo:</strong> {safeTipo}</p>
      <p><strong>Caudal promedio:</strong> {safeCaudalPromedio} (L/s)</p>
      <p><strong>Nº de Mediciones:</strong> {safeMediciones}</p>
      <button
        className='bg-cyan-800 text-white p-2 cursor-pointer hover:bg-cyan-600 w-full mt-2'
        onClick={() => handleShowSidebarPunto({...punto, ...puntoInfo})}
      >
        Analizar Punto
      </button>
    </div>
  )
}
