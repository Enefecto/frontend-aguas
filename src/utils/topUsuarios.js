/**
 * Top 10 de usuarios por cuenca, subcuenca y SHAC.
 *
 * Usuarios, no informantes: el informante carga la medición, el usuario es el
 * titular del derecho. En la cuenca 101 el primer informante aparecía con
 * 282.900 reportes, que son exactamente las mediciones de Celulosa Arauco y
 * Constitución S.A. El gráfico nombraba a quien aprieta el botón, no a quien
 * tiene el agua.
 *
 * Antes esto leía `/datos/top_usuarios.json`, un archivo precalculado por
 * `Backend_aguas_cloud/scripts/generar_top_usuarios.py`, porque el nombre del
 * titular solo vivía en `dw.Mediciones_full` y agregarlo por cuenca escaneaba
 * 71,8 M de filas. Ese archivo caducaba en silencio: si nadie re-corría el
 * script después de una carga del DW, el panel mostraba datos viejos sin avisar.
 *
 * Ahora lo sirve la API desde `dw.Usuario_Obra` —6.578 filas, con índice por
 * nivel— así que lo que se muestra es siempre lo que dice la base. Ojo que esa
 * tabla la reconstruye `Backend_aguas_cloud/sql/dw_usuario.sql` y el pipeline no
 * la toca: si no se re-corre después de una carga del DW, queda vieja.
 */

/**
 * @param {'cuenca'|'subcuenca'|'shac'} nivel
 * @param {number|string} codigo - Código de cuenca, subcuenca o sector SHAC
 * @param {object} apiService
 * @returns {Promise<Array<{nombre: string, obras: number, reportes: number}>>}
 */
export const obtenerTopUsuarios = async (nivel, codigo, apiService) => {
  if (codigo == null || !apiService) return [];
  try {
    const data = await apiService.getTopUsuarios(nivel, codigo);
    return data?.usuarios ?? [];
  } catch (err) {
    // Que falle esto no debe romper el panel: el resto de los gráficos no
    // depende del top de usuarios.
    console.error('No se pudo cargar el top de usuarios:', err);
    return [];
  }
};
