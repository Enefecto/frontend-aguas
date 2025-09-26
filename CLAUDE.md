# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) cuando trabaja con código en este repositorio.

## Comandos

### Desarrollo
- `npm run dev` - Iniciar el servidor de desarrollo
- `npm run build` - Construir el proyecto para producción
- `npm run preview` - Previsualizar la construcción de producción

## Arquitectura del Proyecto

Esta es una aplicación **Astro + React + Leaflet** que crea un mapa interactivo de recursos hídricos con capacidades de análisis.

### Stack Tecnológico Principal
- **Astro**: Generador de sitios estáticos con integración de React
- **React**: Biblioteca de componentes para elementos de UI interactivos
- **Leaflet**: Renderizado de mapas y características geoespaciales
- **Tailwind CSS**: Framework de estilos
- **Material-UI**: Componentes UI para sidebars y formularios

### Estructura de la Aplicación

**Punto de Entrada Principal**: `src/pages/index.astro`
- Renderiza la navegación principal e incrusta el componente MapaRefactorizado
- Usa la directiva `client:only="react"` para el componente del mapa
- Pasa la URL de la API desde variables de entorno

**Componente Principal Refactorizado**: `src/components/MapaRefactorizado.jsx`
- Implementa el patrón Provider/Consumer con Context API
- Divide la lógica en custom hooks especializados
- Gestiona estado global mediante MapContext
- Utiliza componentes modulares para el mapa y sidebars

**Arquitectura Modular**:
- **Context API**: `src/contexts/MapContext.jsx` - Estado global de la aplicación
- **Custom Hooks**: `src/hooks/` - Lógica de negocio especializada
- **Servicios**: `src/services/apiService.js` - Abstracción de llamadas API
- **Utilidades**: `src/utils/` - Funciones puras reutilizables
- **Constantes**: `src/constants/` - Configuraciones centralizadas

### Organización de Componentes Clave

**Componentes del Mapa** (`src/components/map/`):
- `MapContainer.jsx` - Contenedor principal del mapa con capas base
- `MarkerLayer.jsx` - Gestión de marcadores y clustering
- `SidebarManager.jsx` - Orquestador de todos los sidebars

**Sidebars** (`src/components/sidebars/`):
- `SidebarFiltrosRefactored.jsx` - Controles de filtro modulares y optimizados
- `FilterSection.jsx` - Componentes de filtro reutilizables
- `SidebarCuenca.jsx` - Análisis de cuencas con gráficos y estadísticas
- `SidebarPunto.jsx` - Análisis específico de puntos y datos de series temporales

**Componentes UI Reutilizables** (`src/components/ui/`):
- `LoadingSpinner.jsx` - Spinner de carga reutilizable
- `StatusButton.jsx` - Botón con estados (loading, success, error)
- `FilterGroup.jsx` - Contenedores y controles de filtro
- `CustomSwitch.jsx` - Switch personalizado con Material-UI

**Componentes Legacy** (`src/components/UI/`):
- `Leyend.jsx` - Componente de leyenda del mapa
- `EstadisticBox.jsx` - Cajas de visualización de estadísticas

**Herramientas Interactivas** (`src/components/tools/`):
- `ToolsEditControl.jsx` - Herramientas de dibujo y edición para el mapa

**Popups** (`src/components/Popups/`):
- Varios componentes popup para mostrar información de puntos

### Flujo de Datos e Integración de API

La aplicación obtiene datos de una API backend (configurada vía archivo `.env`):

**Endpoints Principales de Datos**:
- `/cuencas` - Datos de límites de cuencas
- `/cuencas/stats` - Datos estadísticos para filtrado
- `/puntos` - Puntos de medición de agua con capacidades de filtrado
- `/cuencas/analisis_caudal` - Análisis de caudal de cuencas
- `/cuencas/analisis_informantes` - Análisis de informantes con gráficos
- `/puntos/estadisticas` - Estadísticas de puntos individuales
- `/puntos/series_de_tiempo/caudal` - Datos de series temporales de caudal

**Patrón de Gestión de Estado Refactorizado**:
La aplicación usa un enfoque modular con Context API y custom hooks:
- **MapContext**: Estado global compartido entre componentes
- **useMapData**: Gestión de datos iniciales y API service
- **useFilterLogic**: Lógica compleja de filtros y cálculos derivados
- **useSidebarState**: Estados de visibilidad de sidebars
- **useAnalysisData**: Datos de análisis de cuencas y puntos
- **useFilterStatus**: Estados de UI para controles de filtros

### Características del Mapa

**Marcadores Personalizados**:
- Iconos SVG de gotas de agua con diferentes colores para tipos de puntos
- Azul (#2E7BCC) para puntos de extracción superficial
- Naranja (#FF5722) para pozos/puntos subterráneos

**Agrupación**:
- Agrupación opcional de marcadores usando react-leaflet-cluster
- Estilo personalizado de clusters con conteos de puntos

**Herramientas de Dibujo**:
- Integración de Leaflet Draw para crear formas en el mapa
- Análisis personalizado para puntos dentro de áreas dibujadas

### Sistema de Filtrado

Sistema de filtrado complejo con dependencias en cascada:
- Jerarquía Región → Cuenca → Subcuenca
- Filtrado por rango de caudal con min/max dinámicos basados en el área seleccionada
- Filtrado por tipo de punto
- Controles de límite de resultados

### Configuración de Entorno

- URL de API configurada vía archivo `.env` con variable `API_URL`
- Accedida en componentes Astro vía `import.meta.env.API_URL`