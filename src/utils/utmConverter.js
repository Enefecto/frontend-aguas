import { isCoordenadasFueraDeRango } from '../constants/regionesChile.js';

/**
 * Convierte coordenadas UTM a latitud y longitud (WGS84)
 * Chile usa principalmente las zonas UTM 18S y 19S
 *
 * @param {number} utmEste - Coordenada Este en UTM
 * @param {number} utmNorte - Coordenada Norte en UTM
 * @param {number} zone - Zona UTM (por defecto 19 para Chile central)
 * @param {boolean} southern - Hemisferio sur (true por defecto para Chile)
 * @returns {object} - { lat, lon }
 */
export const utmToLatLon = (utmEste, utmNorte, zone = 19, southern = true) => {
  // Constantes WGS84
  const a = 6378137.0; // Radio ecuatorial
  const e = 0.081819191; // Excentricidad
  const e1sq = 0.006739497; // e'^2
  const k0 = 0.9996; // Factor de escala

  // Ajustar para hemisferio sur
  const falseNorthing = southern ? 10000000.0 : 0.0;

  const arc = (utmNorte - falseNorthing) / k0;
  const mu = arc / (a * (1 - Math.pow(e, 2) / 4.0 - 3 * Math.pow(e, 4) / 64.0 - 5 * Math.pow(e, 6) / 256.0));

  const ei = (1 - Math.pow((1 - e * e), (1 / 2.0))) / (1 + Math.pow((1 - e * e), (1 / 2.0)));

  const ca = 3 * ei / 2 - 27 * Math.pow(ei, 3) / 32.0;
  const cb = 21 * Math.pow(ei, 2) / 16 - 55 * Math.pow(ei, 4) / 32;
  const cc = 151 * Math.pow(ei, 3) / 96;
  const cd = 1097 * Math.pow(ei, 4) / 512;

  const phi1 = mu + ca * Math.sin(2 * mu) + cb * Math.sin(4 * mu) + cc * Math.sin(6 * mu) + cd * Math.sin(8 * mu);

  const n0 = a / Math.pow((1 - Math.pow((e * Math.sin(phi1)), 2)), (1 / 2.0));

  const r0 = a * (1 - e * e) / Math.pow((1 - Math.pow((e * Math.sin(phi1)), 2)), (3 / 2.0));
  const fact1 = n0 * Math.tan(phi1) / r0;

  const _a1 = 500000 - utmEste;
  const dd0 = _a1 / (n0 * k0);
  const fact2 = dd0 * dd0 / 2;

  const t0 = Math.pow(Math.tan(phi1), 2);
  const Q0 = e1sq * Math.pow(Math.cos(phi1), 2);
  const fact3 = (5 + 3 * t0 + 10 * Q0 - 4 * Q0 * Q0 - 9 * e1sq) * Math.pow(dd0, 4) / 24;

  const fact4 = (61 + 90 * t0 + 298 * Q0 + 45 * t0 * t0 - 252 * e1sq - 3 * Q0 * Q0) * Math.pow(dd0, 6) / 720;

  const lof1 = _a1 / (n0 * k0);
  const lof2 = (1 + 2 * t0 + Q0) * Math.pow(dd0, 3) / 6.0;
  const lof3 = (5 - 2 * Q0 + 28 * t0 - 3 * Math.pow(Q0, 2) + 8 * e1sq + 24 * Math.pow(t0, 2)) * Math.pow(dd0, 5) / 120;
  const _a2 = (lof1 - lof2 + lof3) / Math.cos(phi1);
  const _a3 = _a2 * 180 / Math.PI;

  const latitude = 180 * (phi1 - fact1 * (fact2 + fact3 + fact4)) / Math.PI;

  const zoneCM = (zone > 0) ? (6 * zone - 183.0) : 3.0;

  const longitude = zoneCM - _a3;

  return {
    lat: latitude,
    lon: longitude
  };
};

/**
 * Longitud de referencia central de Chile (~-71°).
 * Usado para determinar cuál zona UTM produce la conversión más cercana
 * al territorio chileno real.
 */
const CHILE_CENTRAL_LON = -71;

/**
 * Convierte un punto con coordenadas UTM a lat/lon usando el algoritmo de zona dual.
 *
 * Problema: El campo `huso` de la DGA no es confiable para determinar la zona UTM.
 * Solución: Probar AMBAS zonas (18S y 19S), y elegir la que ubique el punto
 * más cerca de la longitud central de Chile (~-71°). Esto funciona porque Chile
 * es angosto y -71° es un centro de referencia válido para todo el país.
 *
 * Esta técnica convierte correctamente el 99.86% de los puntos (7,778 de 7,789).
 *
 * @param {object} punto - Punto con utm_norte, utm_este y opcionalmente cod_region
 * @returns {object} - Punto con lat, lon, zone_used y coordenada_invalida
 */
export const convertPuntoUTMtoLatLon = (punto) => {
  if (!punto.utm_norte || !punto.utm_este) {
    return { ...punto, lat: null, lon: null, coordenada_invalida: true };
  }

  // Convertir usando ambas zonas UTM (hemisferio sur)
  const result18 = utmToLatLon(punto.utm_este, punto.utm_norte, 18, true);
  const result19 = utmToLatLon(punto.utm_este, punto.utm_norte, 19, true);

  // Elegir la zona cuya longitud resultante esté más cerca de -71° (centro de Chile)
  const diff18 = Math.abs(result18.lon - CHILE_CENTRAL_LON);
  const diff19 = Math.abs(result19.lon - CHILE_CENTRAL_LON);

  const bestResult = diff18 < diff19 ? result18 : result19;
  const zoneUsed = diff18 < diff19 ? 18 : 19;

  // Validar coherencia regional si el punto tiene cod_region
  let coordenadaInvalida = false;
  if (punto.cod_region) {
    coordenadaInvalida = isCoordenadasFueraDeRango(punto.utm_norte, punto.cod_region);
  }

  return {
    ...punto,
    lat: bestResult.lat,
    lon: bestResult.lon,
    zone_used: zoneUsed,
    coordenada_invalida: coordenadaInvalida
  };
};

/**
 * Huso UTM que corresponde a una longitud.
 * Chile continental cae en los husos 18 y 19; la frontera está en -72°.
 *
 * @param {number} lon - Longitud en grados decimales
 * @returns {number} - Número de huso UTM (1-60)
 */
export const getHuso = (lon) => Math.floor((lon + 180) / 6) + 1;

/**
 * Convierte latitud/longitud (WGS84) a UTM.
 *
 * Es la dirección inversa de `utmToLatLon`. Se usa para mostrarle al usuario la
 * coordenada UTM del punto en su huso correcto: el `HUSO` que trae la DGA no es
 * confiable (ver `convertPuntoUTMtoLatLon`), así que la UTM que se muestra se
 * recalcula desde el lat/lon con el que efectivamente se plotea el punto.
 *
 * @param {number} lat - Latitud en grados decimales
 * @param {number} lon - Longitud en grados decimales
 * @param {number} [zone] - Huso a forzar; por defecto el que corresponde a `lon`
 * @returns {object} - { utmEste, utmNorte, zone, hemisferio }
 */
export const latLonToUTM = (lat, lon, zone = getHuso(lon)) => {
  // Constantes WGS84
  const a = 6378137.0; // Radio ecuatorial
  const e = 0.081819191; // Excentricidad
  const k0 = 0.9996; // Factor de escala

  const latRad = lat * Math.PI / 180;
  const lonRad = lon * Math.PI / 180;
  const zoneCM = (zone - 1) * 6 - 180 + 3; // Meridiano central del huso
  const zoneCMRad = zoneCM * Math.PI / 180;

  const N = a / Math.sqrt(1 - e * e * Math.sin(latRad) * Math.sin(latRad));
  const T = Math.tan(latRad) * Math.tan(latRad);
  const C = (e * e / (1 - e * e)) * Math.cos(latRad) * Math.cos(latRad);
  const A = (lonRad - zoneCMRad) * Math.cos(latRad);

  const M = a * ((1 - e * e / 4 - 3 * e * e * e * e / 64 - 5 * e * e * e * e * e * e / 256) * latRad
    - (3 * e * e / 8 + 3 * e * e * e * e / 32 + 45 * e * e * e * e * e * e / 1024) * Math.sin(2 * latRad)
    + (15 * e * e * e * e / 256 + 45 * e * e * e * e * e * e / 1024) * Math.sin(4 * latRad)
    - (35 * e * e * e * e * e * e / 3072) * Math.sin(6 * latRad));

  const utmEste = k0 * N * (A + (1 - T + C) * A * A * A / 6
    + (5 - 18 * T + T * T + 72 * C - 58 * (e * e / (1 - e * e))) * A * A * A * A * A / 120) + 500000;

  const utmNorte = k0 * (M + N * Math.tan(latRad) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A * A * A * A / 24
    + (61 - 58 * T + T * T + 600 * C - 330 * (e * e / (1 - e * e))) * A * A * A * A * A * A / 720));

  // Falso norte del hemisferio sur
  const esSur = lat < 0;

  return {
    utmEste,
    utmNorte: esSur ? utmNorte + 10000000 : utmNorte,
    zone,
    hemisferio: esSur ? 'S' : 'N'
  };
};

/**
 * Formatea una coordenada UTM para mostrar, al estilo de la DGA:
 * "337.541 m E / 6.297.619 m N — Huso 19S".
 *
 * @param {object} utm - Salida de `latLonToUTM`
 * @returns {string|null} - Texto listo para mostrar, o null si no hay dato
 */
export const formatUTM = (utm) => {
  if (!utm || !Number.isFinite(utm.utmEste) || !Number.isFinite(utm.utmNorte)) {
    return null;
  }

  const fmt = (v) => Math.round(v).toLocaleString('es-CL');

  return `${fmt(utm.utmEste)} m E / ${fmt(utm.utmNorte)} m N — Huso ${utm.zone}${utm.hemisferio}`;
};

/**
 * Coordenada UTM lista para mostrar en la ficha del punto.
 *
 * El `utm_norte`/`utm_este` que entrega la DGA ya es la coordenada UTM del punto:
 * se devuelve tal cual, sin reproyectar. Reproyectarla le agregaría el error de
 * las series truncadas (unos metros) y, peor, cambiaría un número que la DGA
 * tiene registrado.
 *
 * Lo que sí faltaba era el huso. Se etiqueta con `zone_used`, el huso con el que
 * `convertPuntoUTMtoLatLon` ubicó el punto — no con el campo `HUSO` de la base,
 * que no es confiable. En la muestra de producción del 2026-08-24, 33 de 6.000
 * puntos quedan al oeste de -72°, o sea guardados en huso 19 pero dentro de la
 * banda geográfica del 18. Los husos se solapan, así que ambas lecturas son
 * válidas y se prefiere la que coincide con el registro de la DGA.
 *
 * @param {object} punto - Punto ya pasado por `convertPuntoUTMtoLatLon`
 * @returns {object|null} - { utmEste, utmNorte, zone, hemisferio }
 */
export const getUTMParaMostrar = (punto) => {
  if (!punto || !punto.utm_este || !punto.utm_norte || !punto.zone_used) {
    return null;
  }

  return {
    utmEste: punto.utm_este,
    utmNorte: punto.utm_norte,
    zone: punto.zone_used,
    hemisferio: Number.isFinite(punto.lat) && punto.lat >= 0 ? 'N' : 'S'
  };
};
