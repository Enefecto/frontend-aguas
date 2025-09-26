import React from 'react';
import Slider from "@mui/material/Slider";
import TextField from '@mui/material/TextField';
import { SelectFilter } from '../UI/FilterGroup.jsx';
import { FILTER_CONFIG } from '../../constants/apiEndpoints.js';

export const RegionFilter = ({ filtros, handleFiltroChange, regionesUnicas }) => (
  <SelectFilter
    label="Región:"
    name="region"
    value={filtros.region}
    onChange={handleFiltroChange}
    options={regionesUnicas}
  />
);

export const CuencaFilter = ({ filtros, handleFiltroChange, cuencasUnicas }) => (
  <SelectFilter
    label="Cuenca:"
    name="cuenca"
    value={filtros.cuenca}
    onChange={handleFiltroChange}
    options={cuencasUnicas}
  />
);

export const SubcuencaFilter = ({ filtros, handleFiltroChange, subcuencasUnicas }) => (
  <SelectFilter
    label="Subcuenca:"
    name="subcuenca"
    value={filtros.subcuenca}
    onChange={handleFiltroChange}
    options={subcuencasUnicas}
  />
);

export const LimitFilter = ({ filtros, setFiltros, limitMax }) => (
  <div className="mb-6">
    <label className="block font-medium mb-10">Cantidad de puntos límite:</label>
    <div className="flex items-center gap-4">
      <Slider
        min={1}
        max={limitMax}
        step={1}
        value={filtros.limit > limitMax ? limitMax : filtros.limit}
        onChange={(e, newValue) => {
          setFiltros(prev => ({
            ...prev,
            limit: Number(newValue)
          }));
        }}
        valueLabelDisplay="on"
      />

      <TextField
        type="number"
        variant="outlined"
        size="small"
        value={filtros.limit}
        onChange={(e) => {
          const value = Number(e.target.value);
          if (!isNaN(value)) {
            const clamped = Math.max(1, Math.min(limitMax, value));
            setFiltros(prev => ({
              ...prev,
              limit: clamped
            }));
          }
        }}
        inputProps={{
          min: 1,
          max: limitMax,
          style: { width: 90, textAlign: 'center' }
        }}
      />
    </div>
  </div>
);

export const CaudalFilter = ({ filtroCaudal, setFiltroCaudal, min, max }) => (
  <div className="mb-6">
    <label className="block font-medium mb-10">Caudal promedio extraido (m³/s):</label>
    <Slider
      min={min}
      max={max}
      step={1}
      value={filtroCaudal}
      onChange={(e, newValue) => {
        if (Array.isArray(newValue)) {
          setFiltroCaudal([Number(newValue[0]), Number(newValue[1])]);
        }
      }}
      valueLabelDisplay="on"
      valueLabelFormat={(val) => `${val.toLocaleString('es-CL')} m³/s`}
    />
  </div>
);

export const OrdenCaudalFilter = ({ ordenCaudal, setOrdenCaudal }) => (
  <div className="mb-4">
    <label className="block font-medium">Ordenar por caudal:</label>
    <div className="flex justify-between gap-2">
      <button
        className={`flex-1 px-2 py-1 rounded ${
          ordenCaudal === 'min'
            ? 'bg-cyan-600 text-white cursor-pointer border border-black'
            : 'bg-gray-100 cursor-pointer'
        }`}
        onClick={() => setOrdenCaudal('min')}
      >
        Menor a mayor
      </button>
      <button
        className={`flex-1 px-2 py-1 rounded ${
          ordenCaudal === 'max'
            ? 'bg-cyan-600 text-white cursor-pointer border border-black'
            : 'bg-gray-100 cursor-pointer'
        }`}
        onClick={() => setOrdenCaudal('max')}
      >
        Mayor a menor
      </button>
    </div>
  </div>
);

export const TipoPuntoFilter = ({ filtros, handleFiltroChange }) => (
  <SelectFilter
    label="Tipo de punto:"
    name="tipoPunto"
    value={filtros.tipoPunto || ""}
    onChange={handleFiltroChange}
    options={[
      { value: FILTER_CONFIG.PUNTO_TYPES.SUPERFICIAL, label: "Extracción superficial" },
      { value: FILTER_CONFIG.PUNTO_TYPES.POZO, label: "Pozo" }
    ]}
    placeholder="-- Todos --"
  />
);