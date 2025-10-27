import { API_ENDPOINTS } from '../constants/apiEndpoints.js';

class ApiService {
  constructor(baseUrl, timeout = 30000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout; // Timeout por defecto: 30 segundos
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    // Crear AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
          // Header para prevenir CSRF básico
          'X-Requested-With': 'XMLHttpRequest',
          ...options.headers
        },
        credentials: 'same-origin', // Importante para cookies CSRF si el backend las usa
        signal: controller.signal, // Conectar AbortController
        ...options
      });

      // Limpiar timeout si la petición completa exitosamente
      clearTimeout(timeoutId);

      if (!response.ok) {
        // Intentar parsear el error JSON del backend
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { detail: `HTTP error! status: ${response.status}` };
        }

        // Crear un error más informativo
        const error = new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        error.response = {
          status: response.status,
          data: errorData
        };
        throw error;
      }

      const data = await response.json();

      // Validación básica de respuesta
      if (data === null || data === undefined) {
        throw new Error('Respuesta del API inválida: datos vacíos');
      }

      return data;
    } catch (error) {
      // Limpiar timeout en caso de error
      clearTimeout(timeoutId);

      // Manejo especial para errores de timeout
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`Request timeout: La petición a ${endpoint} excedió el tiempo límite de ${this.timeout}ms`);
        timeoutError.name = 'TimeoutError';
        throw timeoutError;
      }

      // Suprimir completamente console.error para mantener la API confidencial
      // Los errores 404 son normales cuando no hay datos (series de tiempo, etc.)
      // El componente que llama manejará los errores apropiadamente
      throw error;
    }
  }

  // Métodos para cuencas
  async getCuencas() {
    return this.request(API_ENDPOINTS.CUENCAS);
  }

  async getCuencasStats(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.cod_cuenca) queryParams.append('cod_cuenca', params.cod_cuenca);

    // Si cod_subcuenca está presente en params (incluso si es null), agregarlo
    if ('cod_subcuenca' in params) {
      // Si es null (JavaScript null), convertirlo al string "null"
      queryParams.append('cod_subcuenca', params.cod_subcuenca === null ? 'null' : params.cod_subcuenca);
    }

    const queryString = queryParams.toString();
    return this.request(`${API_ENDPOINTS.CUENCAS_STATS}${queryString ? '?' + queryString : ''}`);
  }

  async getFiltrosReactivos() {
    return this.request(API_ENDPOINTS.FILTROS_REACTIVOS);
  }

  async getCuencaAnalisisCaudal(cuencaIdentificador) {
    return this.request(`${API_ENDPOINTS.CUENCAS_ANALISIS_CAUDAL}?cuenca_identificador=${cuencaIdentificador}`);
  }

  async getCuencaAnalisisInformantes(cuencaIdentificador) {
    return this.request(`${API_ENDPOINTS.CUENCAS_ANALISIS_INFORMANTES}?cuenca_identificador=${cuencaIdentificador}`);
  }

  async getCuencaSeriesTiempoCaudal(cuencaIdentificador) {
    return this.request(`${API_ENDPOINTS.CUENCAS_SERIES_TIEMPO_CAUDAL}?cuenca_identificador=${cuencaIdentificador}`);
  }

  async getCuencaSeriesTiempoAlturaLinimetrica(cuencaIdentificador) {
    return this.request(`${API_ENDPOINTS.CUENCAS_SERIES_TIEMPO_ALTURA_LINIMETRICA}?cuenca_identificador=${cuencaIdentificador}`);
  }

  async getCuencaSeriesTiempoNivelFreatico(cuencaIdentificador) {
    return this.request(`${API_ENDPOINTS.CUENCAS_SERIES_TIEMPO_NIVEL_FREATICO}?cuenca_identificador=${cuencaIdentificador}`);
  }

  // Métodos para subcuencas
  async getSubcuencaAnalisisCaudal(subcuencaIdentificador, cuencaIdentificador = null) {
    let url = `${API_ENDPOINTS.SUBCUENCAS_ANALISIS_CAUDAL}?subcuenca_identificador=${encodeURIComponent(subcuencaIdentificador)}`;
    if (cuencaIdentificador !== null) {
      url += `&cuenca_identificador=${encodeURIComponent(cuencaIdentificador)}`;
    }
    return this.request(url);
  }

  async getSubcuencaAnalisisInformantes(subcuencaIdentificador, cuencaIdentificador = null) {
    let url = `${API_ENDPOINTS.SUBCUENCAS_ANALISIS_INFORMANTES}?subcuenca_identificador=${encodeURIComponent(subcuencaIdentificador)}`;
    if (cuencaIdentificador !== null) {
      url += `&cuenca_identificador=${encodeURIComponent(cuencaIdentificador)}`;
    }
    return this.request(url);
  }

  async getSubcuencaSeriesTiempoCaudal(cuencaIdentificador, subcuencaIdentificador) {
    // Si subcuencaIdentificador es 'sin_registro', pasar 'null' como string
    const subcuencaParam = subcuencaIdentificador === 'sin_registro' ? 'null' : subcuencaIdentificador;
    return this.request(`${API_ENDPOINTS.SUBCUENCAS_SERIES_TIEMPO_CAUDAL}?cuenca_identificador=${encodeURIComponent(cuencaIdentificador)}&subcuenca_identificador=${encodeURIComponent(subcuencaParam)}`);
  }

  async getSubcuencaSeriesTiempoAlturaLinimetrica(cuencaIdentificador, subcuencaIdentificador) {
    // Si subcuencaIdentificador es 'sin_registro', pasar 'null' como string
    const subcuencaParam = subcuencaIdentificador === 'sin_registro' ? 'null' : subcuencaIdentificador;
    return this.request(`${API_ENDPOINTS.SUBCUENCAS_SERIES_TIEMPO_ALTURA_LINIMETRICA}?cuenca_identificador=${encodeURIComponent(cuencaIdentificador)}&subcuenca_identificador=${encodeURIComponent(subcuencaParam)}`);
  }

  async getSubcuencaSeriesTiempoNivelFreatico(cuencaIdentificador, subcuencaIdentificador) {
    // Si subcuencaIdentificador es 'sin_registro', pasar 'null' como string
    const subcuencaParam = subcuencaIdentificador === 'sin_registro' ? 'null' : subcuencaIdentificador;
    return this.request(`${API_ENDPOINTS.SUBCUENCAS_SERIES_TIEMPO_NIVEL_FREATICO}?cuenca_identificador=${encodeURIComponent(cuencaIdentificador)}&subcuenca_identificador=${encodeURIComponent(subcuencaParam)}`);
  }

  // Métodos para puntos
  async getPuntos(queryParams) {
    const params = new URLSearchParams(queryParams);
    return this.request(`${API_ENDPOINTS.PUNTOS}?${params.toString()}`);
  }

  async getPuntoInfo(utmNorte, utmEste) {
    return this.request(`${API_ENDPOINTS.PUNTOS_POPUP}?utm_norte=${utmNorte}&utm_este=${utmEste}`);
  }

  async getPuntosEstadisticas(utmNorte, utmEste) {
    return this.request(API_ENDPOINTS.PUNTOS_ESTADISTICAS, {
      method: 'POST',
      body: JSON.stringify([
        {
          utm_norte: utmNorte,
          utm_este: utmEste
        }
      ])
    });
  }

  async getPuntosSeriesTiempo(utmNorte, utmEste) {
    return this.request(`${API_ENDPOINTS.PUNTOS_SERIES_TIEMPO_CAUDAL}?utm_norte=${utmNorte}&utm_este=${utmEste}`);
  }

  async getPuntosSeriesTiempoNivelFreatico(utmNorte, utmEste) {
    return this.request(`${API_ENDPOINTS.PUNTOS_SERIES_TIEMPO_NIVEL_FREATICO}?utm_norte=${utmNorte}&utm_este=${utmEste}`);
  }

  async getPuntosSeriesTiempoAlturaLimnimetrica(utmNorte, utmEste) {
    return this.request(`${API_ENDPOINTS.PUNTOS_SERIES_TIEMPO_ALTURA_LIMNIMETRICA}?utm_norte=${utmNorte}&utm_este=${utmEste}`);
  }
}

export default ApiService;