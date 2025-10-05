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
 * Determina la zona UTM basada en las coordenadas Este y Norte
 * Chile tiene principalmente zonas 18S, 19S y 20S
 *
 * La coordenada Este en UTM siempre está cerca de 500000 en el meridiano central de cada zona
 * - Zona 18S: meridiano central -75° (Este entre ~160000 - ~840000)
 * - Zona 19S: meridiano central -69° (Este entre ~160000 - ~840000)
 * - Zona 20S: meridiano central -63° (Este entre ~160000 - ~840000)
 *
 * @param {number} utmEste - Coordenada Este en UTM
 * @param {number} utmNorte - Coordenada Norte en UTM
 * @returns {number} - Zona UTM estimada
 */
export const detectUTMZone = (utmEste, utmNorte) => {
  // Rangos aproximados de Norte para diferentes partes de Chile:
  // Norte (Regiones I-IV): ~7,000,000 - 8,000,000+
  // Centro (Regiones V-VIII): ~5,500,000 - 7,000,000
  // Sur (Regiones IX-XVI): ~4,000,000 - 5,500,000

  // Norte de Chile (Arica hasta Atacama) - típicamente zona 19S, algunas veces 18S
  if (utmNorte >= 7000000) {
    // Si Este es muy bajo (< 300000), probablemente zona 18
    if (utmEste < 300000) {
      return 18;
    }
    return 19;
  }

  // Chile central (Coquimbo hasta Biobío) - típicamente zona 19S
  if (utmNorte >= 5500000) {
    return 19;
  }

  // Sur de Chile - puede ser zona 18S o 19S dependiendo de Este
  if (utmEste < 300000) {
    return 18;
  }

  return 19; // Zona por defecto para Chile central
};

/**
 * Convierte el huso DGA (usado por la DGA de Chile) a zona UTM estándar
 * La DGA usa un sistema de numeración local diferente al estándar internacional
 *
 * @param {number} husoDGA - Huso según la DGA (1, 2, o 3)
 * @returns {number} - Zona UTM estándar
 */
export const husoDGAtoZonaUTM = (husoDGA) => {
  const conversion = {
    1: 18, // Huso DGA 1 = Zona UTM 18S
    2: 19, // Huso DGA 2 = Zona UTM 19S (Chile central)
    3: 20  // Huso DGA 3 = Zona UTM 20S
  };
  return conversion[husoDGA] || 19; // Por defecto zona 19 (Chile central)
};

/**
 * Convierte un punto con coordenadas UTM a lat/lon
 * Usa el huso provisto o lo detecta automáticamente
 *
 * @param {object} punto - Punto con utm_norte, utm_este y opcionalmente huso
 * @returns {object} - Punto con lat, lon y coordenadas UTM originales
 */
export const convertPuntoUTMtoLatLon = (punto) => {
  if (!punto.utm_norte || !punto.utm_este) {
    console.warn('Punto sin coordenadas UTM:', punto);
    return { ...punto, lat: null, lon: null };
  }

  // TODO: Cuando la API devuelva el huso, usar: husoDGAtoZonaUTM(punto.huso)
  // TEMPORAL: Usar zona UTM 19 (huso DGA 2) para todos los puntos - Chile central
  const zone = punto.huso ? husoDGAtoZonaUTM(punto.huso) : 19;
  const { lat, lon } = utmToLatLon(punto.utm_este, punto.utm_norte, zone, true);

  return {
    ...punto,
    lat,
    lon,
    zone_used: zone // Agregar qué zona se usó para debug
  };
};
