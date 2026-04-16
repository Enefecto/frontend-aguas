# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run preview` - Preview production build

No test runner or linter is configured.

## Environment

Create `.env` with:
```
PUBLIC_API_URL=http://localhost:8000
```

All API calls go through `src/services/apiService.js`. Endpoints are centralized in `src/constants/apiEndpoints.js`. The `PUBLIC_` prefix is required for Astro to expose the variable to client-side code.

## Architecture

**Entry point**: `src/pages/index.astro` renders `<Mapa client:only="react" apiUrl={...} />`. The `client:only="react"` directive is essential — Leaflet requires the DOM and cannot SSR.

**Component tree**:
```
Mapa.jsx
└── MapProvider (MapContext.jsx)         ← all state lives here
    ├── MapContainer.jsx                 ← Leaflet map, markers, draw tools
    └── SidebarManager.jsx               ← routes sidebar visibility to correct sidebar
        ├── SidebarFiltros.jsx           ← filter controls
        ├── SidebarCuenca.jsx            ← cuenca/subcuenca/SHAC analysis + charts
        └── SidebarPunto.jsx             ← individual point analysis + time series
```

**State management**: `MapContext.jsx` composes four hooks and spreads them into context:
- `useMapData` — fetches initial cuencas + filtros reactivos + SHACs/Juntas on mount
- `useFilterLogic` — manages `filtros` state, derives select options, builds query params, fetches puntos
- `useSidebarState` — tracks which sidebar is open and what cuenca/punto is selected
- `useAnalysisData` — lazy-fetches time series and analysis data when a cuenca/punto is clicked

All components consume context via `useMapContext()`. Never pass props through multiple layers — add to context instead.

## Key Data Flow

**Filter → API translation** (`src/utils/filterUtils.js:buildQueryParams`):
- Filter state uses display names (`filtros.cuenca = "Maipo"`)
- `buildQueryParams` looks up `cod_cuenca` from `datosOriginales` before sending to API
- `filtros.subcuenca = 'No registrada'` sends `filtro_null_subcuenca=true` instead of a code
- All filter values are sanitized via `src/utils/sanitize.js` before appending to URLSearchParams

**`datosOriginales`** holds the full cuencas array from `/api/cuencas`. It serves dual purpose: Leaflet polygon rendering and as a lookup table for deriving filter codes.

**Cascading filter options** are computed via `useMemo` in `useFilterLogic` using `getFilteredOptions()`. Region selection clears cuenca; cuenca selection clears subcuenca.

## Leaflet Loading

`Mapa.jsx` manually sets `window.L` before importing `leaflet-draw`:
```js
const L = await import('leaflet');
window.L = L.default;
await import('leaflet-draw');
```
This ordering is required — `leaflet-draw` expects `window.L` to exist. Do not move or parallelize these imports.

## Points (Puntos)

Points are identified by `(utm_norte, utm_este)` coordinate pairs — there is no unique ID field. All point-specific API calls (`getPuntosEstadisticas`, `getPuntosSeriesTiempo*`) take these two values. The popup and sidebar both receive the point object from the marker click.

## Marker Colors

Defined in `src/constants/mapConfig.js`:
- Surface extraction (altura limnimétrica): `#FF5722` orange
- Underground extraction (nivel freático): `#2E7BCC` blue  
- Unclassified: `#9CA3AF` gray

## UI Components Note

There are two UI component directories: `src/components/UI/` (legacy, capitalized) and `src/components/ui/` (newer, lowercase). Prefer the lowercase `ui/` directory for new reusable components.
