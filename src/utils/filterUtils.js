import { FILTER_CONFIG } from '../constants/apiEndpoints.js';
import { getNombreRegion } from '../constants/regionesChile.js';
import { calcularFechasPredefinidas } from './fechasPredefinidas.js';
import { validateFilterInput, validateWhitelist, validateNumber } from './sanitize.js';

// Constantes de validación
const CAUDAL_MIN_LIMIT = 0;
const CAUDAL_MAX_LIMIT = 1000000; // 1 millón l/s como límite superior razonable
const LIMIT_MIN = 1;
const LIMIT_MAX = 10000; // Límite superior para prevenir sobrecarga
const ALLOWED_POZO_VALUES = ['true', 'false', ''];
const ALLOWED_FILTRO_NULL_VALUES = ['true', 'false'];

export const buildQueryParams = (filtros, filtroCaudal, ordenCaudal, datosOriginales, limitMax = FILTER_CONFIG.DEFAULT_LIMIT_MAX) => {
  const cuencaCod = datosOriginales.find(
    d => d.nom_cuenca === filtros.cuenca
  )?.cod_cuenca;

  let subcuencaCod;

  if (filtros.subcuenca === 'No registrada') {
    subcuencaCod = null;
  } else {
    subcuencaCod = datosOriginales.find(
      d => d.nom_subcuenca === filtros.subcuenca
    )?.cod_subcuenca;
  }

  const queryParams = new URLSearchParams();

  // Filtros soportados por la API con validación

  // Región: validar que sea un número
  if (filtros.region) {
    const regionValidada = validateNumber(filtros.region, null);
    if (regionValidada !== null) {
      queryParams.append("region", String(regionValidada));
    }
  }

  if (cuencaCod !== undefined) {
    queryParams.append("cod_cuenca", String(cuencaCod));
  }

  if (filtros.subcuenca === 'No registrada') {
    // Validar que solo sea 'true' o 'false'
    const filtroNullValidado = validateWhitelist('true', ALLOWED_FILTRO_NULL_VALUES, 'true');
    queryParams.append("filtro_null_subcuenca", filtroNullValidado);
  } else if (subcuencaCod !== undefined) {
    queryParams.append("cod_subcuenca", String(subcuencaCod));
  }

  // Validar caudales: asegurar que estén en rangos razonables
  const caudalMinValidado = validateFilterInput(
    filtroCaudal[0],
    CAUDAL_MIN_LIMIT,
    CAUDAL_MAX_LIMIT,
    0
  );
  const caudalMaxValidado = validateFilterInput(
    filtroCaudal[1],
    CAUDAL_MIN_LIMIT,
    CAUDAL_MAX_LIMIT,
    1000
  );

  queryParams.append("caudal_minimo", String(caudalMinValidado));
  queryParams.append("caudal_maximo", String(caudalMaxValidado));

  // Validar limit: usar el máximo dinámico de puntos disponibles
  const effectiveLimitMax = Math.max(limitMax, LIMIT_MIN);
  const limitValidado = validateFilterInput(
    filtros.limit || effectiveLimitMax,
    LIMIT_MIN,
    effectiveLimitMax,
    effectiveLimitMax
  );
  queryParams.append("limit", String(limitValidado));

  // Filtro de tipo de punto (pozo) - validar contra whitelist
  if (filtros.pozo !== undefined && filtros.pozo !== "") {
    const pozoValidado = validateWhitelist(
      String(filtros.pozo),
      ALLOWED_POZO_VALUES,
      ''
    );
    if (pozoValidado !== '') {
      queryParams.append("pozo", pozoValidado);
    }
  }

  // Filtro de código de obra
  if (filtros.codigo_obra) {
    queryParams.append("codigo_obra", String(filtros.codigo_obra).trim());
  }

  // Filtro SHAC
  if (filtros.shac) {
    queryParams.append("shac", String(filtros.shac));
  }

  // Filtro APR
  if (filtros.apr !== undefined && filtros.apr !== "") {
    queryParams.append("apr", String(filtros.apr));
  }

  // Filtro Junta
  if (filtros.id_junta) {
    queryParams.append("id_junta", String(filtros.id_junta));
  }

  return queryParams;
};

export const getFilteredOptions = (datosOriginales, filtros) => {
  // Obtener códigos únicos y mapearlos a objetos con código y nombre
  const codigosRegionesUnicas = [...new Set(datosOriginales.map(d => d.cod_region))];
  const regionesUnicas = codigosRegionesUnicas.map(codigo => ({
    value: codigo,
    label: getNombreRegion(codigo)
  }));

  const cuencasFiltradas = datosOriginales
    .filter(d => !filtros.region || d.cod_region.toString() === filtros.region)
    .map(d => d.nom_cuenca);

  const cuencasUnicas = [...new Set(cuencasFiltradas)];

  const subcuencasFiltradas = datosOriginales
    .filter(d =>
      (!filtros.region || d.cod_region.toString() === filtros.region) &&
      (!filtros.cuenca || d.nom_cuenca === filtros.cuenca)
    )
    .map(d => d.nom_subcuenca ?? 'No registrada');

  const subcuencasUnicas = [...new Set(subcuencasFiltradas)];

  return {
    regionesUnicas,
    cuencasUnicas,
    subcuencasUnicas
  };
};

// Normaliza un objeto de rango de caudal aceptando tanto camelCase como snake_case
const normalizeCaudalRange = (obj) => {
  if (!obj) return null;
  return {
    avgMin: obj.avgMin ?? obj.avg_min ?? 0,
    avgMax: obj.avgMax ?? obj.avg_max ?? 1000,
  };
};

const computeGlobalRangeFromCuencas = (caudal_por_cuenca) => {
  if (!caudal_por_cuenca?.length) return { avgMin: 0, avgMax: 1000 };
  let globalMin = Infinity;
  let globalMax = -Infinity;
  for (const c of caudal_por_cuenca) {
    if (c.nom_cuenca === null) continue; // ignorar puntos sin cuenca asignada
    const min = c.avgMin ?? c.avg_min;
    const max = c.avgMax ?? c.avg_max;
    if (min != null && !isNaN(min)) globalMin = Math.min(globalMin, min);
    if (max != null && !isNaN(max)) globalMax = Math.max(globalMax, max);
  }
  if (!isFinite(globalMin) || !isFinite(globalMax)) return { avgMin: 0, avgMax: 1000 };
  return { avgMin: globalMin, avgMax: globalMax };
};

export const calculateCaudalRange = (filtros, minMaxDatosOriginales, isLoaded) => {
  if (!isLoaded || !minMaxDatosOriginales) return { avgMin: 0, avgMax: 1000 };

  const { caudal_global, caudal_por_cuenca, caudal_por_subcuenca } = minMaxDatosOriginales;

  // Intentar buscar por subcuenca si existe
  if (filtros.subcuenca) {
    const resultSub = caudal_por_subcuenca?.find(c =>
      (c.nom_subcuenca ?? 'No registrada') === filtros.subcuenca &&
      (!filtros.cuenca || c.nom_cuenca === filtros.cuenca)
    );
    if (resultSub) return normalizeCaudalRange(resultSub);
  }

  // Buscar por cuenca si está definida
  if (filtros.cuenca) {
    const resultCuenca = caudal_por_cuenca?.find(c => c.nom_cuenca === filtros.cuenca);
    if (resultCuenca) return normalizeCaudalRange(resultCuenca);
  }

  // Global: usar caudal_global si tiene datos, sino computar desde cuencas
  const globalNorm = normalizeCaudalRange(caudal_global);
  if (globalNorm.avgMax > 0) return globalNorm;
  return computeGlobalRangeFromCuencas(caudal_por_cuenca);
};

export const calculateLimitMax = (filtros, minMaxDatosOriginales, isLoaded) => {
  if (!isLoaded || !minMaxDatosOriginales) return FILTER_CONFIG.DEFAULT_LIMIT_MAX;

  const { caudal_global, caudal_por_cuenca, caudal_por_subcuenca } = minMaxDatosOriginales;
  if (!caudal_global) return FILTER_CONFIG.DEFAULT_LIMIT_MAX;

  // Subcuenca seleccionada
  if (filtros.subcuenca) {
    // Caso especial: No registrada
    if (filtros.subcuenca === 'No registrada') {
      // Si NO hay cuenca seleccionada, sumar todos los 'No registrada'
      if (!filtros.cuenca) {
        const total = caudal_por_subcuenca
          .filter(s => (s.nom_subcuenca ?? 'No registrada') === 'No registrada')
          .reduce((acc, curr) => acc + (curr.total_puntos || 0), 0);
        return total || FILTER_CONFIG.DEFAULT_LIMIT_MAX;
      }

      // Si hay cuenca, buscar específicamente esa subcuenca null
      const matchSub = caudal_por_subcuenca.find(s =>
        (s.nom_subcuenca ?? 'No registrada') === 'No registrada' &&
        s.nom_cuenca === filtros.cuenca
      );
      if (matchSub) return matchSub.total_puntos || FILTER_CONFIG.DEFAULT_LIMIT_MAX;
    }

    // Subcuenca normal (no null)
    const matchSub = caudal_por_subcuenca.find(s =>
      s.nom_subcuenca === filtros.subcuenca &&
      (!filtros.cuenca || s.nom_cuenca === filtros.cuenca)
    );
    if (matchSub) return matchSub.total_puntos || FILTER_CONFIG.DEFAULT_LIMIT_MAX;
  }

  // Cuenca seleccionada
  if (filtros.cuenca) {
    const matchCuenca = caudal_por_cuenca.find(
      c => c.nom_cuenca === filtros.cuenca
    );
    if (matchCuenca) return matchCuenca.total_puntos || FILTER_CONFIG.DEFAULT_LIMIT_MAX;
  }

  // Sumar total_puntos de todas las cuencas nombradas (excluyendo puntos sin cuenca)
  const totalDesdeCuencas = caudal_por_cuenca
    ?.filter(c => c.nom_cuenca !== null)
    .reduce((acc, c) => acc + (c.total_puntos || 0), 0);
  if (totalDesdeCuencas > 0) return totalDesdeCuencas;

  return caudal_global.total_puntos_unicos ?? caudal_global.total_puntos ?? caudal_global.count ?? FILTER_CONFIG.DEFAULT_LIMIT_MAX;
};