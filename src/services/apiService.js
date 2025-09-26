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
        throw new Error(`HTTP error! status: ${response.status}`);
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

  async getCuencasStats() {
    return this.request(API_ENDPOINTS.CUENCAS_STATS);
  }

  async getCuencaAnalisisCaudal(cuencaIdentificador) {
    return this.request(`${API_ENDPOINTS.CUENCAS_ANALISIS_CAUDAL}?cuenca_identificador=${cuencaIdentificador}`);
  }

  async getCuencaAnalisisInformantes(cuencaIdentificador) {
    return this.request(`${API_ENDPOINTS.CUENCAS_ANALISIS_INFORMANTES}?cuenca_identificador=${cuencaIdentificador}`);
  }

  // Métodos para puntos
  async getPuntos(queryParams) {
    const params = new URLSearchParams(queryParams);
    return this.request(`${API_ENDPOINTS.PUNTOS}?${params.toString()}`);
  }

  async getPuntosEstadisticas(coordinates) {
    return this.request(API_ENDPOINTS.PUNTOS_ESTADISTICAS, {
      method: 'POST',
      body: JSON.stringify(coordinates)
    });
  }

  async getPuntosSeriesTiempo(utmNorte, utmEste) {
    return this.request(`${API_ENDPOINTS.PUNTOS_SERIES_TIEMPO_CAUDAL}?utm_norte=${utmNorte}&utm_este=${utmEste}`);
  }
}

export default ApiService;