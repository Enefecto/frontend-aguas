# 🔧 Troubleshooting - Solución de Problemas

Esta guía proporciona soluciones a problemas comunes que puedes encontrar al desarrollar o desplegar **Aguas Transparentes Frontend**.

## Tabla de Contenidos

- [Problemas de Instalación](#problemas-de-instalación)
- [Problemas de Desarrollo](#problemas-de-desarrollo)
- [Problemas del Mapa (Leaflet)](#problemas-del-mapa-leaflet)
- [Problemas de API](#problemas-de-api)
- [Problemas de Performance](#problemas-de-performance)
- [Problemas de Build](#problemas-de-build)
- [Problemas de Deployment](#problemas-de-deployment)
- [Problemas de Navegadores](#problemas-de-navegadores)

---

## Problemas de Instalación

### ❌ Error: "Cannot find module"

**Síntoma:**
```
Error: Cannot find module 'leaflet'
  at Function.Module._resolveFilename
```

**Causas posibles:**
1. Dependencias no instaladas correctamente
2. `node_modules` corrupto
3. Version mismatch de npm/node

**Soluciones:**

```bash
# Opción 1: Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Opción 2: Limpiar caché de npm
npm cache clean --force
npm install

# Opción 3: Verificar versión de Node.js
node --version  # Debe ser >= 18.0.0
nvm use 18      # Si usas nvm
npm install
```

---

### ❌ Error: "EACCES permission denied"

**Síntoma:**
```
npm ERR! code EACCES
npm ERR! syscall access
npm ERR! path /usr/local/lib/node_modules
```

**Causa:**
Permisos insuficientes para instalar paquetes globales.

**Soluciones:**

```bash
# Opción 1: Usar nvm (RECOMENDADO)
# Instala nvm y reinstala Node.js con nvm

# Opción 2: Cambiar dueño del directorio npm
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Opción 3: No usar sudo (crear .npmrc)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
# Agregar a ~/.bashrc o ~/.zshrc:
export PATH=~/.npm-global/bin:$PATH
```

---

### ❌ Error: "Python not found"

**Síntoma:**
```
gyp ERR! find Python
gyp ERR! Python is not set from command line or npm configuration
```

**Causa:**
Algunas dependencias nativas requieren Python para compilar.

**Soluciones:**

```bash
# macOS
brew install python3

# Ubuntu/Debian
sudo apt-get install python3

# Windows
# Descargar desde python.org
# O usar chocolatey:
choco install python

# Configurar npm para usar Python
npm config set python python3
```

---

## Problemas de Desarrollo

### ❌ Puerto 4321 ya en uso

**Síntoma:**
```
Error: Port 4321 is already in use
```

**Soluciones:**

```bash
# Opción 1: Matar proceso en el puerto (Linux/macOS)
lsof -ti:4321 | xargs kill -9

# Opción 2: Matar proceso en el puerto (Windows PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 4321).OwningProcess | Stop-Process

# Opción 3: Usar otro puerto
npm run dev -- --port 3000
```

---

### ❌ Hot Module Replacement no funciona

**Síntoma:**
- Cambios en el código no se reflejan en el navegador
- Necesitas hacer refresh manual constantemente

**Soluciones:**

```bash
# 1. Verificar que el servidor dev esté corriendo
# Deberías ver: "watching for file changes..."

# 2. Limpiar caché de Vite
rm -rf node_modules/.vite
npm run dev

# 3. Hard refresh en el navegador
# Chrome/Firefox: Cmd+Shift+R (Mac) o Ctrl+Shift+F5 (Windows)

# 4. Verificar que el archivo está dentro de src/
# HMR solo funciona en archivos dentro de src/

# 5. Reiniciar servidor dev
# Ctrl+C y npm run dev de nuevo
```

---

### ❌ Cambios en .env no se aplican

**Síntoma:**
- Modificas `.env`
- La app sigue usando valores antiguos

**Causa:**
Astro/Vite cachea variables de entorno al iniciar.

**Solución:**

```bash
# SIEMPRE reinicia el servidor después de cambiar .env
# Ctrl+C para detener
npm run dev  # Iniciar de nuevo
```

---

## Problemas del Mapa (Leaflet)

### ❌ Error: "window is not defined"

**Síntoma:**
```
ReferenceError: window is not defined
  at leaflet.js:5
```

**Causa:**
Leaflet requiere `window` object (solo disponible en el navegador).

**Solución:**

Verificar que el componente usa `client:only`:

```astro
<!-- index.astro -->
<Mapa client:only="react" apiUrl={apiUrl} />
```

**NO usar:**
```astro
<Mapa client:load apiUrl={apiUrl} />  <!-- ❌ Puede causar SSR errors -->
```

---

### ❌ Mapa no se muestra (pantalla gris)

**Síntoma:**
- El contenedor del mapa aparece
- Pero el mapa es una pantalla gris sin tiles

**Causas y Soluciones:**

#### 1. CSS de Leaflet no cargado

```javascript
// Verificar que estés importando el CSS
import 'leaflet/dist/leaflet.css';
```

#### 2. Tamaño del contenedor no definido

```css
/* El contenedor del mapa DEBE tener altura definida */
.map-altura {
  height: 100vh;
  width: 100%;
}
```

#### 3. Tiles layer incorrecta

```javascript
// Verificar URL del tile layer
<TileLayer
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  attribution='&copy; OpenStreetMap contributors'
/>
```

#### 4. Problema de CORS con tiles

```bash
# Verificar en DevTools → Network
# Si hay errores CORS en las tiles, cambiar el provider
```

---

### ❌ Marcadores no aparecen

**Síntoma:**
- El mapa se carga correctamente
- Pero no aparecen los marcadores de puntos

**Diagnóstico:**

```javascript
// 1. Verificar que hay datos
console.log('Puntos:', puntos);  // Debe ser un array con elementos

// 2. Verificar formato de coordenadas
console.log('Primer punto:', puntos[0]);
// Debe tener lat y lon (o se deben convertir desde UTM)

// 3. Verificar que los marcadores están dentro del bounds del mapa
// Si las coordenadas son incorrectas, los marcadores pueden estar fuera de vista
```

**Soluciones:**

```javascript
// Si usas coordenadas UTM, asegúrate de convertirlas
import { utmToLatLng } from '../../utils/utmConverter';

const latLng = utmToLatLng(punto.utm_norte, punto.utm_este);
```

---

### ❌ Clustering no funciona

**Síntoma:**
- Marcadores individuales aparecen
- Pero no se agrupan en clusters

**Solución:**

```bash
# 1. Verificar que la librería está instalada
npm list react-leaflet-cluster

# 2. Verificar que estás usando el componente correcto
import MarkerClusterGroup from 'react-leaflet-cluster';

# 3. Verificar que 'agrupar' prop es true
<MarkerLayer agrupar={true} puntos={puntos} />

# 4. Importar CSS de cluster
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
```

---

### ❌ Popups no se muestran

**Síntoma:**
- Haces click en un marcador
- No aparece popup

**Solución:**

```javascript
// Verificar estructura del Popup
<Marker position={[lat, lon]}>
  <Popup>
    <div>Contenido del popup</div>
  </Popup>
</Marker>

// NO:
<Marker position={[lat, lon]} popup="Contenido" />  // ❌
```

---

## Problemas de API

### ❌ Error: "PUBLIC_API_URL no está definida"

**Síntoma:**
```
❌ ERROR DE CONFIGURACIÓN: La variable de entorno PUBLIC_API_URL no está definida.
```

**Solución:**

```bash
# 1. Verificar que .env existe
ls -la .env

# 2. Verificar contenido
cat .env
# Debe contener:
# PUBLIC_API_URL="https://..."

# 3. Verificar nombre correcto (con prefijo PUBLIC_)
# ❌ API_URL="..."
# ✅ PUBLIC_API_URL="..."

# 4. Reiniciar servidor dev
npm run dev
```

---

### ❌ Error: CORS

**Síntoma:**
```
Access to fetch at 'https://api...' from origin 'http://localhost:4321'
has been blocked by CORS policy
```

**Causa:**
El backend no permite requests desde `http://localhost:4321`.

**Soluciones:**

#### Opción 1: Configurar CORS en el backend

```python
# Backend (FastAPI ejemplo)
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

#### Opción 2: Proxy en desarrollo (astro.config.mjs)

```javascript
export default defineConfig({
  vite: {
    server: {
      proxy: {
        '/api': {
          target: 'https://backend-api.com',
          changeOrigin: true,
        }
      }
    }
  }
});
```

---

### ❌ Error: Timeout

**Síntoma:**
```
TimeoutError: La petición a /api/puntos excedió el tiempo límite de 30000ms
```

**Causas:**
1. Backend lento o caído
2. Request muy pesado (muchos datos)
3. Problema de red

**Soluciones:**

```javascript
// 1. Aumentar timeout (temporal)
const apiService = new ApiService(apiUrl, 60000); // 60s

// 2. Reducir cantidad de datos solicitados
const puntos = await apiService.getPuntos({
  limit: 50  // En lugar de 1000
});

// 3. Agregar retry logic
async function fetchWithRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

const data = await fetchWithRetry(() => apiService.getPuntos(filters));
```

---

### ❌ Error 404: Endpoint no encontrado

**Síntoma:**
```
Error: HTTP error! status: 404
```

**Diagnóstico:**

```bash
# 1. Verificar URL completa en DevTools Network tab
# Debería ser: https://api.com/api/puntos

# 2. Verificar endpoint en apiEndpoints.js
cat src/constants/apiEndpoints.js

# 3. Probar endpoint directamente
curl https://api.com/api/puntos
```

**Soluciones:**

```javascript
// Verificar que el endpoint es correcto
export const API_ENDPOINTS = {
  PUNTOS: '/api/puntos',  // ✅ Correcto
  // PUNTOS: 'puntos',    // ❌ Falta /api/
};
```

---

## Problemas de Performance

### ❌ Mapa lento con muchos marcadores

**Síntoma:**
- El mapa se congela o va lento
- Especialmente con > 1000 puntos

**Soluciones:**

#### 1. Habilitar Clustering

```javascript
<MarkerLayer agrupar={true} puntos={puntos} />
```

#### 2. Limitar cantidad de puntos

```javascript
// En filtros
const MAX_PUNTOS = 500;

const puntosFiltrados = useMemo(() => {
  return puntos.slice(0, MAX_PUNTOS);
}, [puntos]);
```

#### 3. Virtualización (mostrar solo marcadores visibles)

```javascript
// Filtrar puntos por bounds del mapa
const [mapBounds, setMapBounds] = useState(null);

useMapEvents({
  moveend: (e) => {
    setMapBounds(e.target.getBounds());
  }
});

const puntosVisibles = puntos.filter(punto =>
  mapBounds?.contains([punto.lat, punto.lon])
);
```

---

### ❌ Re-renders lentos

**Síntoma:**
- UI se siente lenta al cambiar filtros
- Retrasos al escribir en inputs

**Soluciones:**

#### 1. Usar React.memo

```javascript
const SidebarFiltros = React.memo(({ filtros, onChange }) => {
  // ...
});
```

#### 2. Usar useMemo para cálculos costosos

```javascript
const puntosFiltrados = useMemo(() => {
  return puntos.filter(p => /* filtrado complejo */);
}, [puntos, filtros]);
```

#### 3. Usar useCallback para handlers

```javascript
const handleFiltroChange = useCallback((newValue) => {
  setFiltros(prev => ({ ...prev, ...newValue }));
}, []);
```

#### 4. Debouncing en inputs

```javascript
import { debounce } from 'lodash';

const debouncedFilter = useMemo(
  () => debounce((value) => setFilter(value), 300),
  []
);
```

---

### ❌ Bundle size muy grande

**Síntoma:**
```
dist/index.js  5.2 MB
```

**Diagnóstico:**

```bash
# Analizar bundle
npm install --save-dev rollup-plugin-visualizer
# Agrega plugin a astro.config.mjs
```

**Soluciones:**

```javascript
// 1. Lazy load componentes pesados
const SidebarCuenca = React.lazy(() =>
  import('./sidebars/SidebarCuenca')
);

<Suspense fallback={<Loading />}>
  <SidebarCuenca />
</Suspense>

// 2. Importar solo lo necesario de librerías
// ❌ import * as turf from '@turf/turf';
// ✅ import { point, distance } from '@turf/turf';

// 3. Optimizar imports de Material-UI
// ❌ import { Button } from '@mui/material';
// ✅ import Button from '@mui/material/Button';
```

---

## Problemas de Build

### ❌ Build falla con error de memoria

**Síntoma:**
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Solución:**

```bash
# Aumentar memoria de Node.js
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# En Windows PowerShell
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Permanente: agregar a package.json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' astro build"
  }
}
```

---

### ❌ Build falla por TypeScript errors

**Síntoma:**
```
error TS2304: Cannot find name 'L'.
```

**Solución:**

```bash
# 1. Instalar types de Leaflet
npm install --save-dev @types/leaflet

# 2. O deshabilitar strict checking en tsconfig.json
{
  "compilerOptions": {
    "checkJs": false
  }
}
```

---

## Problemas de Deployment

### ❌ Deploy falla en Azure

**Síntoma:**
```
Error: Build failed with exit code 1
```

**Diagnóstico:**

```bash
# 1. Revisar logs en GitHub Actions
# GitHub → Actions → Click en workflow fallido

# 2. Verificar que build funciona localmente
npm run build

# 3. Verificar versión de Node en workflow
# .github/workflows/azure-*.yml
```

**Solución:**

```yaml
# Asegurar que usa Node.js 18
- name: Setup Node
  uses: actions/setup-node@v3
  with:
    node-version: '18'
```

---

### ❌ Variables de entorno no disponibles en producción

**Síntoma:**
- App funciona en local
- En producción: "PUBLIC_API_URL no está definida"

**Solución:**

```bash
# En Azure Portal:
# 1. Ir a Static Web App → Configuration
# 2. Agregar variable:
#    Name: PUBLIC_API_URL
#    Value: https://...
# 3. Save

# Verificar que el nombre tiene prefijo PUBLIC_
```

---

## Problemas de Navegadores

### ❌ Funciona en Chrome pero no en Safari

**Síntomas comunes:**
- Fetch API con problemas
- CSS Grid bugs
- ES6 features no soportadas

**Soluciones:**

```javascript
// 1. Agregar polyfills si es necesario
// 2. Verificar compatibilidad en caniuse.com
// 3. Usar babel si necesitas transpilar para navegadores antiguos

// 4. Testing cross-browser
// Usa BrowserStack o similar
```

---

### ❌ Funciona en desktop pero no en móvil

**Causas comunes:**
1. Viewport no configurado
2. Touch events no manejados
3. Tamaño de pantalla no responsive

**Soluciones:**

```html
<!-- Verificar viewport en index.astro -->
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

```css
/* Hacer responsive con Tailwind */
<div className="w-full md:w-1/2 lg:w-1/3">
```

---

## Comandos Útiles de Debugging

```bash
# Limpiar todo y empezar de cero
rm -rf node_modules package-lock.json dist .astro
npm install
npm run dev

# Ver estructura del bundle
npm run build
du -sh dist/*

# Verificar dependencias instaladas
npm list --depth=0

# Verificar dependencias obsoletas
npm outdated

# Verificar vulnerabilidades
npm audit

# Fix vulnerabilidades automáticamente
npm audit fix

# Ver versiones de herramientas
node --version
npm --version
git --version
```

---

## Obtener Ayuda

Si ninguna solución funciona:

1. **Buscar en GitHub Issues**
   - Problemas de Astro: https://github.com/withastro/astro/issues
   - Problemas de Leaflet: https://github.com/Leaflet/Leaflet/issues

2. **Consultar Documentación Oficial**
   - Astro: https://docs.astro.build
   - React Leaflet: https://react-leaflet.js.org
   - Vite: https://vitejs.dev

3. **Pedir Ayuda**
   - Stack Overflow con tags: `astro`, `leaflet`, `react`
   - Discord de Astro
   - Equipo interno de desarrollo

4. **Crear Issue en el Repositorio**
   - Incluir pasos para reproducir
   - Incluir logs completos
   - Incluir versiones de software

---

**Última actualización:** Noviembre 2025
