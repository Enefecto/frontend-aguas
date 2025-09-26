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
- Renderiza la navegación principal e incrusta el componente de Mapa de React
- Usa la directiva `client:only="react"` para el componente del mapa
- Pasa la URL de la API desde variables de entorno

**Componente Principal del Mapa**: `src/components/map.jsx`
- Lógica central de la aplicación que maneja el estado del mapa, obtención de datos e interacciones de UI
- Maneja múltiples capas de datos: cuencas, puntos y análisis
- Gestiona tres tipos de sidebars: filtros, análisis de cuencas y análisis de puntos
- Implementa funcionalidad de agrupación para marcadores del mapa
- Usa iconos SVG personalizados de gotas de agua para diferentes tipos de puntos

### Organización de Componentes Clave

**Sidebars** (`src/components/sidebars/`):
- `SidebarFiltros.jsx` - Controles principales de filtro para regiones, cuencas, caudales
- `SidebarCuenca.jsx` - Análisis de cuencas con gráficos y estadísticas
- `SidebarPunto.jsx` - Análisis específico de puntos y datos de series temporales

**Componentes UI** (`src/components/UI/`):
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

**Patrón de Gestión de Estado**:
El componente principal del mapa usa múltiples hooks useState para gestionar:
- Estados de filtros (región, cuenca, subcuenca, rango de caudal)
- Estados de visibilidad de sidebars
- Estados de carga para diferentes operaciones de datos
- Datos de gráficos y análisis

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