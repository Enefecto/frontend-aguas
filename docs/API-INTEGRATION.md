# 🔌 Integración con API

Esta documentación describe cómo el frontend se integra con el backend API, incluyendo todos los endpoints, estructuras de datos y manejo de errores.

## Tabla de Contenidos

- [Configuración](#configuración)
- [ApiService](#apiservice)
- [Endpoints de Cuencas](#endpoints-de-cuencas)
- [Endpoints de Subcuencas](#endpoints-de-subcuencas)
- [Endpoints de Puntos](#endpoints-de-puntos)
- [Manejo de Errores](#manejo-de-errores)
- [Autenticación](#autenticación)
- [Rate Limiting](#rate-limiting)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## Configuración

### URL Base de la API

La URL del backend se configura vía variable de entorno:

```bash
# .env
PUBLIC_API_URL="https://aguatrasparenteapi-h2d4gvbcfvcjfycr.eastus2-01.azurewebsites.net"
```

**Validación:**
- La URL debe ser válida (formato URL correcto)
- En producción, debe usar HTTPS
- Se valida en `src/pages/index.astro`

### Headers HTTP

Todas las peticiones incluyen los siguientes headers:

```javascript
{
  'Content-Type': 'application/json',
  'accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest'
}
```

### Timeout

- **Default:** 30 segundos
- **Configurable** en la instanciación de ApiService
- Usa `AbortController` para cancelar requests

---

## ApiService

### Clase Principal

**Ubicación:** `src/services/apiService.js`

```javascript
class ApiService {
  constructor(baseUrl, timeout = 30000)
  async request(endpoint, options = {})
  // ... métodos específicos
}
```

### Inicialización

```javascript
const apiService = new ApiService(
  'https://api.ejemplo.com',
  30000  // timeout en ms
);
```

### Método Base: `request()`

**Firma:**
```typescript
async request(
  endpoint: string,
  options?: RequestInit
): Promise<any>
```

**Funcionalidades:**
- ⏱️ Timeout automático
- 🔒 Headers de seguridad
- ⚠️ Manejo de errores HTTP
- 🔄 Validación de respuestas
- 🚫 Abortar request en timeout

**Ejemplo:**
```javascript
try {
  const data = await apiService.request('/api/cuencas');
  console.log(data);
} catch (error) {
  if (error.name === 'TimeoutError') {
    console.error('Request timeout');
  } else {
    console.error('Error:', error.message);
  }
}
```

---

## Endpoints de Cuencas

### GET /api/cuencas

Obtiene la lista de todas las cuencas con sus geometrías.

**Request:**
```http
GET /api/cuencas
```

**Response:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "cod_cuenca": "0101",
        "nom_cuenca": "Río Lluta",
        "region": "XV",
        "area_km2": 3378.5
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[...]]]
      }
    }
  ]
}
```

**Uso:**
```javascript
const cuencas = await apiService.getCuencas();
```

---

### GET /api/cuencas/stats

Obtiene estadísticas de cuencas y subcuencas.

**Request:**
```http
GET /api/cuencas/stats?cod_cuenca=0101&cod_subcuenca=010101
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `cod_cuenca` | string | No | Código de cuenca |
| `cod_subcuenca` | string | No | Código de subcuenca (o "null" para sin subcuenca) |

**Response:**
```json
{
  "regiones": ["XV", "I", "II", ...],
  "cuencas": {
    "XV": [
      {
        "cod_cuenca": "0101",
        "nom_cuenca": "Río Lluta",
        "num_puntos": 45
      }
    ]
  },
  "subcuencas": {
    "0101": [
      {
        "cod_subcuenca": "010101",
        "nom_subcuenca": "Río Lluta Alto",
        "num_puntos": 20
      },
      {
        "cod_subcuenca": null,
        "nom_subcuenca": "Sin subcuenca registrada",
        "num_puntos": 5
      }
    ]
  },
  "tipos_punto": ["Extracción superficial", "Extracción subterránea"],
  "min_caudal": 0.5,
  "max_caudal": 1500.0
}
```

**Uso:**
```javascript
// Todas las estadísticas
const stats = await apiService.getCuencasStats();

// Filtrado por cuenca
const statsFiltered = await apiService.getCuencasStats({
  cod_cuenca: '0101'
});

// Filtrado por subcuenca (incluyendo sin subcuenca)
const statsSubcuenca = await apiService.getCuencasStats({
  cod_cuenca: '0101',
  cod_subcuenca: null  // Se convierte a "null" string
});
```

---

### GET /api/cuencas/analisis_caudal

Análisis de caudal para una cuenca específica.

**Request:**
```http
GET /api/cuencas/analisis_caudal?cuenca_identificador=0101
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `cuenca_identificador` | string | Sí | Código de cuenca |

**Response:**
```json
{
  "cuenca": "Río Lluta",
  "codigo": "0101",
  "estadisticas": {
    "caudal_promedio": 45.2,
    "caudal_minimo": 0.5,
    "caudal_maximo": 150.0,
    "num_puntos": 45,
    "puntos_activos": 42
  },
  "distribucion": [
    { "rango": "0-10 l/s", "cantidad": 15 },
    { "rango": "10-50 l/s", "cantidad": 20 },
    { "rango": "50+ l/s", "cantidad": 10 }
  ]
}
```

**Uso:**
```javascript
const analisis = await apiService.getCuencaAnalisisCaudal('0101');
```

---

### GET /api/cuencas/analisis_informantes

Análisis de informantes (usuarios) de una cuenca.

**Request:**
```http
GET /api/cuencas/analisis_informantes?cuenca_identificador=0101
```

**Response:**
```json
{
  "cuenca": "Río Lluta",
  "codigo": "0101",
  "total_informantes": 28,
  "tipos": {
    "Agricultor": 15,
    "Empresa": 8,
    "Particular": 5
  },
  "distribucion_geografica": [
    {
      "subcuenca": "Río Lluta Alto",
      "informantes": 12
    }
  ]
}
```

**Uso:**
```javascript
const informantes = await apiService.getCuencaAnalisisInformantes('0101');
```

---

### GET /api/cuencas/cuenca/series_de_tiempo/caudal

Serie temporal de caudal de una cuenca.

**Request:**
```http
GET /api/cuencas/cuenca/series_de_tiempo/caudal?cuenca_identificador=0101
```

**Response:**
```json
{
  "cuenca": "Río Lluta",
  "codigo": "0101",
  "series": [
    {
      "fecha": "2023-01-15",
      "caudal_promedio": 42.5,
      "caudal_min": 20.0,
      "caudal_max": 80.0,
      "num_mediciones": 15
    },
    {
      "fecha": "2023-02-15",
      "caudal_promedio": 45.2,
      "caudal_min": 22.0,
      "caudal_max": 85.0,
      "num_mediciones": 14
    }
  ]
}
```

**Uso:**
```javascript
const serie = await apiService.getCuencaSeriesTiempoCaudal('0101');
```

---

### GET /api/cuencas/cuenca/series_de_tiempo/altura_linimetrica

Serie temporal de altura limnimétrica.

**Request:**
```http
GET /api/cuencas/cuenca/series_de_tiempo/altura_linimetrica?cuenca_identificador=0101
```

**Response:** Similar a serie de caudal pero con `altura_linimetrica`.

**Uso:**
```javascript
const serie = await apiService.getCuencaSeriesTiempoAlturaLinimetrica('0101');
```

---

### GET /api/cuencas/cuenca/series_de_tiempo/nivel_freatico

Serie temporal de nivel freático.

**Request:**
```http
GET /api/cuencas/cuenca/series_de_tiempo/nivel_freatico?cuenca_identificador=0101
```

**Response:** Similar a serie de caudal pero con `nivel_freatico`.

**Uso:**
```javascript
const serie = await apiService.getCuencaSeriesTiempoNivelFreatico('0101');
```

---

## Endpoints de Subcuencas

### GET /api/subcuencas/analisis_caudal

Análisis de caudal para una subcuenca.

**Request:**
```http
GET /api/subcuencas/analisis_caudal?subcuenca_identificador=010101&cuenca_identificador=0101
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `subcuenca_identificador` | string | Sí | Código de subcuenca |
| `cuenca_identificador` | string | No | Código de cuenca padre |

**Response:**
```json
{
  "subcuenca": "Río Lluta Alto",
  "codigo": "010101",
  "cuenca_padre": "Río Lluta",
  "estadisticas": {
    "caudal_promedio": 38.5,
    "caudal_minimo": 1.0,
    "caudal_maximo": 120.0,
    "num_puntos": 20
  }
}
```

**Uso:**
```javascript
// Con cuenca padre
const analisis = await apiService.getSubcuencaAnalisisCaudal('010101', '0101');

// Sin cuenca padre
const analisis2 = await apiService.getSubcuencaAnalisisCaudal('010101');
```

---

### GET /api/subcuencas/analisis_informantes

Análisis de informantes de una subcuenca.

**Request:**
```http
GET /api/subcuencas/analisis_informantes?subcuenca_identificador=010101&cuenca_identificador=0101
```

**Response:** Similar a análisis de cuenca.

**Uso:**
```javascript
const informantes = await apiService.getSubcuencaAnalisisInformantes('010101', '0101');
```

---

### GET /api/cuencas/subcuenca/series_de_tiempo/caudal

Serie temporal de caudal de subcuenca.

**Request:**
```http
GET /api/cuencas/subcuenca/series_de_tiempo/caudal?cuenca_identificador=0101&subcuenca_identificador=010101
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `cuenca_identificador` | string | Sí | Código de cuenca |
| `subcuenca_identificador` | string | Sí | Código de subcuenca (o "null") |

**Nota:** Para subcuencas sin registro, usar `subcuenca_identificador=null`

**Response:** Similar a serie de cuenca.

**Uso:**
```javascript
// Subcuenca normal
const serie = await apiService.getSubcuencaSeriesTiempoCaudal('0101', '010101');

// Sin subcuenca registrada (se convierte a "null" string)
const serieSinReg = await apiService.getSubcuencaSeriesTiempoCaudal('0101', 'sin_registro');
```

---

## Endpoints de Puntos

### GET /api/puntos

Obtiene puntos de medición con filtros opcionales.

**Request:**
```http
GET /api/puntos?region=XV&cod_cuenca=0101&limit=50&orden_caudal=max
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `region` | string | No | Código de región (ej: "XV", "I") |
| `cod_cuenca` | string | No | Código de cuenca |
| `cod_subcuenca` | string | No | Código de subcuenca |
| `tipo_punto` | string | No | Tipo separado por comas |
| `caudal_min` | number | No | Caudal mínimo en l/s |
| `caudal_max` | number | No | Caudal máximo en l/s |
| `limit` | number | No | Límite de resultados (default: 10) |
| `orden_caudal` | string | No | "max" o "min" |
| `coordenadas_unicas` | boolean | No | true/false |

**Response:**
```json
{
  "total": 150,
  "limite_aplicado": 50,
  "puntos": [
    {
      "utm_norte": 7983456.2,
      "utm_este": 345678.9,
      "lat": -18.4783,
      "lon": -70.3126,
      "region": "XV",
      "cod_cuenca": "0101",
      "nom_cuenca": "Río Lluta",
      "cod_subcuenca": "010101",
      "nom_subcuenca": "Río Lluta Alto",
      "tipo_punto": "Extracción superficial",
      "caudal": 45.2,
      "fecha_medicion": "2023-10-15",
      "nombre_informante": "Juan Pérez",
      "rut_informante": "12345678-9"
    }
  ]
}
```

**Uso:**
```javascript
// Sin filtros
const puntos = await apiService.getPuntos({});

// Con filtros
const puntosFiltrados = await apiService.getPuntos({
  region: 'XV',
  cod_cuenca: '0101',
  caudal_min: 10,
  caudal_max: 100,
  limit: 50,
  orden_caudal: 'max'
});
```

---

### GET /api/puntos/info

Obtiene información detallada de un punto específico.

**Request:**
```http
GET /api/puntos/info?utm_norte=7983456.2&utm_este=345678.9
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `utm_norte` | number | Sí | Coordenada UTM Norte |
| `utm_este` | number | Sí | Coordenada UTM Este |

**Response:**
```json
{
  "utm_norte": 7983456.2,
  "utm_este": 345678.9,
  "informacion_completa": {
    "ubicacion": {
      "region": "XV",
      "cuenca": "Río Lluta",
      "subcuenca": "Río Lluta Alto"
    },
    "mediciones": {
      "caudal": 45.2,
      "nivel_freatico": null,
      "altura_linimetrica": 2.5
    },
    "informante": {
      "nombre": "Juan Pérez",
      "rut": "12345678-9",
      "tipo": "Agricultor"
    },
    "fecha_ultima_medicion": "2023-10-15"
  }
}
```

**Uso:**
```javascript
const info = await apiService.getPuntoInfo(7983456.2, 345678.9);
```

---

### POST /api/puntos/estadisticas

Obtiene estadísticas de uno o múltiples puntos.

**Request:**
```http
POST /api/puntos/estadisticas
Content-Type: application/json

[
  {
    "utm_norte": 7983456.2,
    "utm_este": 345678.9
  }
]
```

**Body:**
```json
[
  {
    "utm_norte": number,
    "utm_este": number
  }
]
```

**Response:**
```json
[
  {
    "utm_norte": 7983456.2,
    "utm_este": 345678.9,
    "estadisticas": {
      "caudal": {
        "promedio": 45.2,
        "minimo": 20.0,
        "maximo": 80.0,
        "desviacion_estandar": 12.5,
        "num_mediciones": 24
      },
      "periodo": {
        "fecha_inicio": "2022-01-15",
        "fecha_fin": "2023-10-15"
      }
    }
  }
]
```

**Uso:**
```javascript
const estadisticas = await apiService.getPuntosEstadisticas(7983456.2, 345678.9);
```

---

### GET /api/puntos/series_de_tiempo/caudal

Serie temporal de caudal de un punto.

**Request:**
```http
GET /api/puntos/series_de_tiempo/caudal?utm_norte=7983456.2&utm_este=345678.9
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `utm_norte` | number | Sí | Coordenada UTM Norte |
| `utm_este` | number | Sí | Coordenada UTM Este |

**Response:**
```json
{
  "utm_norte": 7983456.2,
  "utm_este": 345678.9,
  "series": [
    {
      "fecha": "2023-01-15",
      "caudal": 42.5,
      "metodo_medicion": "Aforador",
      "observaciones": "Medición normal"
    },
    {
      "fecha": "2023-02-15",
      "caudal": 45.2,
      "metodo_medicion": "Aforador",
      "observaciones": null
    }
  ]
}
```

**Uso:**
```javascript
const serie = await apiService.getPuntosSeriesTiempo(7983456.2, 345678.9);
```

---

### GET /api/puntos/series_de_tiempo/nivel_freatico

Serie temporal de nivel freático de un punto.

**Request:**
```http
GET /api/puntos/series_de_tiempo/nivel_freatico?utm_norte=7983456.2&utm_este=345678.9
```

**Response:** Similar a serie de caudal pero con `nivel_freatico`.

**Uso:**
```javascript
const serie = await apiService.getPuntosSeriesTiempoNivelFreatico(7983456.2, 345678.9);
```

---

### GET /api/puntos/series_de_tiempo/altura_linimetrica

Serie temporal de altura limnimétrica de un punto.

**Request:**
```http
GET /api/puntos/series_de_tiempo/altura_linimetrica?utm_norte=7983456.2&utm_este=345678.9
```

**Response:** Similar a serie de caudal pero con `altura_linimetrica`.

**Uso:**
```javascript
const serie = await apiService.getPuntosSeriesTiempoAlturaLimnimetrica(7983456.2, 345678.9);
```

---

## Manejo de Errores

### Tipos de Errores

#### 1. TimeoutError

Cuando la petición excede el tiempo límite (30s).

```javascript
try {
  const data = await apiService.getPuntos({});
} catch (error) {
  if (error.name === 'TimeoutError') {
    console.error('Timeout:', error.message);
    // Mostrar mensaje al usuario
  }
}
```

#### 2. HTTP Errors

Errores HTTP (404, 500, etc.)

```javascript
try {
  const data = await apiService.getCuencas();
} catch (error) {
  if (error.response) {
    console.error('HTTP Error:', error.response.status);
    console.error('Detalle:', error.response.data);

    switch (error.response.status) {
      case 404:
        // Recurso no encontrado
        break;
      case 500:
        // Error del servidor
        break;
      case 400:
        // Bad request
        break;
    }
  }
}
```

#### 3. Network Errors

Errores de red (sin conexión, etc.)

```javascript
try {
  const data = await apiService.getCuencas();
} catch (error) {
  if (!error.response && error.message.includes('fetch')) {
    console.error('Error de red:', error.message);
    // Usuario sin conexión
  }
}
```

### Estrategia de Manejo

**Recomendación:**

```javascript
const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);

    const data = await apiService.getPuntos(filters);

    setData(data);
  } catch (error) {
    // Manejo específico por tipo de error
    if (error.name === 'TimeoutError') {
      setError('La petición tomó demasiado tiempo. Intenta de nuevo.');
    } else if (error.response?.status === 404) {
      setError('No se encontraron datos.');
    } else if (error.response?.status >= 500) {
      setError('Error del servidor. Intenta más tarde.');
    } else {
      setError('Error al cargar datos. Verifica tu conexión.');
    }

    console.error('Error completo:', error);
  } finally {
    setLoading(false);
  }
};
```

---

## Autenticación

**Estado actual:** El API no requiere autenticación.

**Futuro:** Si se implementa autenticación, se recomienda:
- JWT en header `Authorization: Bearer <token>`
- Refresh token para renovar sesión
- Almacenamiento seguro de tokens (no localStorage para datos sensibles)

---

## Rate Limiting

**Estado actual:** No hay rate limiting documentado en el frontend.

**Recomendaciones:**
- Implementar debouncing en filtros
- Caché de respuestas frecuentes
- Throttling de requests sucesivos

**Ejemplo de debouncing:**

```javascript
import { debounce } from 'lodash';

const debouncedFetch = debounce(async (filters) => {
  const data = await apiService.getPuntos(filters);
  setPuntos(data.puntos);
}, 300); // 300ms

// Uso
useEffect(() => {
  debouncedFetch(filtros);
}, [filtros]);
```

---

## Ejemplos de Uso

### Ejemplo 1: Cargar Mapa Inicial

```javascript
import ApiService from '../services/apiService';

const useMapData = (apiUrl) => {
  const [cuencas, setCuencas] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiService = new ApiService(apiUrl);

    const loadData = async () => {
      try {
        setLoading(true);

        // Cargar en paralelo
        const [cuencasData, statsData] = await Promise.all([
          apiService.getCuencas(),
          apiService.getCuencasStats()
        ]);

        setCuencas(cuencasData);
        setStats(statsData);
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [apiUrl]);

  return { cuencas, stats, loading };
};
```

### Ejemplo 2: Filtrar Puntos

```javascript
const filtrarPuntos = async (filtros) => {
  const queryParams = {
    region: filtros.region || undefined,
    cod_cuenca: filtros.cuenca || undefined,
    cod_subcuenca: filtros.subcuenca || undefined,
    caudal_min: filtros.caudalMin || undefined,
    caudal_max: filtros.caudalMax || undefined,
    limit: filtros.limite || 10,
    orden_caudal: filtros.ordenCaudal || 'max'
  };

  // Remover undefined values
  Object.keys(queryParams).forEach(key =>
    queryParams[key] === undefined && delete queryParams[key]
  );

  const resultado = await apiService.getPuntos(queryParams);
  return resultado.puntos;
};
```

### Ejemplo 3: Cargar Análisis de Cuenca

```javascript
const loadCuencaAnalysis = async (codigoCuenca) => {
  try {
    setLoading(true);

    const [analisisCaudal, informantes] = await Promise.all([
      apiService.getCuencaAnalisisCaudal(codigoCuenca),
      apiService.getCuencaAnalisisInformantes(codigoCuenca)
    ]);

    setAnalisisCaudal(analisisCaudal);
    setInformantes(informantes);
  } catch (error) {
    console.error('Error cargando análisis:', error);
    setError(error);
  } finally {
    setLoading(false);
  }
};
```

### Ejemplo 4: Cargar Series de Tiempo

```javascript
const loadSeriesTiempo = async (utmNorte, utmEste) => {
  try {
    setLoadingGraphics(true);

    // Intentar cargar todas las series (algunas pueden fallar con 404)
    const results = await Promise.allSettled([
      apiService.getPuntosSeriesTiempo(utmNorte, utmEste),
      apiService.getPuntosSeriesTiempoNivelFreatico(utmNorte, utmEste),
      apiService.getPuntosSeriesTiempoAlturaLimnimetrica(utmNorte, utmEste)
    ]);

    const [caudal, nivelFreatico, alturaLinimetrica] = results.map(
      result => result.status === 'fulfilled' ? result.value : null
    );

    setSeriesCaudal(caudal);
    setSeriesNivelFreatico(nivelFreatico);
    setSeriesAlturaLinimetrica(alturaLinimetrica);
  } catch (error) {
    console.error('Error cargando series:', error);
  } finally {
    setLoadingGraphics(false);
  }
};
```

---

**Última actualización:** Noviembre 2025
