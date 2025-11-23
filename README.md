# 💧 Aguas Transparentes - Frontend

Aplicación web interactiva de visualización y análisis de recursos hídricos en Chile, construida con Astro, React y Leaflet.

![Astro](https://img.shields.io/badge/Astro-5.15.1-FF5D01?style=flat&logo=astro)
![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat&logo=react)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?style=flat&logo=leaflet)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.10-38B2AC?style=flat&logo=tailwind-css)

## 📋 Descripción

**Aguas Transparentes** es un sistema de información geográfica (SIG) web que permite:

- 🗺️ Visualizar puntos de medición de recursos hídricos en un mapa interactivo
- 📊 Analizar estadísticas de caudales, niveles freáticos y alturas limnimétricas
- 🔍 Filtrar datos por región, cuenca, subcuenca, tipo de punto y rangos de caudal
- 📈 Visualizar series temporales y gráficos comparativos
- 🎯 Realizar análisis espaciales con herramientas de dibujo
- ⚖️ Comparar datos entre diferentes puntos de medición

El frontend consume una API REST que provee datos geoespaciales y estadísticos de cuencas hidrográficas y puntos de monitoreo a lo largo de Chile.

## 🚀 Quick Start

### Prerrequisitos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### Instalación

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd frontend-aguas

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env y configura PUBLIC_API_URL

# 4. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:4321`

## 📚 Documentación

La documentación completa del proyecto está organizada en:

- **[Arquitectura](docs/ARCHITECTURE.md)** - Estructura del proyecto, patrones de diseño y flujo de datos
- **[Configuración](docs/SETUP.md)** - Guía detallada de instalación y configuración
- **[Desarrollo](docs/DEVELOPMENT.md)** - Workflow, convenciones y guía para contribuir
- **[Componentes](docs/COMPONENTS.md)** - Catálogo de componentes y custom hooks
- **[Integración API](docs/API-INTEGRATION.md)** - Documentación de endpoints y manejo de datos
- **[Deployment](docs/DEPLOYMENT.md)** - Proceso de despliegue en Azure Static Web Apps
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Solución de problemas comunes
- **[Diagramas](docs/DIAGRAMS/)** - Diagramas visuales de arquitectura y flujos

## 🛠️ Stack Tecnológico

### Core
- **[Astro](https://astro.build/)** (5.15.1) - Generador de sitios estáticos con arquitectura de islas
- **[React](https://react.dev/)** (18.2.0) - Biblioteca de componentes UI
- **[Leaflet](https://leafletjs.com/)** (1.9.4) - Biblioteca de mapas interactivos
- **[React Leaflet](https://react-leaflet.js.org/)** (4.2.1) - Componentes React para Leaflet

### UI & Styling
- **[Tailwind CSS](https://tailwindcss.com/)** (4.1.10) - Framework CSS utility-first
- **[Material-UI](https://mui.com/)** (7.2.0) - Componentes UI basados en Material Design

### Visualización de Datos
- **[Chart.js](https://www.chartjs.org/)** (4.5.0) - Biblioteca de gráficos
- **[Recharts](https://recharts.org/)** (3.0.0) - Componentes de gráficos para React

### Geoespacial
- **[Turf.js](https://turfjs.org/)** (7.2.0) - Análisis geoespacial
- **[Leaflet Draw](https://leaflet.github.io/Leaflet.draw/)** (1.0.4) - Herramientas de dibujo en mapas
- **[Leaflet MarkerCluster](https://github.com/Leaflet/Leaflet.markercluster)** (1.5.3) - Agrupación de marcadores

## 📦 Comandos Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo (puerto 4321)

# Producción
npm run build        # Construye el proyecto para producción
npm run preview      # Previsualiza el build de producción

# Otros
npm run astro        # Ejecuta comandos de Astro CLI
```

## 🏗️ Estructura del Proyecto

```
frontend-aguas/
├── src/
│   ├── components/       # Componentes React
│   │   ├── map/          # Componentes del mapa
│   │   ├── sidebars/     # Paneles laterales
│   │   ├── charts/       # Gráficos y visualizaciones
│   │   ├── ui/           # Componentes UI reutilizables
│   │   └── ...
│   ├── contexts/         # Context API providers
│   ├── hooks/            # Custom React hooks
│   ├── services/         # Servicios (API, etc.)
│   ├── utils/            # Funciones utilitarias
│   ├── constants/        # Constantes y configuraciones
│   ├── pages/            # Páginas Astro
│   └── styles/           # Estilos globales
├── public/               # Archivos estáticos
├── docs/                 # Documentación del proyecto
└── ...
```

## 🔐 Configuración de Entorno

El proyecto requiere las siguientes variables de entorno:

```bash
# .env
PUBLIC_API_URL="https://tu-api-backend.com"
```

**Importante:** En Astro, las variables que se exponen al cliente deben tener el prefijo `PUBLIC_`.

Ver [docs/SETUP.md](docs/SETUP.md) para más detalles.

## 🌐 Deployment

El proyecto está configurado para desplegarse en **Azure Static Web Apps**:

- Build automático desde GitHub
- Configuración de headers de seguridad
- SPA routing con fallback a index.html
- Content Security Policy configurada

Ver [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) para instrucciones detalladas.

## 🔑 Características Principales

### Mapa Interactivo
- Visualización de puntos de medición con marcadores personalizados
- Agrupación automática de marcadores (clustering)
- Capas de cuencas y subcuencas con colores diferenciados
- Herramientas de dibujo para análisis espacial
- Popups informativos con datos de puntos

### Sistema de Filtros
- Filtros reactivos en cascada (Región → Cuenca → Subcuenca)
- Filtrado por rango de caudal con límites dinámicos
- Filtrado por tipo de punto (superficial/subterráneo)
- Control de límite de resultados
- Ordenamiento de resultados

### Análisis y Estadísticas
- Análisis de cuencas y subcuencas
- Gráficos de distribución de caudales
- Series temporales de mediciones
- Comparación entre puntos
- Estadísticas agregadas

### Sidebars Dinámicos
- Panel de filtros (izquierda)
- Paneles de análisis (derecha):
  - Análisis de cuenca
  - Análisis de subcuenca
  - Análisis de punto individual

## 🧩 Patrones de Diseño

- **Context API** para estado global
- **Custom Hooks** para lógica reutilizable
- **Separation of Concerns** con capas bien definidas
- **Service Layer** para abstracción de API
- **Component Composition** para UI modular

## 🔒 Seguridad

El proyecto implementa:

- Content Security Policy (CSP)
- Headers de seguridad HTTP
- Validación de variables de entorno
- Sanitización de datos de usuario
- Timeout en peticiones API
- HTTPS enforcement en producción

## 📄 Licencia

[Especificar licencia del proyecto]

## 👥 Equipo

[Información del equipo o contacto]

## 📞 Soporte

Para reportar bugs o solicitar features:
- Abrir un issue en el repositorio
- Contactar al equipo de desarrollo

---

**Documentación actualizada:** Noviembre 2025

