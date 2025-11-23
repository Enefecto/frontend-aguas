# 🧩 Catálogo de Componentes

Esta documentación describe todos los componentes, hooks y utilidades del proyecto **Aguas Transparentes Frontend**.

## Tabla de Contenidos

- [Componentes Principales](#componentes-principales)
- [Componentes del Mapa](#componentes-del-mapa)
- [Componentes de Sidebars](#componentes-de-sidebars)
- [Componentes de Gráficos](#componentes-de-gráficos)
- [Componentes UI Reutilizables](#componentes-ui-reutilizables)
- [Custom Hooks](#custom-hooks)
- [Context API](#context-api)
- [Servicios](#servicios)
- [Utilidades](#utilidades)

---

## Componentes Principales

### Mapa.jsx
**Ubicación:** `src/components/Mapa.jsx`

Componente raíz de la aplicación del mapa.

**Props:**
```typescript
{
  apiUrl: string  // URL del backend API
}
```

**Descripción:**
- Punto de entrada de la aplicación React
- Inicializa el `MapProvider` con Context API
- Maneja la carga dinámica de Leaflet y leaflet-draw
- Gestiona el estado de comparación de puntos
- Orquesta todos los componentes hijos (MapContainer, SidebarManager, ComparePoints)

**Estructura:**
```javascript
<MapProvider apiUrl={apiUrl}>
  <MapaContent />
</MapProvider>
```

**Responsabilidades:**
- ✅ Cargar librerías de Leaflet (client-side only)
- ✅ Gestionar estado global via MapProvider
- ✅ Coordinar componentes principales
- ✅ Manejar lógica de comparación de puntos

**Uso:**
```javascript
// En index.astro
<Mapa client:only="react" apiUrl={apiUrl} />
```

---

## Componentes del Mapa

### MapContainer.jsx
**Ubicación:** `src/components/map/MapContainer.jsx`

Contenedor principal del mapa Leaflet.

**Props:**
```typescript
{
  puntos: Array<Object>,           // Array de puntos a mostrar
  agrupar: boolean,                // Si se agrupan los marcadores
  apiUrl: string,                  // URL de la API
  apiService: ApiService,          // Instancia del servicio API
  handleShowSidebarCuencas: (nombre, codigo) => void,
  handleShowSidebarSubcuencas: (nombre, codigo, codCuenca?, nomCuenca?) => void,
  handleShowSidebarPunto: (punto) => void,
  isSelectingPointForComparison: boolean,
  onPointClickForComparison: (punto) => void,
  selectedPointsForComparison: Array<Object|null>
}
```

**Características:**
- 🗺️ Renderiza el mapa Leaflet base
- 🎨 Selector de capas de tiles (OpenStreetMap, Satellite, Topographic)
- 📍 Leyenda de colores
- 🔧 Controles de zoom
- ✏️ Herramientas de dibujo (ToolsEditControl)
- 📌 Capa de marcadores (MarkerLayer)

**Configuración del mapa:**
- Centro inicial: Chile central (configurado en `MAP_CONFIG`)
- Zoom inicial: 5
- Controles de zoom en esquina superior derecha

**Ejemplo:**
```javascript
<MapContainer
  puntos={puntos}
  agrupar={true}
  apiUrl={apiUrl}
  apiService={apiService}
  handleShowSidebarCuencas={handleShowSidebarCuencas}
  handleShowSidebarPunto={handleShowSidebarPunto}
/>
```

---

### MarkerLayer.jsx
**Ubicación:** `src/components/map/MarkerLayer.jsx`

Renderiza los marcadores de puntos en el mapa.

**Props:**
```typescript
{
  puntos: Array<Object>,
  agrupar: boolean,
  handleShowSidebarCuencas: Function,
  handleShowSidebarSubcuencas: Function,
  handleShowSidebarPunto: Function,
  apiService: ApiService,
  isSelectingPointForComparison: boolean,
  onPointClickForComparison: Function,
  selectedPointsForComparison: Array
}
```

**Funcionalidades:**
- 📍 Renderiza marcadores personalizados (gotas de agua)
- 🔄 Clustering opcional con react-leaflet-cluster
- 🎨 Colores diferenciados por tipo de punto:
  - Azul (#2E7BCC): Extracción superficial
  - Naranja (#FF5722): Extracción subterránea
  - Gris: Sin clasificar
- 💬 Popups con información del punto
- 🖱️ Click handlers para sidebars y comparación

**Colores de marcadores:**
```javascript
const MARKER_COLORS = {
  SURFACE_EXTRACTION: '#2E7BCC',      // Azul
  UNDERGROUND_EXTRACTION: '#FF5722',  // Naranja
  UNCLASSIFIED: '#808080'             // Gris
};
```

---

### LayerSelector.jsx
**Ubicación:** `src/components/map/LayerSelector.jsx`

Control para cambiar entre capas de tiles del mapa.

**Props:**
```typescript
{
  currentLayer: string,              // Clave de la capa actual
  onLayerChange: (layerKey) => void  // Callback al cambiar capa
}
```

**Capas disponibles:**
- OpenStreetMap (por defecto)
- Satellite (Esri World Imagery)
- Topographic (OpenTopoMap)

---

### ToolsEditControl.jsx
**Ubicación:** `src/components/tools/ToolsEditControl.jsx`

Herramientas de dibujo para análisis espacial.

**Props:**
```typescript
{
  apiUrl: string,
  puntos: Array<Object>
}
```

**Funcionalidades:**
- ✏️ Dibujar polígonos
- ⭕ Dibujar círculos
- 🗑️ Eliminar formas dibujadas
- 🎯 Análisis de puntos dentro del área dibujada
- 📊 Muestra estadísticas de puntos en el área

**Basado en:** Leaflet.draw

---

### SidebarManager.jsx
**Ubicación:** `src/components/map/SidebarManager.jsx`

Orquestador de todos los sidebars de la aplicación.

**Props:**
```typescript
{
  // Estados de sidebars
  sidebarAbierto: boolean,
  setSidebarAbierto: Function,
  rightSidebarAbiertoCuencas: boolean,
  setRightSidebarAbiertoCuencas: Function,
  rightSidebarAbiertoSubcuencas: boolean,
  setRightSidebarAbiertoSubcuencas: Function,
  rightSidebarAbiertoPunto: boolean,
  setRightSidebarAbiertoPunto: Function,

  // Props para cada sidebar...
}
```

**Responsabilidades:**
- 🎛️ Renderizar todos los sidebars
- 🔄 Gestionar visibilidad de sidebars
- 📊 Pasar props a sidebars hijos

**Sidebars gestionados:**
- SidebarFiltros (izquierda)
- SidebarCuenca (derecha)
- SidebarSubcuenca (derecha)
- SidebarPunto (derecha)

---

### ComparePointsSelector.jsx
**Ubicación:** `src/components/map/ComparePointsSelector.jsx`

Selector de puntos para comparación.

**Props:**
```typescript
{
  selectedPoints: [Object|null, Object|null],
  onPointSelect: (slotIndex, point) => void,
  onCompare: () => void,
  isSelectingPoint: number|null
}
```

**Funcionalidades:**
- 🎯 Seleccionar hasta 2 puntos para comparar
- 🔄 Indicador visual de modo selección activo
- ⚖️ Botón para abrir modal de comparación
- ❌ Botón para limpiar selección

---

## Componentes de Sidebars

### SidebarFiltros.jsx
**Ubicación:** `src/components/sidebars/SidebarFiltros.jsx`

Panel de filtros principales de la aplicación.

**Props:**
```typescript
{
  isOpen: boolean,
  onToggle: Function,
  filtros: Object,
  setFiltros: Function,
  filteredOptions: Object,
  limitMax: number,
  min: number,
  max: number,
  filtroCaudal: Object,
  setFiltroCaudal: Function,
  ordenCaudal: string,
  setOrdenCaudal: Function,
  handleCoordenadasUnicas: Function,
  handleFiltroChange: Function,
  isLoaded: boolean,
  puntos: Array,
  limiteSolicitado: number,
  agrupar: boolean,
  setAgrupar: Function,
  queryCompleted: boolean
}
```

**Filtros disponibles:**

1. **Región** (Select)
   - Todas las regiones de Chile
   - Filtra cascada: limita cuencas/subcuencas disponibles

2. **Cuenca** (Select)
   - Filtrado por región seleccionada
   - Opcional: todas las cuencas disponibles

3. **Subcuenca** (Select)
   - Filtrado por cuenca seleccionada
   - Incluye opción "Sin subcuenca registrada"

4. **Tipo de Punto** (Checkboxes)
   - Extracción superficial
   - Extracción subterránea

5. **Rango de Caudal** (Slider doble)
   - Min/Max dinámicos según área seleccionada
   - Unidad: l/s

6. **Ordenamiento** (Select)
   - Mayor a menor caudal
   - Menor a mayor caudal

7. **Límite de resultados** (Input numérico)
   - Controla cuántos puntos se muestran

**Características:**
- 🔄 Filtros reactivos en cascada
- 📊 Contador de resultados
- 🔄 Toggle de agrupación de marcadores
- 🔍 Coordenadas únicas
- ✅ Indicadores de estado (loading, completado)

---

### SidebarCuenca.jsx
**Ubicación:** `src/components/sidebars/SidebarCuenca.jsx`

Panel de análisis de cuencas.

**Props:**
```typescript
{
  isOpen: boolean,
  onClose: Function,
  cuencaAnalysis: Object,
  cuencaLoading: boolean,
  graphicsCuencasLoading: boolean,
  graficosData: Object,
  loadCuencasGraphics: Function,
  apiService: ApiService
}
```

**Secciones:**

1. **Información General**
   - Nombre de la cuenca
   - Código de cuenca
   - Estadísticas básicas

2. **Análisis de Caudal**
   - Caudal promedio
   - Caudal mínimo/máximo
   - Número de puntos

3. **Análisis de Informantes**
   - Gráficos de distribución
   - Tipos de informantes
   - Estadísticas agregadas

4. **Series de Tiempo** (Pestañas)
   - Serie de caudal
   - Serie de altura limnimétrica
   - Serie de nivel freático

**Gráficos:**
- 📊 Gráfico de barras de distribución
- 📈 Gráficos de líneas de series temporales
- 🥧 Gráficos circulares de informantes

---

### SidebarSubcuenca.jsx
**Ubicación:** `src/components/sidebars/SidebarSubcuenca.jsx`

Panel de análisis de subcuencas (estructura similar a SidebarCuenca).

**Props:**
```typescript
{
  isOpen: boolean,
  onClose: Function,
  subcuencaAnalysis: Object,
  subcuencaLoading: boolean,
  graphicsSubcuencasLoading: boolean,
  graficosSubcuencasData: Object,
  loadSubcuencasGraphics: Function,
  apiService: ApiService
}
```

**Características:**
- Similar a SidebarCuenca pero para subcuencas
- Incluye referencia a la cuenca padre
- Series de tiempo específicas de subcuenca

---

### SidebarPunto.jsx
**Ubicación:** `src/components/sidebars/SidebarPunto.jsx`

Panel de análisis de punto individual.

**Props:**
```typescript
{
  isOpen: boolean,
  onClose: Function,
  analisisPuntoSeleccionado: Object,
  analisisPuntoSeleccionadoLoading: boolean,
  graphicsPuntosLoading: boolean,
  graficosPuntosData: Object,
  loadPuntosGraphics: Function,
  apiService: ApiService
}
```

**Información mostrada:**

1. **Datos del Punto**
   - Coordenadas (UTM)
   - Ubicación (región, cuenca, subcuenca)
   - Tipo de extracción

2. **Estadísticas**
   - Caudal (promedio, min, max)
   - Fecha de última medición
   - Número de mediciones

3. **Series de Tiempo** (Pestañas)
   - Caudal histórico
   - Nivel freático (si aplica)
   - Altura limnimétrica (si aplica)

4. **Gráficos**
   - 📈 Serie temporal de mediciones
   - 📊 Distribución de valores

---

### FilterSection.jsx
**Ubicación:** `src/components/sidebars/FilterSection.jsx`

Componente reutilizable para secciones de filtro.

**Props:**
```typescript
{
  title: string,
  children: ReactNode,
  isCollapsible?: boolean,
  defaultOpen?: boolean
}
```

**Uso:**
```javascript
<FilterSection title="Filtros Geográficos" isCollapsible defaultOpen={true}>
  <RegionFilter />
  <CuencaFilter />
</FilterSection>
```

---

## Componentes de Gráficos

### BarChart.jsx
**Ubicación:** `src/components/charts/BarChart.jsx`

Gráfico de barras usando Chart.js.

**Props:**
```typescript
{
  data: Object,      // Datos en formato Chart.js
  options?: Object,  // Opciones de configuración
  title?: string
}
```

---

### LineChart.jsx
**Ubicación:** `src/components/charts/LineChart.jsx`

Gráfico de líneas para series temporales.

**Props:**
```typescript
{
  data: Array<{x: Date, y: number}>,
  title?: string,
  yLabel?: string,
  color?: string
}
```

**Basado en:** Recharts / Chart.js

---

## Componentes UI Reutilizables

### LoadingSpinner.jsx
**Ubicación:** `src/components/UI/LoadingSpinner.jsx` (si existe)

Spinner de carga reutilizable.

**Props:**
```typescript
{
  size?: 'sm' | 'md' | 'lg',
  color?: string,
  text?: string
}
```

**Uso:**
```javascript
<LoadingSpinner size="md" text="Cargando datos..." />
```

---

### Legend.jsx (Leyend.jsx)
**Ubicación:** `src/components/UI/Leyend.jsx`

Leyenda del mapa con colores de marcadores.

**Props:**
```typescript
{
  position: string,  // Posición en el mapa (bottomright, topleft, etc.)
  colores: {
    subterraneo: string,
    extraccion: string,
    sinClasificar: string
  }
}
```

**Renderiza:**
- 🔵 Azul: Extracción superficial
- 🟠 Naranja: Extracción subterránea
- ⚪ Gris: Sin clasificar

---

### EstadisticBox.jsx
**Ubicación:** `src/components/UI/EstadisticBox.jsx`

Caja para mostrar una estadística.

**Props:**
```typescript
{
  label: string,
  value: string | number,
  icon?: ReactNode,
  color?: string
}
```

**Uso:**
```javascript
<EstadisticBox
  label="Puntos Totales"
  value={150}
  icon={<MapIcon />}
  color="blue"
/>
```

---

## Modales

### ComparePointsModal.jsx
**Ubicación:** `src/components/modals/ComparePointsModal.jsx`

Modal para comparar dos puntos.

**Props:**
```typescript
{
  isOpen: boolean,
  onClose: Function,
  point1: Object | null,
  point2: Object | null,
  apiService: ApiService
}
```

**Funcionalidades:**
- ⚖️ Comparación lado a lado de dos puntos
- 📊 Gráficos comparativos de series temporales
- 📈 Estadísticas comparativas
- 🔄 Carga de datos adicionales vía API

---

## Custom Hooks

### useMapData
**Ubicación:** `src/hooks/useMapData.js`

Hook para cargar datos iniciales del mapa.

**Parámetros:**
```typescript
(apiUrl: string) => {
  datosOriginales: Object,
  minMaxDatosOriginales: Object,
  isLoaded: boolean,
  error: Error | null,
  apiService: ApiService
}
```

**Responsabilidades:**
- 🔌 Inicializar ApiService
- 📥 Cargar cuencas y estadísticas iniciales
- ⚠️ Manejo de errores
- ✅ Estado de carga

**Uso:**
```javascript
const { datosOriginales, isLoaded, apiService } = useMapData(apiUrl);
```

---

### useFilterLogic
**Ubicación:** `src/hooks/useFilterLogic.js`

Hook con la lógica completa de filtrado.

**Parámetros:**
```typescript
(
  datosOriginales: Object,
  minMaxDatosOriginales: Object,
  isLoaded: boolean,
  apiService: ApiService
) => {
  filtros: Object,
  setFiltros: Function,
  filtroCaudal: Object,
  setFiltroCaudal: Function,
  ordenCaudal: string,
  setOrdenCaudal: Function,
  puntos: Array,
  limiteSolicitado: number,
  filteredOptions: Object,
  limitMax: number,
  min: number,
  max: number,
  handleFiltroChange: Function,
  handleCoordenadasUnicas: Function,
  queryCompleted: boolean
}
```

**Funcionalidades:**
- 🔍 Gestión de filtros (región, cuenca, subcuenca, tipo)
- 📊 Cálculo de opciones disponibles (cascada)
- 🎯 Filtrado de puntos con API
- 📈 Límites dinámicos de caudal
- 🔄 Ordenamiento de resultados

**Lógica de filtros en cascada:**
```
Región seleccionada
  ↓
Cuencas disponibles filtradas
  ↓
Subcuencas disponibles filtradas
  ↓
Puntos filtrados
```

---

### useSidebarState
**Ubicación:** `src/hooks/useSidebarState.js`

Hook para gestionar estado de sidebars.

**Retorno:**
```typescript
{
  sidebarAbierto: boolean,
  setSidebarAbierto: Function,
  rightSidebarAbiertoCuencas: boolean,
  setRightSidebarAbiertoCuencas: Function,
  rightSidebarAbiertoSubcuencas: boolean,
  setRightSidebarAbiertoSubcuencas: Function,
  rightSidebarAbiertoPunto: boolean,
  setRightSidebarAbiertoPunto: Function,
  openCuencaSidebar: Function,
  openSubcuencaSidebar: Function,
  openPuntoSidebar: Function
}
```

**Funcionalidades:**
- 🎛️ Estado de visibilidad de cada sidebar
- 🔄 Funciones helper para abrir/cerrar
- 🚪 Auto-cierre de sidebars conflictivos

---

### useAnalysisData
**Ubicación:** `src/hooks/useAnalysisData.js`

Hook para gestionar datos de análisis.

**Parámetros:**
```typescript
(apiService: ApiService) => {
  // Análisis de cuenca
  cuencaAnalysis: Object,
  cuencaLoading: boolean,
  graphicsCuencasLoading: boolean,
  graficosData: Object,
  loadCuencaAnalysis: (nombre, codigo) => Promise<void>,
  loadCuencasGraphics: (codigo, tipo) => Promise<void>,

  // Análisis de subcuenca (similar)
  // Análisis de punto (similar)
}
```

**Responsabilidades:**
- 📊 Cargar análisis de cuencas/subcuencas/puntos
- 📈 Cargar datos de gráficos
- ⚠️ Manejo de estados de carga y error
- 🔄 Caché de datos cargados

---

## Context API

### MapContext
**Ubicación:** `src/contexts/MapContext.jsx`

Contexto global de la aplicación.

**Provider:**
```javascript
<MapProvider apiUrl={apiUrl}>
  {children}
</MapProvider>
```

**Hook de consumo:**
```javascript
const context = useMapContext();
```

**Estado global incluye:**
- Datos originales (cuencas, estadísticas)
- Filtros activos
- Puntos filtrados
- Estados de sidebars
- Datos de análisis
- ApiService instance

---

## Servicios

### ApiService
**Ubicación:** `src/services/apiService.js`

Clase que encapsula todas las llamadas a la API REST.

**Constructor:**
```javascript
const apiService = new ApiService(baseUrl, timeout = 30000);
```

**Métodos principales:**

#### Cuencas
```javascript
await apiService.getCuencas();
await apiService.getCuencasStats({ cod_cuenca, cod_subcuenca });
await apiService.getCuencaAnalisisCaudal(cuencaIdentificador);
await apiService.getCuencaAnalisisInformantes(cuencaIdentificador);
await apiService.getCuencaSeriesTiempoCaudal(cuencaIdentificador);
```

#### Subcuencas
```javascript
await apiService.getSubcuencaAnalisisCaudal(subcuencaId, cuencaId);
await apiService.getSubcuencaAnalisisInformantes(subcuencaId, cuencaId);
await apiService.getSubcuencaSeriesTiempoCaudal(cuencaId, subcuencaId);
```

#### Puntos
```javascript
await apiService.getPuntos(queryParams);
await apiService.getPuntoInfo(utmNorte, utmEste);
await apiService.getPuntosEstadisticas(utmNorte, utmEste);
await apiService.getPuntosSeriesTiempo(utmNorte, utmEste);
```

**Características:**
- ⏱️ Timeout configurable (default 30s)
- 🔒 Headers de seguridad automáticos
- ⚠️ Manejo robusto de errores
- 🔄 AbortController para cancelar requests

Ver [API-INTEGRATION.md](./API-INTEGRATION.md) para detalles completos.

---

## Utilidades

### filterUtils.js
**Ubicación:** `src/utils/filterUtils.js`

Funciones para filtrado de datos.

**Funciones principales:**
```javascript
// Filtrar array por múltiples criterios
filterByMultipleCriteria(array, criteria);

// Obtener valores únicos
getUniqueValues(array, key);

// Filtrar por rango numérico
filterByRange(array, key, min, max);
```

---

### mapUtils.js
**Ubicación:** `src/utils/mapUtils.js`

Utilidades relacionadas con el mapa.

**Funciones:**
```javascript
// Crear icono personalizado de marcador
createCustomMarkerIcon(color, tipo);

// Calcular bounds del mapa para múltiples puntos
calculateBounds(puntos);

// Convertir coordenadas
convertToLatLng(utmNorte, utmEste);
```

---

### geoCalculos.js
**Ubicación:** `src/utils/geoCalculos.js`

Cálculos geoespaciales con Turf.js.

**Funciones:**
```javascript
// Calcular distancia entre dos puntos
calcularDistancia(punto1, punto2);

// Verificar si punto está dentro de polígono
puntoEnPoligono(punto, poligono);

// Calcular área de polígono
calcularArea(poligono);
```

---

### utmConverter.js
**Ubicación:** `src/utils/utmConverter.js`

Conversión de coordenadas UTM a Lat/Lng.

**Funciones:**
```javascript
// Convertir UTM a Lat/Lng
utmToLatLng(utmNorte, utmEste, zona, hemisferio);

// Convertir Lat/Lng a UTM
latLngToUtm(lat, lng);
```

---

### sanitize.js
**Ubicación:** `src/utils/sanitize.js`

Sanitización de datos de usuario.

**Funciones:**
```javascript
// Sanitizar HTML
sanitizeHtml(html);

// Sanitizar texto para SQL (prevención básica)
sanitizeText(text);

// Validar y sanitizar número
sanitizeNumber(value, min, max);
```

**Basado en:** DOMPurify

---

### dateValidation.js
**Ubicación:** `src/utils/dateValidation.js`

Validación y parsing de fechas.

**Funciones:**
```javascript
// Validar fecha
isValidDate(dateString);

// Parsear fecha a formato ISO
parseToISO(dateString);

// Comparar fechas
isDateBefore(date1, date2);
isDateAfter(date1, date2);
```

---

### formatNumberCL.js
**Ubicación:** `src/utils/formatNumberCL.js`

Formateo de números para Chile.

**Función:**
```javascript
// Formatear número con separadores chilenos
formatNumberCL(number, decimals = 2);
// Ejemplo: 1234567.89 → "1.234.567,89"
```

---

## Constantes

### apiEndpoints.js
**Ubicación:** `src/constants/apiEndpoints.js`

Endpoints de la API.

```javascript
export const API_ENDPOINTS = {
  CUENCAS: '/cuencas',
  CUENCAS_STATS: '/cuencas/stats',
  PUNTOS: '/puntos',
  PUNTOS_ESTADISTICAS: '/puntos/estadisticas',
  // ... más endpoints
};
```

---

### mapConfig.js
**Ubicación:** `src/constants/mapConfig.js`

Configuración del mapa.

```javascript
export const MAP_CONFIG = {
  DEFAULT_CENTER: [-33.4489, -70.6693],  // Santiago, Chile
  DEFAULT_ZOOM: 5,
  MIN_ZOOM: 4,
  MAX_ZOOM: 18,
  MARKER_COLORS: {
    SURFACE_EXTRACTION: '#2E7BCC',
    UNDERGROUND_EXTRACTION: '#FF5722',
    UNCLASSIFIED: '#808080'
  },
  TILE_LAYERS: {
    osm: { ... },
    satellite: { ... },
    topographic: { ... }
  }
};
```

---

### regionesChile.js
**Ubicación:** `src/constants/regionesChile.js`

Lista de regiones de Chile.

```javascript
export const REGIONES_CHILE = [
  { codigo: 'XV', nombre: 'Arica y Parinacota' },
  { codigo: 'I', nombre: 'Tarapacá' },
  // ... más regiones
];
```

---

## Jerarquía de Componentes

```
Mapa
├── MapProvider (Context)
│   ├── useMapData
│   ├── useFilterLogic
│   ├── useSidebarState
│   └── useAnalysisData
│
└── MapaContent
    ├── MapContainer
    │   ├── TileLayer
    │   ├── Legend
    │   ├── ZoomControl
    │   ├── LayerSelector
    │   ├── ToolsEditControl
    │   └── MarkerLayer
    │       ├── Marker (x N)
    │       └── Popup
    │
    ├── SidebarManager
    │   ├── SidebarFiltros
    │   │   ├── FilterSection (x N)
    │   │   └── FilterControls
    │   ├── SidebarCuenca
    │   │   ├── EstadisticBox (x N)
    │   │   └── Chart (x N)
    │   ├── SidebarSubcuenca
    │   └── SidebarPunto
    │
    ├── ComparePointsSelector
    └── ComparePointsModal
        ├── PointComparison
        └── ComparisonCharts
```

---

**Última actualización:** Noviembre 2025
