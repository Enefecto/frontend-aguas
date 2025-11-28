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

![Diagrama de Arquitectura General](./images/DiagramaArquitecturaGeneral.png)

---

## Diagrama de Componentes

![Diagrama de Componentes](./images/DiagramaComponentes.png)

---

## Flujo de Datos

### Inicialización de la Aplicación

![Inicializacion de la Aplicacion](./images/InicializacionAplicacion.png)

### Flujo de Filtrado

![Flujo de Filtrado](./images/FlujoFiltrado.png)

### Flujo de Análisis de Cuenca

![Analisis Cuenca](./images/AnalisisCuenca.png)

---

## Diagrama de Context API

![Context API](./images/ContextAPI.png)

---

## Flujo de Usuario

### User Journey: Filtrar y Analizar Puntos

![User Journey](./images/UserJourney.png)

---

## Diagrama de Deployment

![Deployment](./images/Deployment.png)

### Pipeline de CI/CD

![Pipeline CI/CD](./images/PipelineCICD.png)

---

## Estructura de Hooks

![Hooks](./images/Hooks.png)

---

## Diagrama de API Requests

![api REQUESTS](./images/apiREQUESTS.png)

---

## Diagrama de Seguridad

![Seguridad](./images/Seguridad.png)

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
