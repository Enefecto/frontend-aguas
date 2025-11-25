# 📊 Diagramas del Sistema

Esta carpeta contiene diagramas visuales de la arquitectura y flujos del proyecto **Aguas Transparentes Frontend**.

Todos los diagramas están en formato **Mermaid** que GitHub renderiza automáticamente.

## Tabla de Contenidos

- [Diagrama de Arquitectura General](#diagrama-de-arquitectura-general)
- [Diagrama de Componentes](#diagrama-de-componentes)
- [Flujo de Datos](#flujo-de-datos)
- [Diagrama de Context API](#diagrama-de-context-api)
- [Flujo de Usuario](#flujo-de-usuario)
- [Diagrama de Deployment](#diagrama-de-deployment)
- [Estructura de Hooks](#estructura-de-hooks)

---

## Diagrama de Arquitectura General

![Diagrama de Arquitectura General](./DiagramaArquitecturaGeneral.png)

---

## Diagrama de Componentes

![Diagrama de Componentes](./DiagramaComponentes.png)

---

## Flujo de Datos

### Inicialización de la Aplicación

![Inicializacion de la Aplicacion](./InicializacionAplicacion.png)

### Flujo de Filtrado

![Flujo de Filtrado](./FlujoFiltrado.png)

### Flujo de Análisis de Cuenca

```mermaid
sequenceDiagram
    participant U as Usuario
    participant Map as MapContainer
    participant A as useAnalysisData
    participant API as ApiService
    participant B as Backend
    participant SC as SidebarCuenca

    U->>Map: Click en polígono cuenca
    Map->>A: loadCuencaAnalysis('0101')
    A->>A: Set loading = true

    par Requests paralelos
        A->>API: getCuencaAnalisisCaudal('0101')
        API->>B: GET /api/cuencas/analisis_caudal
        B-->>API: Estadísticas caudal
        API-->>A: Datos caudal
    and
        A->>API: getCuencaAnalisisInformantes('0101')
        API->>B: GET /api/cuencas/analisis_informantes
        B-->>API: Datos informantes
        API-->>A: Datos informantes
    end

    A->>A: Set loading = false
    A->>A: Actualiza estado análisis
    A-->>SC: Datos disponibles
    SC-->>U: Muestra análisis con gráficos
```

---

## Diagrama de Context API

```mermaid
graph LR
    subgraph "MapProvider"
        style MapProvider fill:#fff3cd

        subgraph "Custom Hooks"
            H1[useMapData<br/>📊 Datos]
            H2[useFilterLogic<br/>🔍 Filtros]
            H3[useSidebarState<br/>🎛️ UI State]
            H4[useAnalysisData<br/>📈 Análisis]
        end

        Estado[Estado Global<br/>Combinado]
    end

    subgraph "Consumidores"
        C1[MapContainer]
        C2[SidebarFiltros]
        C3[SidebarCuenca]
        C4[SidebarPunto]
    end

    H1 --> Estado
    H2 --> Estado
    H3 --> Estado
    H4 --> Estado

    Estado --> C1
    Estado --> C2
    Estado --> C3
    Estado --> C4

    C1 -.->|useMapContext| Estado
    C2 -.->|useMapContext| Estado
    C3 -.->|useMapContext| Estado
    C4 -.->|useMapContext| Estado
```

---

## Flujo de Usuario

### User Journey: Filtrar y Analizar Puntos

```mermaid
journey
    title Filtrar y Analizar Puntos de Agua
    section Inicio
      Abrir aplicación: 5: Usuario
      Ver mapa inicial: 5: Usuario
    section Filtrado
      Abrir sidebar filtros: 4: Usuario
      Seleccionar región: 4: Usuario
      Seleccionar cuenca: 4: Usuario
      Ajustar rango caudal: 3: Usuario
      Ver resultados: 5: Usuario
    section Análisis
      Click en punto: 5: Usuario
      Ver sidebar análisis: 5: Usuario
      Revisar gráficos: 4: Usuario
      Ver series tiempo: 4: Usuario
    section Comparación
      Activar modo comparar: 3: Usuario
      Seleccionar punto 1: 4: Usuario
      Seleccionar punto 2: 4: Usuario
      Ver comparación: 5: Usuario
```

---

## Diagrama de Deployment

```mermaid
graph TB
    subgraph "Desarrollador"
        Dev[Desarrollador<br/>local]
    end

    subgraph "GitHub"
        Repo[Repositorio<br/>frontend-aguas]
        Actions[GitHub Actions<br/>CI/CD]
    end

    subgraph "Azure"
        SWA[Static Web App<br/>Build & Deploy]
        CDN[Azure CDN<br/>Global]
        Prod[Producción<br/>URL principal]
        Preview[Preview Envs<br/>Por PR]
    end

    subgraph "Backend"
        API[API Backend<br/>Azure App Service]
    end

    subgraph "Usuarios"
        U1[Usuario Web]
        U2[Usuario Móvil]
    end

    Dev -->|git push| Repo
    Repo -->|trigger| Actions
    Actions -->|deploy| SWA

    SWA -->|build OK| CDN
    CDN --> Prod
    SWA -.->|PR| Preview

    Prod --> U1
    Prod --> U2

    Prod -->|API calls| API
    Preview -->|API calls| API

    style SWA fill:#0078d4
    style CDN fill:#50e6ff
    style API fill:#f8d7da
```

### Pipeline de CI/CD

```mermaid
graph LR
    A[Push a main] --> B{GitHub Action}
    B --> C[Checkout code]
    C --> D[Setup Node.js 18]
    D --> E[npm install]
    E --> F[npm run build]
    F --> G{Build OK?}

    G -->|Sí| H[Deploy a Azure]
    G -->|No| I[❌ Notificar error]

    H --> J[Invalidar CDN]
    J --> K[✅ Live en producción]

    PR[Pull Request] --> L{GitHub Action}
    L --> M[Build PR]
    M --> N{Build OK?}
    N -->|Sí| O[Deploy preview env]
    N -->|No| P[❌ Bloquear merge]

    O --> Q[Preview URL disponible]

    style K fill:#d4edda
    style I fill:#f8d7da
    style P fill:#f8d7da
    style Q fill:#d1ecf1
```

---

## Estructura de Hooks

```mermaid
graph TB
    subgraph "useMapData"
        MD1[Inicializar ApiService]
        MD2[Cargar cuencas]
        MD3[Cargar stats]
        MD4[Estado: datosOriginales]

        MD1 --> MD2
        MD1 --> MD3
        MD2 --> MD4
        MD3 --> MD4
    end

    subgraph "useFilterLogic"
        FL1[Estado: filtros]
        FL2[Estado: filtroCaudal]
        FL3[Calcular opciones cascada]
        FL4[Fetch puntos filtrados]
        FL5[Estado: puntos]

        FL1 --> FL3
        FL3 --> FL4
        FL4 --> FL5
        FL2 --> FL4
    end

    subgraph "useSidebarState"
        SS1[Estado: sidebar abierto/cerrado]
        SS2[Funciones: open/close]

        SS1 --> SS2
    end

    subgraph "useAnalysisData"
        AD1[Estado: cuencaAnalysis]
        AD2[Estado: subcuencaAnalysis]
        AD3[Estado: puntoAnalysis]
        AD4[Funciones: loadAnalysis]
        AD5[Fetch análisis API]

        AD4 --> AD5
        AD5 --> AD1
        AD5 --> AD2
        AD5 --> AD3
    end

    MD4 -.-> FL3
    FL5 -.-> MapContainer
    SS1 -.-> SidebarManager
    AD1 -.-> SidebarCuenca

    style MD4 fill:#d1ecf1
    style FL5 fill:#d1ecf1
    style SS1 fill:#fff3cd
    style AD1 fill:#d4edda
```

---

## Diagrama de API Requests

```mermaid
graph TB
    subgraph "Frontend Components"
        C1[MapaContent]
        C2[SidebarFiltros]
        C3[SidebarCuenca]
    end

    subgraph "ApiService Methods"
        API1[getCuencas]
        API2[getCuencasStats]
        API3[getPuntos]
        API4[getCuencaAnalisis]
        API5[getSeriesTiempo]
    end

    subgraph "Backend Endpoints"
        E1[GET /api/cuencas]
        E2[GET /api/cuencas/stats]
        E3[GET /api/puntos]
        E4[GET /api/cuencas/analisis_caudal]
        E5[GET /api/puntos/series_de_tiempo/caudal]
    end

    C1 --> API1
    C1 --> API2
    C2 --> API3
    C3 --> API4
    C3 --> API5

    API1 --> E1
    API2 --> E2
    API3 --> E3
    API4 --> E4
    API5 --> E5

    E1 -.-> DB[(Database)]
    E2 -.-> DB
    E3 -.-> DB
    E4 -.-> DB
    E5 -.-> DB

    style API1 fill:#d1ecf1
    style API2 fill:#d1ecf1
    style API3 fill:#d1ecf1
    style API4 fill:#d1ecf1
    style API5 fill:#d1ecf1
```

---

## Diagrama de Seguridad

```mermaid
graph TB
    subgraph "Cliente"
        Browser[Navegador]
    end

    subgraph "Azure Static Web Apps"
        CDN[CDN con SSL/TLS]
        Headers[Security Headers<br/>CSP, HSTS, etc.]
        StaticFiles[Archivos estáticos]
    end

    subgraph "Backend API"
        CORS[CORS Policy]
        API[API Endpoints]
        Validation[Input Validation]
    end

    Browser -->|HTTPS| CDN
    CDN --> Headers
    Headers --> StaticFiles

    Browser -->|API Request| CORS
    CORS --> API
    API --> Validation

    StaticFiles -.->|PUBLIC_API_URL| API

    style Headers fill:#d4edda
    style CORS fill:#fff3cd
    style Validation fill:#d1ecf1
```

**Medidas de Seguridad:**
- ✅ HTTPS enforced (HSTS)
- ✅ Content Security Policy (CSP)
- ✅ X-Frame-Options: DENY (anti-clickjacking)
- ✅ X-Content-Type-Options: nosniff
- ✅ CORS configurado en backend
- ✅ Input sanitization (DOMPurify)
- ✅ Request timeout (30s)

---

## Cómo Usar Estos Diagramas

### Ver en GitHub
Los diagramas Mermaid se renderizan automáticamente en GitHub. Solo abre este archivo.

### Exportar como Imagen
1. Usa [Mermaid Live Editor](https://mermaid.live)
2. Copia y pega el código del diagrama
3. Exporta como PNG o SVG

### Editar Diagramas
- Editor online: https://mermaid.live
- VSCode extension: Mermaid Preview
- Sintaxis: https://mermaid.js.org/

---

**Última actualización:** Noviembre 2025
