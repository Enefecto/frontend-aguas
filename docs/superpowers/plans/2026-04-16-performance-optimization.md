# Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate pan/zoom lag and click lag on low-end PCs when displaying 5000+ map markers.

**Architecture:** Five targeted fixes across four files — stable function refs stop the marker re-render cascade, icon caching cuts per-render cost, viewport culling limits DOM nodes when clustering is off, and default clustering-on prevents the worst case from being the default experience.

**Tech Stack:** React 18, react-leaflet, Leaflet, MarkerClusterGroup

---

## File Map

| File | Changes |
|------|---------|
| `src/components/Mapa.jsx` | Default `agrupar=true`, memoize `selectedPointsForComparison` |
| `src/utils/mapUtils.js` | Icon cache for 3 standard marker variants |
| `src/hooks/useSidebarState.js` | Wrap `openCuencaSidebar`, `openSubcuencaSidebar`, `openPuntoSidebar` in `useCallback` |
| `src/hooks/useAnalysisData.js` | Wrap `loadCuencaAnalysis`, `loadSubcuencaAnalysis`, `loadPuntoAnalysis` in `useCallback` |
| `src/components/map/MarkerLayer.jsx` | Viewport culling hook — filter `puntos` to map bounds when `agrupar=false` |

---

### Task 1: Default clustering ON

**Files:**
- Modify: `src/components/Mapa.jsx:101`

- [ ] **Step 1: Change default value**

In `src/components/Mapa.jsx`, line 101, change:
```js
const [agrupar, setAgrupar] = useState(false);
```
to:
```js
const [agrupar, setAgrupar] = useState(true);
```

- [ ] **Step 2: Verify in browser**

Open http://localhost:4321. Map should load with clustering ON (markers grouped). The sidebar toggle for "Agrupar" should be checked by default. Toggling it off should show individual markers.

- [ ] **Step 3: Commit**

```bash
git add src/components/Mapa.jsx
git commit -m "perf: enable marker clustering by default"
```

---

### Task 2: Icon caching

**Files:**
- Modify: `src/utils/mapUtils.js`

**Context:** `createDropIcon` is called once per point per render. With 5000+ points, this means 5000+ `L.divIcon()` calls and SVG string parses on every render. There are only 3 standard color variants (orange, blue, gray). Cache them as module-level singletons.

- [ ] **Step 1: Add icon cache**

In `src/utils/mapUtils.js`, replace the entire `createDropIcon` function with:

```js
const _iconCache = new Map();

export const createDropIcon = (fill = MAP_CONFIG.MARKER_COLORS.SURFACE_EXTRACTION, isHighlighted = false, comparisonIndex = null) => {
  const L = window.L;
  if (!L) return null;

  if (!isHighlighted && !comparisonIndex) {
    if (_iconCache.has(fill)) return _iconCache.get(fill);
  }

  const strokeColor = isHighlighted ? '#06b6d4' : 'white';
  const strokeWidth = isHighlighted ? '3' : '2';
  const className = isHighlighted ? 'highlighted-marker' : '';

  const badgeColors = {
    1: { bg: '#3B82F6', text: 'white' },
    2: { bg: '#F97316', text: 'white' }
  };

  const icon = L.divIcon({
    className: className,
    html: `
      <div style="position: relative; width: 28px; height: 36px;">
        <svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
          ${isHighlighted ? `
            <path d="M14 2 C14 2 4 15 4 21 a10 10 0 0 0 20 0 C24 15 14 2 14 2z"
                  fill="none" stroke="#06b6d4" stroke-width="6" opacity="0.4">
              <animate attributeName="stroke-width" values="6;10;6" dur="1.5s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.5s" repeatCount="indefinite"/>
            </path>
          ` : ''}
          <path d="M14 2 C14 2 4 15 4 21 a10 10 0 0 0 20 0 C24 15 14 2 14 2z"
                fill="${fill}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
          <ellipse cx="11" cy="18" rx="2.2" ry="3.6" fill="rgba(255,255,255,0.35)"/>
        </svg>
        ${comparisonIndex ? `
          <div style="
            position: absolute;
            top: -8px;
            right: -8px;
            width: 20px;
            height: 20px;
            background-color: ${badgeColors[comparisonIndex].bg};
            color: ${badgeColors[comparisonIndex].text};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 13px;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          ">
            ${comparisonIndex}
          </div>
        ` : ''}
      </div>
    `,
    iconSize: MAP_CONFIG.ICON_CONFIG.SIZE,
    iconAnchor: MAP_CONFIG.ICON_CONFIG.ANCHOR,
    popupAnchor: MAP_CONFIG.ICON_CONFIG.POPUP_ANCHOR,
  });

  if (!isHighlighted && !comparisonIndex) {
    _iconCache.set(fill, icon);
  }

  return icon;
};
```

- [ ] **Step 2: Verify in browser**

Toggle clustering off, load all points. Drop-pin icons should look identical to before. Open browser DevTools → Performance tab → record a map pan. Should see fewer `divIcon` calls in the flame graph.

- [ ] **Step 3: Commit**

```bash
git add src/utils/mapUtils.js
git commit -m "perf: cache standard drop-pin icons to avoid per-render divIcon creation"
```

---

### Task 3: Stable sidebar function refs

**Files:**
- Modify: `src/hooks/useSidebarState.js`

**Context:** `openCuencaSidebar`, `openSubcuencaSidebar`, `openPuntoSidebar` are plain inline functions — new reference every render. In `MapaContent`, `handleShowSidebarCuencas` uses `useCallback([openCuencaSidebar, loadCuencaAnalysis])`. Because `openCuencaSidebar` is always new, `handleShowSidebarCuencas` is always new → `React.memo(MapContainer)` and `React.memo(MarkerLayer)` fail every render → 5000+ markers reconciled on every state update anywhere in the app.

- [ ] **Step 1: Add `useCallback` import and wrap open functions**

Replace the entire content of `src/hooks/useSidebarState.js` with:

```js
import { useState, useCallback } from 'react';

export const useSidebarState = () => {
  const [sidebarAbierto, setSidebarAbierto] = useState(true);
  const [rightSidebarAbiertoCuencas, setRightSidebarAbiertoCuencas] = useState(false);
  const [rightSidebarAbiertoSubcuencas, setRightSidebarAbiertoSubcuencas] = useState(false);
  const [rightSidebarAbiertoPunto, setRightSidebarAbiertoPunto] = useState(false);

  const openCuencaSidebar = useCallback(() => {
    setRightSidebarAbiertoPunto(false);
    setRightSidebarAbiertoSubcuencas(false);
    setRightSidebarAbiertoCuencas(true);
  }, []);

  const openSubcuencaSidebar = useCallback(() => {
    setRightSidebarAbiertoPunto(false);
    setRightSidebarAbiertoCuencas(false);
    setRightSidebarAbiertoSubcuencas(true);
  }, []);

  const openPuntoSidebar = useCallback(() => {
    setRightSidebarAbiertoCuencas(false);
    setRightSidebarAbiertoSubcuencas(false);
    setRightSidebarAbiertoPunto(true);
  }, []);

  const closeRightSidebars = useCallback(() => {
    setRightSidebarAbiertoCuencas(false);
    setRightSidebarAbiertoSubcuencas(false);
    setRightSidebarAbiertoPunto(false);
  }, []);

  return {
    sidebarAbierto,
    setSidebarAbierto,
    rightSidebarAbiertoCuencas,
    setRightSidebarAbiertoCuencas,
    rightSidebarAbiertoSubcuencas,
    setRightSidebarAbiertoSubcuencas,
    rightSidebarAbiertoPunto,
    setRightSidebarAbiertoPunto,
    openCuencaSidebar,
    openSubcuencaSidebar,
    openPuntoSidebar,
    closeRightSidebars
  };
};
```

- [ ] **Step 2: Verify in browser**

Load points (clustering off). Open a point's sidebar by clicking a marker → "Ver análisis". Map should remain smooth — no visible freeze while sidebar opens.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useSidebarState.js
git commit -m "perf: stabilize sidebar open functions with useCallback to stop marker re-render cascade"
```

---

### Task 4: Stable analysis load function refs

**Files:**
- Modify: `src/hooks/useAnalysisData.js`

**Context:** `loadCuencaAnalysis`, `loadSubcuencaAnalysis`, `loadPuntoAnalysis` are plain async functions — new reference every render. They are deps of `handleShowSidebar*` callbacks in `MapaContent`, so even after Task 3 fixes `openCuencaSidebar`, these still break stability. Wrap the three load functions in `useCallback`. `loadCuencasGraphics` and `loadSubcuencasGraphics` depend on `cuencaAnalysis`/`subcuencaAnalysis` state (they read `.codigoCuenca` etc.) — these are NOT deps of `handleShow*` and are left as-is.

- [ ] **Step 1: Add `useCallback` import**

In `src/hooks/useAnalysisData.js`, change line 1:
```js
import { useState } from 'react';
```
to:
```js
import { useState, useCallback } from 'react';
```

- [ ] **Step 2: Wrap `loadCuencaAnalysis` in `useCallback`**

Find `const loadCuencaAnalysis = async (nomCuenca, codCuenca) => {` (line 188) and wrap it:

```js
const loadCuencaAnalysis = useCallback(async (nomCuenca, codCuenca) => {
    setCuencaAnalysis({ nombreCuenca: nomCuenca, codigoCuenca: codCuenca });
    setCuencaLoading(true);
    setGraphicsCuencasLoading({
      caudal: UI_CONFIG.LOADING_STATES.IDLE,
      altura_linimetrica: UI_CONFIG.LOADING_STATES.IDLE,
      nivel_freatico: UI_CONFIG.LOADING_STATES.IDLE
    });

    try {
      const response = await apiService.getCuencasStats({ cod_cuenca: codCuenca });
      const data = response.estadisticas?.[0];

      if (!data) {
        throw new Error('No se encontraron estadísticas para la cuenca');
      }

      setCuencaAnalysis(prev => ({
        ...prev,
        cuenca_identificador: codCuenca,
        total_registros_con_caudal: data.total_mediciones,
        caudal_promedio: data.caudal_promedio,
        caudal_minimo: data.caudal_minimo,
        caudal_maximo: data.caudal_maximo,
        desviacion_estandar_caudal: data.caudal_desviacion_estandar || 0,
        primera_fecha_medicion: null,
        ultima_fecha_medicion: null
      }));
      setCuencaLoading(false);
    } catch (err) {
      console.error("Error al obtener datos de análisis:", err);
      setCuencaLoading(false);
    }
  }, [apiService]);
```

- [ ] **Step 3: Wrap `loadSubcuencaAnalysis` in `useCallback`**

Find `const loadSubcuencaAnalysis = async (nomSubcuenca, codSubcuenca, codCuenca = null, nomCuenca = null) => {` (line 347) and wrap it:

```js
const loadSubcuencaAnalysis = useCallback(async (nomSubcuenca, codSubcuenca, codCuenca = null, nomCuenca = null) => {
    const esSinRegistro = codSubcuenca === 'sin_registro';
    const parametros = esSinRegistro
      ? { cod_cuenca: codCuenca, cod_subcuenca: null }
      : { cod_subcuenca: codSubcuenca };

    setSubcuencaAnalysis({
      nombreSubcuenca: nomSubcuenca,
      codigoSubcuenca: codSubcuenca,
      codigoCuenca: codCuenca,
      nombreCuenca: nomCuenca
    });
    setSubcuencaLoading(true);
    setGraphicsSubcuencasLoading({
      caudal: UI_CONFIG.LOADING_STATES.IDLE,
      altura_linimetrica: UI_CONFIG.LOADING_STATES.IDLE,
      nivel_freatico: UI_CONFIG.LOADING_STATES.IDLE
    });

    try {
      const response = await apiService.getCuencasStats(parametros);
      const data = response.estadisticas?.[0];

      if (!data) {
        throw new Error('No se encontraron estadísticas para la subcuenca');
      }

      setSubcuencaAnalysis(prev => ({
        ...prev,
        subcuenca_identificador: codSubcuenca,
        total_registros_con_caudal: data.total_mediciones,
        caudal_promedio: data.caudal_promedio,
        caudal_minimo: data.caudal_minimo,
        caudal_maximo: data.caudal_maximo,
        desviacion_estandar_caudal: data.caudal_desviacion_estandar || 0,
        primera_fecha_medicion: null,
        ultima_fecha_medicion: null
      }));
      setSubcuencaLoading(false);
    } catch (err) {
      console.error("Error al obtener datos de análisis de subcuenca:", err);
      setSubcuencaLoading(false);
    }
  }, [apiService]);
```

- [ ] **Step 4: Wrap `loadPuntoAnalysis` in `useCallback`**

Find `const loadPuntoAnalysis = async (punto) => {` (line 306) and wrap it:

```js
const loadPuntoAnalysis = useCallback(async (punto) => {
    setAnalisisPuntoSeleccionadoLoading(true);
    setGraphicsPuntosLoading(UI_CONFIG.LOADING_STATES.IDLE);

    try {
      const data = await apiService.getPuntosEstadisticas(punto.utm_norte, punto.utm_este);

      setAnalisisPuntoSeleccionado({
        analisis: data[0],
        punto: punto
      });
      setAnalisisPuntoSeleccionadoLoading(false);
    } catch (err) {
      console.error("Error al obtener análisis del punto:", err);
      setAnalisisPuntoSeleccionadoLoading(false);
    }
  }, [apiService]);
```

- [ ] **Step 5: Verify in browser**

Load points. Click a marker → open sidebar → close sidebar → open a different marker's sidebar. Should feel instant with no map freeze between interactions.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useAnalysisData.js
git commit -m "perf: stabilize analysis load functions with useCallback to fix handleShow* cascade"
```

---

### Task 5: Stabilize `selectedPointsForComparison` prop

**Files:**
- Modify: `src/components/Mapa.jsx`

**Context:** `selectedPointsForComparison` is a `useState` array. React guarantees state reference stability between renders, but `MapaContent` passes it directly as a JSX prop — any re-render of `MapaContent` (from context updates) passes the same reference, which is fine. However, `onPointClickForComparison` has `selectedPointsForComparison` as a dep and creates a new array via spread — once comparison points are set, this needs to be stable. Wrap `selectedPointsForComparison` in `useMemo` so the array reference passed to `MapContainer` only changes when comparison point contents change.

- [ ] **Step 1: Add `useMemo` to imports**

In `src/components/Mapa.jsx`, find the React import at line 1:
```js
import React, { useState, useEffect } from 'react';
```
Change to:
```js
import React, { useState, useEffect, useMemo } from 'react';
```

- [ ] **Step 2: Memoize the comparison points array**

After line 15 (`const [showDuplicateError, setShowDuplicateError] = useState(false);`), add:

```js
const stableSelectedPoints = useMemo(
  () => selectedPointsForComparison,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [selectedPointsForComparison[0], selectedPointsForComparison[1]]
);
```

- [ ] **Step 3: Use stable reference in JSX**

In the JSX, find the two places that pass `selectedPointsForComparison` as a prop and replace both with `stableSelectedPoints`:

Line ~183 in `MapContainer`:
```jsx
selectedPointsForComparison={stableSelectedPoints}
```

Line ~147 in `handlePointClickForComparison` — this callback uses `selectedPointsForComparison` from the closure. Update its `useCallback` dep array and body to use `stableSelectedPoints`:
```js
const handlePointClickForComparison = React.useCallback((punto) => {
  if (isSelectingPoint !== null) {
    const otherSlotIndex = isSelectingPoint === 0 ? 1 : 0;
    const otherPoint = stableSelectedPoints[otherSlotIndex];

    if (otherPoint &&
        otherPoint.lat === punto.lat &&
        otherPoint.lon === punto.lon) {
      setShowDuplicateError(true);
      setTimeout(() => setShowDuplicateError(false), 2000);
      return;
    }

    const newPoints = [...stableSelectedPoints];
    newPoints[isSelectingPoint] = punto;
    setSelectedPointsForComparison(newPoints);
    setIsSelectingPoint(null);
  }
}, [isSelectingPoint, stableSelectedPoints]);
```

Also update `ComparePointsModal` and `ComparePointsSelector` to use `stableSelectedPoints`:
```jsx
<ComparePointsSelector
  selectedPoints={stableSelectedPoints}
  ...
/>
<ComparePointsModal
  point1={stableSelectedPoints[0]}
  point2={stableSelectedPoints[1]}
  ...
/>
```

- [ ] **Step 4: Verify in browser**

Select two comparison points. Modal should open correctly. Closing and reopening modal should work. Map should not lag when comparison points are selected.

- [ ] **Step 5: Commit**

```bash
git add src/components/Mapa.jsx
git commit -m "perf: memoize selectedPointsForComparison to stabilize MapContainer memo boundary"
```

---

### Task 6: Viewport culling

**Files:**
- Modify: `src/components/map/MarkerLayer.jsx`

**Context:** When `agrupar=false`, all 5000+ `<Marker>` DOM elements exist simultaneously. Viewport culling filters `puntos` to those within current map bounds (+ 20% buffer) before building `renderMarkers`. DOM node count drops to ~200-600 at city zoom. When `agrupar=true`, culling is skipped — `MarkerClusterGroup` handles it. If user toggles off clustering at country zoom, all points render (their explicit choice).

- [ ] **Step 1: Add viewport culling hook**

In `src/components/map/MarkerLayer.jsx`, add the `useBoundsFilter` hook right after the imports, before `export const MarkerLayer`:

```js
const useBoundsFilter = (puntos, agrupar) => {
  const map = useMap();
  const [bounds, setBounds] = useState(() => map.getBounds().pad(0.2));

  useEffect(() => {
    const update = () => setBounds(map.getBounds().pad(0.2));
    map.on('moveend', update);
    map.on('zoomend', update);
    return () => {
      map.off('moveend', update);
      map.off('zoomend', update);
    };
  }, [map]);

  if (agrupar) return puntos;

  return puntos.filter(p =>
    Number.isFinite(p.lat) && Number.isFinite(p.lon) && bounds.contains([p.lat, p.lon])
  );
};
```

Also add `useState` to the imports at line 1 — change:
```js
import React, { useMemo, useCallback, useRef, useEffect } from 'react';
```
to:
```js
import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
```

- [ ] **Step 2: Use culled puntos in renderMarkers**

Inside `MarkerLayer` component body, after the `map` and `clusterGroupRef` declarations, add:

```js
const visiblePuntos = useBoundsFilter(puntos, agrupar);
```

Then find the `renderMarkers` useMemo and change `puntos` to `visiblePuntos`:

```js
const renderMarkers = useMemo(() => (
  visiblePuntos
    .filter(isValidCoordinate)
    .map((punto, index) => {
      const color = getMarkerColor(punto);
      const comparisonIndex = getComparisonIndex(punto);
      const isHighlighted = comparisonIndex !== null;
      const customIcon = createDropIcon(color, isHighlighted, comparisonIndex);

      if (!customIcon) return null;

      return (
        <Marker
          key={`${punto.utm_este}-${punto.utm_norte}-${index}`}
          position={[punto.lat, punto.lon]}
          icon={customIcon}
          eventHandlers={{
            click: () => handleMarkerClick(punto)
          }}
        >
          {!isSelectingPointForComparison && (
            <Popup>
              <PopupPunto
                punto={punto}
                handleShowSidebarCuencas={handleShowSidebarCuencas}
                handleShowSidebarSubcuencas={handleShowSidebarSubcuencas}
                handleShowSidebarPunto={handleShowSidebarPunto}
                apiService={apiService}
              />
            </Popup>
          )}
        </Marker>
      );
    })
    .filter(Boolean)
), [visiblePuntos, handleShowSidebarCuencas, handleShowSidebarSubcuencas, handleShowSidebarPunto, apiService, isSelectingPointForComparison, handleMarkerClick, getComparisonIndex]);
```

- [ ] **Step 3: Verify in browser**

Toggle clustering OFF. Load all points. Pan the map — markers at the edge of the viewport should smoothly appear as you pan into them (with a small buffer so they don't pop). Pan/zoom should be significantly smoother than before. Clicking a visible marker should open the popup correctly.

- [ ] **Step 4: Commit**

```bash
git add src/components/map/MarkerLayer.jsx
git commit -m "perf: add viewport culling to MarkerLayer to limit DOM nodes when clustering is off"
```

---

## Self-Review

**Spec coverage:**
- ✅ Change 1 (default agrupar=true): Task 1
- ✅ Change 2 (icon caching): Task 2
- ✅ Change 3 (viewport culling): Task 6
- ✅ Change 4 (stable selectedPointsForComparison): Task 5
- ✅ Bonus (stable sidebar + analysis function refs): Tasks 3 & 4 — discovered during implementation planning, root cause of click lag

**Placeholder scan:** No TBDs or incomplete steps. All code blocks are complete.

**Type consistency:** `visiblePuntos` used in Task 6 step 2 matches the variable introduced in step 1. `stableSelectedPoints` used in Task 5 step 3 matches step 2. `_iconCache` is module-scoped in Task 2, not imported anywhere.
