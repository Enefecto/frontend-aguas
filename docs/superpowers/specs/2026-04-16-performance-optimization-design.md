# Performance Optimization Design

**Date:** 2026-04-16  
**Context:** Map app renders 5000+ individual Leaflet markers (drop-pin divIcons). On low-end PCs: pan/zoom lag, click lag, general UI sluggishness.

## Root Causes

1. **5000+ DOM nodes** — each `<Marker>` is a real DOM element with inline SVG. Browser reflows/composites all on every pan/zoom.
2. **`createDropIcon` called per-point per-render** — 5000+ `L.divIcon()` calls + SVG string parsing every render, even though only 3 icon variants exist.
3. **`selectedPointsForComparison` new reference on every render** — breaks `React.memo(MapContainer)`, causing full marker tree reconciliation on every sidebar/analysis state update.
4. **Clustering off by default** — `agrupar` starts as `false`, exposing all DOM nodes immediately.

## Changes

### Change 1 — Default clustering ON
- File: `src/components/Mapa.jsx:101`
- Change: `useState(false)` → `useState(true)`
- Effect: Country-view shows clusters (~20 DOM nodes). User can toggle off via existing sidebar control.

### Change 2 — Icon caching
- File: `src/utils/mapUtils.js`
- Add module-level `Map` cache keyed by fill color.
- `createDropIcon` returns cached instance for standard markers (non-highlighted, no comparisonIndex).
- Highlighted and comparison markers (0–2 at a time) still create fresh instances.
- Effect: Eliminates 5000+ `L.divIcon()` + SVG parse calls per render.

### Change 3 — Viewport culling
- File: `src/components/map/MarkerLayer.jsx`
- Add `useBoundsFilter(puntos, agrupar)` hook inside the component:
  - Tracks `mapBounds` via `map.on('moveend', 'zoomend')`.
  - Expands bounds by 20% buffer using `bounds.pad(0.2)`.
  - Returns filtered subset of `puntos` within padded bounds.
  - When `agrupar=true`, returns all puntos unfiltered (MarkerClusterGroup handles it).
- `renderMarkers` useMemo uses filtered subset instead of full `puntos`.
- Effect: DOM node count = visible markers (~200–600 at city zoom) regardless of total dataset size.

### Change 4 — Stabilize `selectedPointsForComparison` reference
- File: `src/components/Mapa.jsx`
- Wrap `selectedPointsForComparison` in `useMemo` with `[selectedPointsForComparison[0], selectedPointsForComparison[1]]` as deps.
- Pass memoized value to `MapContainer`.
- Effect: `React.memo(MapContainer)` no longer breaks on sidebar/analysis state updates. MarkerLayer reconciliation only triggers when comparison points actually change.

## Out of Scope
- Context splitting (deferred — Changes 2–4 address the re-render cascade more directly)
- Canvas/WebGL rendering (deferred — viewport culling achieves similar perf without visual change)
- Debouncing sliders (separate concern, not the main bottleneck)

## Success Criteria
- Pan/zoom smooth at country zoom with clustering ON (default)
- Pan/zoom smooth at city zoom with clustering OFF and 5000+ total points
- Clicking a marker / opening sidebar does not cause visible lag
- Drop-pin icons visually unchanged
