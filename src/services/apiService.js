import { API_ENDPOINTS } from '../constants/apiEndpoints.js';

class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
          ...options.headers
        },
        ...options
      });

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

      return await response.json();
    } catch (error) {
      console.error(`Error en ${endpoint}:`, error);
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
    if (params.cod_subcuenca) queryParams.append('cod_subcuenca', params.cod_subcuenca);

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

  async getSubcuencaSeriesTiempoCaudal(subcuencaIdentificador) {
    // Nota: El endpoint espera 'cuenca_identificador' pero en realidad es el identificador de la subcuenca
    return this.request(`${API_ENDPOINTS.SUBCUENCAS_SERIES_TIEMPO_CAUDAL}?cuenca_identificador=${encodeURIComponent(subcuencaIdentificador)}`);
  }

  async getSubcuencaSeriesTiempoAlturaLinimetrica(subcuencaIdentificador) {
    // Nota: El endpoint espera 'cuenca_identificador' pero en realidad es el identificador de la subcuenca
    return this.request(`${API_ENDPOINTS.SUBCUENCAS_SERIES_TIEMPO_ALTURA_LINIMETRICA}?cuenca_identificador=${encodeURIComponent(subcuencaIdentificador)}`);
  }

  async getSubcuencaSeriesTiempoNivelFreatico(subcuencaIdentificador) {
    // Nota: El endpoint espera 'cuenca_identificador' pero en realidad es el identificador de la subcuenca
    return this.request(`${API_ENDPOINTS.SUBCUENCAS_SERIES_TIEMPO_NIVEL_FREATICO}?cuenca_identificador=${encodeURIComponent(subcuencaIdentificador)}`);
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