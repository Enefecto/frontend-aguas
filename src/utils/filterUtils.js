import { FILTER_CONFIG } from '../constants/apiEndpoints.js';

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

  if (filtros.region) queryParams.append("region", filtros.region);
  if (filtros.tipoPunto) queryParams.append("tipo_punto", filtros.tipoPunto);
  if (cuencaCod !== undefined) queryParams.append("cod_cuenca", cuencaCod);

  if (filtros.subcuenca === 'No registrada') {
    queryParams.append("filtro_null_subcuenca", "1");
  } else if (subcuencaCod !== undefined) {
    queryParams.append("cod_subcuenca", subcuencaCod);
  }

  queryParams.append("limit", filtros.limit || 10);
  queryParams.append("caudal_minimo", filtroCaudal[0]);
  queryParams.append("caudal_maximo", filtroCaudal[1]);
  queryParams.append("orden_caudal", ordenCaudal);

  return queryParams;
};

export const getFilteredOptions = (datosOriginales, filtros) => {
  const regionesUnicas = [...new Set(datosOriginales.map(d => d.cod_region))];

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