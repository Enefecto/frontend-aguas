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

export const buildQueryParams = (filtros, filtroCaudal, ordenCaudal, datosOriginales) => {
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

  // Validar limit: asegurar que esté en rango razonable
  const limitValidado = validateFilterInput(
    filtros.limit || 120,
    LIMIT_MIN,
    LIMIT_MAX,
    120
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

export const calculateCaudalRange = (filtros, minMaxDatosOriginales, isLoaded) => {
  if (!isLoaded || !minMaxDatosOriginales) return { avgMin: 0, avgMax: 1000 };

  const { caudal_global, caudal_por_cuenca, caudal_por_subcuenca } = minMaxDatosOriginales;

  // Intentar buscar por subcuenca si existe
  if (filtros.subcuenca) {
    const resultSub = caudal_por_subcuenca.find(c =>
      (c.nom_subcuenca ?? 'No registrada') === filtros.subcuenca &&
      (!filtros.cuenca || c.nom_cuenca === filtros.cuenca)
    );
    if (resultSub) return resultSub;
  }

  // Buscar por cuenca si está definida
  if (filtros.cuenca) {
    const resultCuenca = caudal_por_cuenca.find(c => c.nom_cuenca === filtros.cuenca);
    if (resultCuenca) return resultCuenca;
  }

  // Si nada coincide, retornar global
  return caudal_global;
};

export const calculateLimitMax = (filtros, minMaxDatosOriginales, isLoaded) => {
  if (!isLoaded || !minMaxDatosOriginales) return FILTER_CONFIG.DEFAULT_LIMIT_MAX;

  const { caudal_global, caudal_por_cuenca, caudal_por_subcuenca } = minMaxDatosOriginales;

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

  // Global por defecto
  return caudal_global.total_puntos_unicos || FILTER_CONFIG.DEFAULT_LIMIT_MAX;
};