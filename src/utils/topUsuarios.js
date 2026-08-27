/**
 * Top 10 de usuarios por cuenca y subcuenca.
 *
 * El gráfico decía "Top 10 Usuarios" pero mostraba informantes, que no es lo
 * mismo: el informante carga la medición, el usuario es el titular del derecho.
 * En la cuenca 101 el primer informante aparecía con 282.900 reportes, que son
 * exactamente las mediciones de Celulosa Arauco y Constitución S.A. El gráfico
 * nombraba a quien aprieta el botón, no a quien tiene el agua.
 *
 * El dato de usuario vive en `dw.Mediciones_full` y no hay dónde consultarlo
 * rápido: ni `dw.Puntos_Mapa` ni `dw.Informante` traen columnas de usuario, y
 * sin índice por cuenca cada agregación escanea 71,8 millones de filas — unos
 * cuatro minutos por cuenca. Así que se precalcula con
 * `Backend_aguas_cloud/scripts/generar_top_usuarios.py` y acá solo se lee.
 *
 * El archivo se descarga una vez por sesión, y recién cuando alguien pide los
 * gráficos de una cuenca. No entra en el bundle.
 *
 * Es un parche consciente: el arreglo de fondo es que el pipeline publique una
 * `dw.Usuario` o agregue las columnas a `dw.Puntos_Mapa`.
 */

const URL_DATOS = '/datos/top_usuarios.json';

let cache = null;
let enVuelo = null;

/**
 * Descarga el archivo una sola vez y lo deja en memoria.
 * @returns {Promise<object|null>} null si no se pudo cargar
 */
const cargar = () => {
  if (cache) return Promise.resolve(cache);
  if (!enVuelo) {
    enVuelo = fetch(URL_DATOS)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(json => {
        cache = json;
        return json;
      })
      .catch(err => {
        // Que falte el archivo no debe romper el panel: el resto de los
        // gráficos no depende de esto.
        console.error('No se pudo cargar el top de usuarios:', err);
        enVuelo = null;
        return null;
      });
  }
  return enVuelo;
};

/**
 * @param {'cuenca'|'subcuenca'} nivel
 * @param {number|string} codigo - Código de cuenca o subcuenca
 * @returns {Promise<Array<{nombre: string, obras: number, reportes: number}>>}
 */
export const obtenerTopUsuarios = async (nivel, codigo) => {
  if (codigo == null) return [];
  const datos = await cargar();
  return datos?.[nivel]?.[String(codigo)] ?? [];
};

/**
 * Fecha en que se generó el archivo, para poder mostrarla o auditarla.
 * @returns {Promise<string|null>}
 */
export const fechaTopUsuarios = async () => (await cargar())?.generado ?? null;
