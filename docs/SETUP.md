# ⚙️ Guía de Configuración e Instalación

Esta guía te llevará paso a paso por el proceso de instalación y configuración del proyecto **Aguas Transparentes Frontend**.

## Tabla de Contenidos

- [Prerrequisitos](#prerrequisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Verificación](#verificación)
- [Problemas Comunes](#problemas-comunes)
- [Configuración del Backend](#configuración-del-backend)
- [Variables de Entorno](#variables-de-entorno)

---

## Prerrequisitos

### Software Requerido

#### 1. Node.js y npm

**Versión requerida:**
- Node.js: `>= 18.0.0`
- npm: `>= 9.0.0`

**Verificar instalación:**
```bash
node --version  # Debe mostrar v18.x.x o superior
npm --version   # Debe mostrar 9.x.x o superior
```

**Instalar Node.js:**
- **Opción 1 (Recomendada):** Usar [nvm](https://github.com/nvm-sh/nvm)
  ```bash
  # Instalar nvm
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

  # Instalar Node.js 18
  nvm install 18
  nvm use 18
  ```

- **Opción 2:** Descargar desde [nodejs.org](https://nodejs.org/)

#### 2. Git

**Verificar instalación:**
```bash
git --version
```

**Instalar Git:**
- **Ubuntu/Debian:** `sudo apt-get install git`
- **macOS:** `brew install git` o viene con Xcode
- **Windows:** [git-scm.com](https://git-scm.com/)

#### 3. Editor de Código (Recomendado)

- **Visual Studio Code** con extensiones:
  - Astro
  - ESLint
  - Tailwind CSS IntelliSense
  - Prettier

### Requisitos del Sistema

- **RAM:** Mínimo 4GB (8GB recomendado)
- **Espacio en disco:** ~500MB para node_modules
- **Sistema operativo:** Windows 10+, macOS 10.15+, Ubuntu 20.04+

---

## Instalación

### 1. Clonar el Repositorio

```bash
# Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>

# Navegar al directorio
cd frontend-aguas
```

### 2. Instalar Dependencias

```bash
# Instalar todas las dependencias del proyecto
npm install
```

**Tiempo estimado:** 2-5 minutos dependiendo de tu conexión

**Salida esperada:**
```
added 1234 packages, and audited 1235 packages in 2m

123 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

### 3. Configurar Variables de Entorno

#### a) Copiar archivo de ejemplo

```bash
cp .env.example .env
```

#### b) Editar archivo `.env`

Abre el archivo `.env` en tu editor y configura las variables:

```bash
# .env
PUBLIC_API_URL="https://aguatrasparenteapi-h2d4gvbcfvcjfycr.eastus2-01.azurewebsites.net"
```

**Variables disponibles:**

| Variable | Descripción | Ejemplo | Requerido |
|----------|-------------|---------|-----------|
| `PUBLIC_API_URL` | URL del backend API | `https://api.ejemplo.com` | ✅ Sí |

**Importante:**
- Las variables en Astro que se usan en el cliente **DEBEN** tener el prefijo `PUBLIC_`
- NO uses comillas dentro del valor
- NO dejes espacios alrededor del `=`

#### c) Configurar para diferentes entornos

**Desarrollo local:**
```bash
PUBLIC_API_URL="http://localhost:8000"  # Si backend local
```

**Staging:**
```bash
PUBLIC_API_URL="https://staging-api.ejemplo.com"
```

**Producción:**
```bash
PUBLIC_API_URL="https://aguatrasparenteapi-h2d4gvbcfvcjfycr.eastus2-01.azurewebsites.net"
```

### 4. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

**Salida esperada:**
```
🚀 astro v5.15.1 started in 123ms

┃ Local    http://localhost:4321/
┃ Network  use --host to expose

watching for file changes...
```

### 5. Abrir en el Navegador

Navega a: **http://localhost:4321**

Deberías ver el mapa de Aguas Transparentes cargando.

---

## Configuración

### Configuración de Astro

El archivo `astro.config.mjs` contiene la configuración principal:

```javascript
// astro.config.mjs
export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    // ...
  }
});
```

**No necesitas modificar este archivo** a menos que:
- Quieras cambiar el puerto de desarrollo
- Agregues nuevas integraciones
- Modifiques la configuración de seguridad (CSP)

### Configuración de Tailwind CSS

El archivo `tailwind.config.js` gestiona estilos:

```javascript
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### Configuración de TypeScript

El archivo `tsconfig.json` está configurado para JSDoc y type-checking básico:

```json
{
  "extends": "astro/tsconfigs/base",
  "compilerOptions": {
    "jsx": "react-jsx",
    "allowJs": true,
    "checkJs": false
  }
}
```

---

## Verificación

### 1. Verificar que la App Carga

✅ **Checklist:**
- [ ] El servidor dev inicia sin errores
- [ ] Puedes acceder a `http://localhost:4321`
- [ ] El mapa aparece en pantalla
- [ ] No hay errores en la consola del navegador (F12)

### 2. Verificar Conexión con API

Abre la consola del navegador (F12) y observa la pestaña "Network":

✅ **Checklist:**
- [ ] Hay requests a `PUBLIC_API_URL/cuencas`
- [ ] Las requests devuelven status 200
- [ ] Los datos se cargan en el mapa

### 3. Verificar Funcionalidades Básicas

✅ **Checklist:**
- [ ] El mapa se puede hacer zoom y pan
- [ ] Los marcadores aparecen en el mapa
- [ ] El sidebar de filtros se abre al hacer clic
- [ ] Los filtros funcionan correctamente
- [ ] Al hacer clic en una cuenca, se abre el sidebar de análisis

### 4. Build de Producción

Verifica que el build funciona:

```bash
npm run build
```

**Salida esperada:**
```
building client
✓ 1234 modules transformed.
dist/index.html   12.34 kB
...
Completed in 5.67s
```

**Previsualizar el build:**
```bash
npm run preview
```

Navega a la URL mostrada (usualmente `http://localhost:4321`)

---

## Problemas Comunes

### 1. Error: "PUBLIC_API_URL no está definida"

**Síntoma:**
```
❌ ERROR DE CONFIGURACIÓN: La variable de entorno PUBLIC_API_URL no está definida.
```

**Solución:**
1. Verifica que el archivo `.env` existe en la raíz del proyecto
2. Verifica que contiene `PUBLIC_API_URL="..."`
3. Reinicia el servidor de desarrollo (`Ctrl+C` y `npm run dev`)

### 2. Error: "Cannot find module"

**Síntoma:**
```
Error: Cannot find module 'leaflet'
```

**Solución:**
```bash
# Borra node_modules y reinstala
rm -rf node_modules package-lock.json
npm install
```

### 3. Puerto 4321 ya en uso

**Síntoma:**
```
Error: Port 4321 is already in use
```

**Solución:**

**Opción 1:** Matar el proceso:
```bash
# Linux/macOS
lsof -ti:4321 | xargs kill -9

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 4321).OwningProcess | Stop-Process
```

**Opción 2:** Usar otro puerto:
```bash
npm run dev -- --port 3000
```

### 4. Errores de Leaflet en SSR

**Síntoma:**
```
ReferenceError: window is not defined
```

**Solución:**
- Verifica que el componente `Mapa` usa `client:only="react"` en `index.astro`
- Este error no debería ocurrir si la configuración es correcta

### 5. CORS Errors

**Síntoma:**
```
Access to fetch at 'https://...' from origin 'http://localhost:4321' has been blocked by CORS
```

**Solución:**
- El backend debe configurar CORS para permitir `http://localhost:4321`
- Contacta al equipo de backend para agregar el origen
- En desarrollo, podrías usar un proxy (ver `astro.config.mjs`)

### 6. Out of Memory en Build

**Síntoma:**
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Solución:**
```bash
# Aumentar memoria de Node.js
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### 7. Dependencias con Vulnerabilidades

**Síntoma:**
```
found 5 vulnerabilities (2 moderate, 3 high)
```

**Solución:**
```bash
# Intentar actualizar automáticamente
npm audit fix

# Si no funciona, revisar manualmente
npm audit

# Actualizar dependencias específicas
npm update <paquete>
```

---

## Configuración del Backend

### Requisitos del Backend

El frontend espera que el backend tenga los siguientes endpoints disponibles:

**Endpoints esenciales:**
- `GET /cuencas` - Lista de cuencas
- `GET /cuencas/stats` - Estadísticas de cuencas
- `GET /puntos` - Puntos de medición (con filtros query params)

Ver [API-INTEGRATION.md](./API-INTEGRATION.md) para lista completa.

### CORS en el Backend

El backend debe configurar CORS para permitir requests desde:
- `http://localhost:4321` (desarrollo)
- Tu dominio de producción

**Ejemplo en FastAPI (Python):**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4321",
        "https://tu-dominio.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Verificar Conectividad con Backend

```bash
# Probar endpoint de cuencas
curl https://aguatrasparenteapi-h2d4gvbcfvcjfycr.eastus2-01.azurewebsites.net/cuencas

# Debería devolver JSON con datos de cuencas
```

---

## Variables de Entorno

### Variables Disponibles

| Variable | Tipo | Descripción | Valor por defecto |
|----------|------|-------------|-------------------|
| `PUBLIC_API_URL` | string | URL base del API backend | (requerido) |

### Configuración por Entorno

#### Desarrollo Local
```bash
# .env
PUBLIC_API_URL="http://localhost:8000"
```

#### Staging
```bash
# .env.staging (crear manualmente)
PUBLIC_API_URL="https://staging-api.ejemplo.com"
```

#### Producción

En Azure Static Web Apps, configura las variables en:
1. Azure Portal → Tu Static Web App → Configuration
2. Agrega variable: `PUBLIC_API_URL`

**NO commitees archivos `.env` con valores de producción al repositorio.**

### Seguridad de Variables de Entorno

✅ **Buenas prácticas:**
- Usa `.env.example` como plantilla (SÍ commitear)
- NO commitees `.env` al repositorio (está en `.gitignore`)
- Usa diferentes valores para dev/staging/prod
- En producción, configura variables en la plataforma de hosting

❌ **NO hacer:**
- Commitear `.env` con secrets
- Hardcodear URLs directamente en el código
- Compartir valores de producción en Slack/email

---

## Próximos Pasos

Una vez completada la instalación:

1. Lee [DEVELOPMENT.md](./DEVELOPMENT.md) para workflow de desarrollo
2. Revisa [COMPONENTS.md](./COMPONENTS.md) para entender los componentes
3. Consulta [API-INTEGRATION.md](./API-INTEGRATION.md) para integración con backend

---

## Soporte

Si encuentras problemas no cubiertos en esta guía:

1. Revisa [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Abre un issue en el repositorio
3. Contacta al equipo de desarrollo

---

**Última actualización:** Noviembre 2025
