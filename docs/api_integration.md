# 📌 Integración con API

Este documento describe **toda la API real expuesta por el backend FastAPI**, basada exclusivamente en el código actual del servidor (`main.py` v1.5.1).

> **Versión backend documentada:** 1.5.1  
> **Root Path Global del API:** `/api`  
> **Base URL:** `https://aguatrasparenteapi-h2d4gvbcfvcjfycr.eastus2-01.azurewebsites.net`

---

## 📘 Tabla de Contenidos
- [Configuración](#configuración)
- [ApiService (Frontend)](#apiservice-frontend)
- [Endpoints del Sistema](#endpoints-del-sistema)
- [Endpoints de Caché y Rendimiento](#endpoints-de-caché-y-rendimiento)
- [Endpoints de Puntos de Medición](#endpoints-de-puntos-de-medición)
- [Endpoints de Cuencas Hidrográficas](#endpoints-de-cuencas-hidrográficas)
- [Endpoints de Series Temporales](#endpoints-de-series-temporales)
- [Endpoints de Atlas y Divisiones Administrativas](#endpoints-de-atlas-y-divisiones-administrativas)
- [Manejo de Errores](#manejo-de-errores)
- [Autenticación](#autenticación)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## Configuración

### URL Base
```bash
PUBLIC_API_URL="https://aguatrasparenteapi-h2d4gvbcfvcjfycr.eastus2-01.azurewebsites.net"
```

### Headers Recomendados
```json
{
  "Content-Type": "application/json",
  "accept": "application/json",
  "X-Requested-With": "XMLHttpRequest"
}
```

### Timeout
- **Default:** 30 segundos
- Cancelación mediante `AbortController`

---

## ApiService (Frontend)

Clase utility para gestionar requests al backend.

```typescript
class ApiService {
  constructor(baseUrl: string, timeout?: number)
  async request(endpoint: string, options?: RequestInit)
}
```

**Uso:**
```javascript
const api = new ApiService(import.meta.env.PUBLIC_API_URL);
```

---

## 🖥️ Endpoints del Sistema

### **GET /api/health**
Verifica que el servicio está operativo y que la conexión a la base de datos funciona.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "message": "Water Data API is running",
  "database": "connected"
}
```

**Response (500 Error):**
```json
{
  "status": "unhealthy",
  "message": "Water Data API is running but database connection failed",
  "database": "disconnected",
  "error": "Connection timeout"
}
```

---

### **GET /api/test-db**
Prueba la conexión a la base de datos y retorna el número total de registros.

**Response:**
```json
{
  "status": "success",
  "message": "Database connection successful",
  "total_records": 1234567
}
```

---

### **GET /api/count**
Obtiene el número total de registros en la tabla de mediciones de caudal.

**Response:**
```json
{
  "total_records": 1234567
}
```

---

## 🚀 Endpoints de Caché y Rendimiento

### **GET /api/cache/stats**
Muestra estadísticas internas del sistema de caché y estado del pool de conexiones.

**Response:**
```json
{
  "cached_queries": 21,
  "cache_keys": ["query_hash_1", "query_hash_2"],
  "cache_sizes": {
    "query_hash_1": 100,
    "query_hash_2": 250
  },
  "pool_connections": 8
}
```

---

### **POST /api/cache/clear**
Elimina todo el contenido del caché interno.

**Response:**
```json
{
  "message": "Cache cleared successfully"
}
```

---

### **GET /api/performance/warm-up**
Precarga consultas comunes en el caché para mejorar el rendimiento inicial.

**Response:**
```json
{
  "message": "Cache warm-up completed. Warmed 3 queries.",
  "cached_queries": 3
}
```

---

## 📍 Endpoints de Puntos de Medición

### **GET /api/puntos**
Obtiene puntos de medición desde la tabla pre-agregada `dw.Puntos_Mapa`.

**Query Params:**

| Parámetro | Tipo | Req | Descripción | Ejemplo |
|----------|------|-----|-------------|---------|
| `region` | int | No | Región numérica | `15` |
| `cod_cuenca` | int | No | Código numérico de cuenca | `101` |
| `cod_subcuenca` | int | No | Código numérico de subcuenca | `10101` |
| `filtro_null_subcuenca` | bool | No | Forzar subcuencas NULL | `true` |
| `caudal_minimo` | float | No | Caudal promedio mínimo (l/s) | `10.5` |
| `caudal_maximo` | float | No | Caudal promedio máximo (l/s) | `100.0` |
| `limit` | int | No | Máximo de resultados | `120` |

**Response:**
```json
[
  {
    "utm_norte": 6300000,
    "utm_este": 350000,
    "huso": 19,
    "es_pozo_subterraneo": false
  }
]
```

> **Nota:** Este endpoint solo devuelve coordenadas UTM y tipo de punto (pozo o no). No incluye caudal ni información extendida.

---

### **GET /api/puntos/count**
Obtiene el número de puntos únicos que cumplen con los filtros especificados.

**Query Params:** (mismos que `/api/puntos`)

**Response:**
```json
{
  "total_puntos_unicos": 45,
  "filtros_aplicados": {
    "region": 15,
    "cod_cuenca": 101,
    "cod_subcuenca": null,
    "filtro_null_subcuenca": false,
    "caudal_minimo": null,
    "caudal_maximo": null
  }
}
```

---

### **GET /api/puntos/info**
Entrega información detallada del punto, incluyendo ubicación, cuenca y estadísticas de caudal.

**Query Params (Required):**

| Parámetro | Tipo | Descripción |
|----------|------|-------------|
| `utm_norte` | int | Coordenada UTM Norte |
| `utm_este` | int | Coordenada UTM Este |

**Response:**
```json
{
  "utm_norte": 6300000,
  "utm_este": 350000,
  "huso": 19,
  "es_pozo_subterraneo": false,
  "cod_cuenca": 101,
  "cod_subcuenca": 10101,
  "nombre_cuenca": "Río Lluta",
  "nombre_subcuenca": "Río Lluta Alto",
  "caudal_promedio": 45.23,
  "n_mediciones": 156
}
```

**Error 404:**
```json
{
  "detail": "Punto no encontrado"
}
```

---

### **POST /api/puntos/estadisticas**
Obtiene estadísticas históricas de uno o más puntos.

**Body (array obligatorio):**
```json
[
  { "utm_norte": 6300000, "utm_este": 350000 }
]
```

**Response (un punto):**
```json
[
  {
    "utm_norte": 6300000,
    "utm_este": 350000,
    "caudal": {
      "total_registros": 156,
      "promedio": 45.23,
      "minimo": 12.5,
      "maximo": 98.7,
      "desviacion_estandar": 15.6,
      "primera_fecha": "2020-01-15",
      "ultima_fecha": "2023-10-20"
    },
    "altura_limnimetrica": {
      "total_registros": 120,
      "promedio": 2.3,
      "minimo": 0.5,
      "maximo": 4.8,
      "desviacion_estandar": 0.8,
      "primera_fecha": "2020-01-15",
      "ultima_fecha": "2023-10-20"
    },
    "nivel_freatico": {
      "total_registros": 89,
      "promedio": 12.5,
      "minimo": 8.2,
      "maximo": 18.9,
      "desviacion_estandar": 2.3,
      "primera_fecha": "2020-03-10",
      "ultima_fecha": "2023-09-15"
    }
  }
]
```

**Response (múltiples puntos):**
```json
[
  {
    "puntos_consultados": 5,
    "total_registros_con_caudal": 782,
    "caudal_promedio": 52.4,
    "caudal_minimo": 5.2,
    "caudal_maximo": 150.3,
    "desviacion_estandar_caudal": 22.1
  }
]
```

---

## 🌊 Endpoints de Cuencas Hidrográficas

### **GET /api/cuencas**
Obtiene el listado completo de cuencas, subcuencas y subsubcuencas hidrográficas.

**Response:**
```json
{
  "cuencas": [
    {
      "cod_cuenca": 101,
      "nom_cuenca": "Río Lluta",
      "cod_region": 15,
      "cod_subcuenca": 10101,
      "nom_subcuenca": "Río Lluta Alto",
      "cod_subsubcuenca": null,
      "nom_subsubcuenca": null
    }
  ]
}
```

---

### **GET /api/cuencas/stats**
Obtiene estadísticas de caudal agregadas por cuenca, subcuenca o subsubcuenca.

**Query Params:**

| Parámetro | Tipo | Req | Descripción |
|----------|------|-----|-------------|
| `cod_cuenca` | int | No | Código de cuenca |
| `cod_subcuenca` | int | No | Código de subcuenca |
| `cod_subsubcuenca` | int | No | Código de subsubcuenca |
| `include_global` | bool | No | Incluir estadísticas globales |

**Response:**
```json
{
  "estadisticas": [
    {
      "cod_cuenca": 101,
      "nom_cuenca": "Río Lluta",
      "cod_region": 15,
      "cod_subcuenca": 10101,
      "nom_subcuenca": "Río Lluta Alto",
      "cod_subsubcuenca": null,
      "nom_subsubcuenca": null,
      "caudal_promedio": 45.3,
      "caudal_minimo": 5.2,
      "caudal_maximo": 120.5,
      "total_puntos_unicos": 15,
      "total_mediciones": 1850,
      "global_promedio": 38.7,
      "global_minimo": 0.1,
      "global_maximo": 500.2
    }
  ]
}
```

> **Nota:** Los campos `global_*` solo aparecen si `include_global=true`

---

### **GET /api/filtrosreactivos**
Obtiene estadísticas de caudal mínimo y máximo agregadas globalmente, por cuenca y por subcuenca. Usado para configurar filtros reactivos en el frontend.

**Response:**
```json
{
  "estadisticas": {
    "caudal_global": {
      "avgMin": 0.1,
      "avgMax": 500.2,
      "total_puntos_unicos": 1250
    },
    "caudal_por_cuenca": [
      {
        "nom_cuenca": "Río Lluta",
        "avgMin": 5.2,
        "avgMax": 120.5,
        "total_puntos": 15
      }
    ],
    "caudal_por_subcuenca": [
      {
        "nom_cuenca": "Río Lluta",
        "nom_subcuenca": "Río Lluta Alto",
        "avgMin": 8.3,
        "avgMax": 98.7,
        "total_puntos": 8
      }
    ]
  }
}
```

---

## 📈 Endpoints de Series Temporales

### Series Temporales por Punto

#### **GET /api/puntos/series_de_tiempo/caudal**
Retorna serie temporal de caudal para un punto específico.

**Query Params:**

| Parámetro | Tipo | Req | Descripción |
|----------|------|-----|-------------|
| `utm_norte` | int | Sí | Coordenada UTM Norte |
| `utm_este` | int | Sí | Coordenada UTM Este |
| `fecha_inicio` | str | No | Fecha inicio (YYYY-MM-DD) |
| `fecha_fin` | str | No | Fecha fin (YYYY-MM-DD) |

**Response:**
```json
{
  "utm_norte": 6300000,
  "utm_este": 350000,
  "caudal_por_tiempo": [
    {
      "fecha_medicion": "2023-10-15",
      "caudal": 42.5
    }
  ]
}
```

---

#### **GET /api/puntos/series_de_tiempo/altura_linimetrica**
Retorna serie temporal de altura limnimétrica para un punto.

**Query Params:** (mismos que `/caudal`)

**Response:**
```json
{
  "utm_norte": 6300000,
  "utm_este": 350000,
  "total_registros": 150,
  "registros_retornados": 150,
  "altura_por_tiempo": [
    {
      "fecha_medicion": "2023-10-15",
      "altura_linimetrica": 2.5
    }
  ]
}
```

---

#### **GET /api/puntos/series_de_tiempo/nivel_freatico**
Retorna serie temporal de nivel freático para un punto.

**Query Params:** (mismos que `/caudal`)

**Response:**
```json
{
  "utm_norte": 6300000,
  "utm_este": 350000,
  "total_registros": 89,
  "registros_retornados": 89,
  "nivel_por_tiempo": [
    {
      "fecha_medicion": "2023-10-15",
      "nivel_freatico": 15.3
    }
  ]
}
```

---

### Series Temporales por Cuenca

#### **GET /api/cuencas/cuenca/series_de_tiempo/caudal**
Serie temporal de caudal para todos los puntos de una cuenca (máximo 1000 registros más recientes).

**Query Params:**

| Parámetro | Tipo | Req | Descripción |
|----------|------|-----|-------------|
| `cuenca_identificador` | str | Sí | Código numérico o nombre de cuenca |
| `fecha_inicio` | str | No | Fecha inicio (YYYY-MM-DD) |
| `fecha_fin` | str | No | Fecha fin (YYYY-MM-DD) |

**Ejemplo:** `?cuenca_identificador=101` o `?cuenca_identificador=Río Lluta`

**Response:**
```json
{
  "cuenca_identificador": "101",
  "total_registros": 850,
  "caudal_por_tiempo": [
    {
      "fecha_medicion": "2023-10-15",
      "caudal": 42.5
    }
  ]
}
```

**Error 404:**
```json
{
  "detail": "No se encontró la cuenca especificada."
}
```

---

#### **GET /api/cuencas/cuenca/series_de_tiempo/altura_linimetrica**
Serie temporal de altura limnimétrica para una cuenca.

**Query Params:** (mismos que `/caudal`)

**Response:**
```json
{
  "cuenca_identificador": "101",
  "total_registros": 650,
  "registros_retornados": 650,
  "altura_por_tiempo": [
    {
      "fecha_medicion": "2023-10-15",
      "altura_linimetrica": 2.5
    }
  ]
}
```

---

#### **GET /api/cuencas/cuenca/series_de_tiempo/nivel_freatico**
Serie temporal de nivel freático para una cuenca.

**Query Params:** (mismos que `/caudal`)

**Response:**
```json
{
  "cuenca_identificador": "101",
  "total_registros": 420,
  "registros_retornados": 420,
  "nivel_por_tiempo": [
    {
      "fecha_medicion": "2023-10-15",
      "nivel_freatico": 15.3
    }
  ]
}
```

---

### Series Temporales por Subcuenca

Los siguientes endpoints funcionan igual que los de cuenca, pero filtran por subcuenca:

- **GET /api/cuencas/subcuenca/series_de_tiempo/caudal**
- **GET /api/cuencas/subcuenca/series_de_tiempo/altura_linimetrica**
- **GET /api/cuencas/subcuenca/series_de_tiempo/nivel_freatico**

**Query Params:** (mismos que cuenca)

**Response:** (misma estructura, pero con `subcuenca_identificador`)

---

### Series Temporales por Subsubcuenca

Los siguientes endpoints funcionan igual que los anteriores, pero filtran por subsubcuenca:

- **GET /api/cuencas/subsubcuenca/series_de_tiempo/caudal**
- **GET /api/cuencas/subsubcuenca/series_de_tiempo/altura_linimetrica**
- **GET /api/cuencas/subsubcuenca/series_de_tiempo/nivel_freatico**

**Query Params:** (mismos que cuenca)

**Response:** (misma estructura, pero con `subsubcuenca_identificador`)

---

## 🗺️ Endpoints de Atlas y Divisiones Administrativas

### **GET /api/atlas**
Obtiene el listado de divisiones administrativas disponibles: regiones, provincias y comunas.

**Response:**
```json
{
  "divisiones": [
    {
      "region": 15,
      "provincia": "Arica",
      "comuna": "Arica"
    }
  ]
}
```

---

## ⚠️ Manejo de Errores

### Tipos de Errores

#### TimeoutError (Frontend)
Ocurre cuando `ApiService` sobrepasa el tiempo configurado (30s).

```javascript
try {
  await api.getPuntos();
} catch (err) {
  if (err.name === 'TimeoutError') {
    console.error('Request timeout');
  }
}
```

---

#### HTTP 404 - Not Found
El recurso solicitado no existe o no se encontraron datos.

```json
{
  "detail": "Punto no encontrado"
}
```

---

#### HTTP 500 - Internal Server Error
Error interno del servidor o de la base de datos.

```json
{
  "detail": {
    "error": "Database connection failed: timeout"
  }
}
```

---

## 🔐 Autenticación

**Estado actual:** No se usa autenticación.

**Recomendación futura:**
- Implementar JWT + Refresh Token
- Header: `Authorization: Bearer <token>`

---

## 📚 Ejemplos de Uso Completos

### Cargar Puntos con Filtros
```javascript
const puntos = await api.request('/puntos', {
  method: 'GET',
  params: {
    region: 15,
    cod_cuenca: 101,
    caudal_minimo: 10,
    caudal_maximo: 100,
    limit: 50
  }
});
```

---

### Información Detallada de Punto
```javascript
const info = await api.request('/puntos/info', {
  method: 'GET',
  params: {
    utm_norte: 6300000,
    utm_este: 350000
  }
});
```

---

### Estadísticas de Múltiples Puntos
```javascript
const stats = await api.request('/puntos/estadisticas', {
  method: 'POST',
  body: JSON.stringify([
    { utm_norte: 6300000, utm_este: 350000 },
    { utm_norte: 6301000, utm_este: 351000 }
  ])
});
```

---

### Serie Temporal de Cuenca
```javascript
const serie = await api.request('/cuencas/cuenca/series_de_tiempo/caudal', {
  method: 'GET',
  params: {
    cuenca_identificador: '101',
    fecha_inicio: '2023-01-01',
    fecha_fin: '2023-12-31'
  }
});
```

---

### Estadísticas de Cuenca con Comparación Global
```javascript
const stats = await api.request('/cuencas/stats', {
  method: 'GET',
  params: {
    cod_cuenca: 101,
    include_global: true
  }
});
```

---

## ✅ Resumen de Endpoints Disponibles

### Sistema (3)
- `GET /health`
- `GET /test-db`
- `GET /count`

### Caché y Rendimiento (3)
- `GET /cache/stats`
- `POST /cache/clear`
- `GET /performance/warm-up`

### Puntos de Medición (6)
- `GET /puntos`
- `GET /puntos/count`
- `GET /puntos/info`
- `POST /puntos/estadisticas`
- `GET /puntos/series_de_tiempo/caudal`
- `GET /puntos/series_de_tiempo/altura_linimetrica`
- `GET /puntos/series_de_tiempo/nivel_freatico`

### Cuencas (3)
- `GET /cuencas`
- `GET /cuencas/stats`
- `GET /filtrosreactivos`

### Series Temporales por Cuenca (9)
- `GET /cuencas/cuenca/series_de_tiempo/caudal`
- `GET /cuencas/cuenca/series_de_tiempo/altura_linimetrica`
- `GET /cuencas/cuenca/series_de_tiempo/nivel_freatico`
- `GET /cuencas/subcuenca/series_de_tiempo/caudal`
- `GET /cuencas/subcuenca/series_de_tiempo/altura_linimetrica`
- `GET /cuencas/subcuenca/series_de_tiempo/nivel_freatico`
- `GET /cuencas/subsubcuenca/series_de_tiempo/caudal`
- `GET /cuencas/subsubcuenca/series_de_tiempo/altura_linimetrica`
- `GET /cuencas/subsubcuenca/series_de_tiempo/nivel_freatico`

### Atlas (1)
- `GET /atlas`

**Total: 28 endpoints**

---

## 📝 Notas Importantes

1. **Caché TTL:** 5 minutos (300 segundos)
2. **Pool de Conexiones:** 10 conexiones por defecto
3. **Límite de Resultados:** 120 puntos por defecto en `/puntos`
4. **Series Temporales:** Máximo 1000 registros más recientes en endpoints de cuenca
5. **Zona UTM:** Sistema UTM Zona 19S (Huso 19)
6. **Base de Datos:** Azure Synapse Analytics

---

**Última actualización:** Basada en `main.py` versión 1.5.1