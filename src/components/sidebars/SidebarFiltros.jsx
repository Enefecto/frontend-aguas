import React from 'react';
import Slider from "@mui/material/Slider";
import TextField from '@mui/material/TextField';

export default function SidebarFiltros({
  filtros,
  setFiltros,
  regionesUnicas,
  cuencasUnicas,
  subcuencasUnicas,
  limitMax,
  min,
  max,
  filtroCaudal,
  setFiltroCaudal,
  ordenCaudal,
  setOrdenCaudal,
  handleCoordenadasUnicas,
  isLoaded,
  puntos,
  limiteSolicitado,
  setSidebarAbierto
}) {
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;

    if (name === 'region') {
      setFiltros({ region: value, cuenca: '', subcuenca: '', limit: filtros.limit });
    } else if (name === 'cuenca') {
      setFiltros(prev => ({ ...prev, cuenca: value, subcuenca: '' }));
    } else if (name === 'limit') {
      setFiltros(prev => ({ ...prev, limit: parseInt(value, 10) || 0 }));
    } else {
      setFiltros(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="absolute left-0 z-[1000] top-0 w-90 bg-white h-full shadow-md py-6 px-10 space-y-4 text-sm">
      <button
        onClick={() => setSidebarAbierto(false)}
        className="absolute -top-0 -right-5 text-white bg-gray-700 w-10 h-10 rounded hover:text-cyan-300 flex items-center justify-center text-4xl font-bold z-[1100] shadow-lg cursor-pointer"
        aria-label="Cerrar filtros"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-x">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M18 6l-12 12" />
          <path d="M6 6l12 12" />
        </svg>
      </button>

      <h2 className="text-lg font-bold mb-4">Filtros</h2>

      <label className="block font-medium">Región:</label>
      <select
        className="w-full p-2 border rounded"
        name="region"
        value={filtros.region}
        onChange={handleFiltroChange}
      >
        <option value="">-- Todas --</option>
        {regionesUnicas.map(region => (
          <option key={region} value={region}>{region}</option>
        ))}
      </select>

      <label className="block font-medium">Cuenca:</label>
      <select
        className="w-full p-2 border rounded"
        name="cuenca"
        value={filtros.cuenca}
        onChange={handleFiltroChange}
      >
        <option value="">-- Todas --</option>
        {cuencasUnicas.map((cuenca, i) => (
          <option key={i} value={cuenca}>{cuenca}</option>
        ))}
      </select>

      <label className="block font-medium">Subcuenca:</label>
      <select
        className="w-full p-2 border rounded"
        name="subcuenca"
        value={filtros.subcuenca}
        onChange={handleFiltroChange}
      >
        <option value="">-- Todas --</option>
        {subcuencasUnicas.map((subcuenca, i) => (
          <option key={i} value={subcuenca}>{subcuenca}</option>
        ))}
      </select>

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

      <label className="block font-medium">Ordenar por caudal:</label>
      <div className="flex justify-between gap-2">
        <button
          className={`flex-1 px-2 py-1 rounded ${ordenCaudal === 'min' ? 'bg-cyan-600 text-white cursor-pointer border border-black' : 'bg-gray-100 cursor-pointer'}`}
          onClick={() => setOrdenCaudal('min')}
        >
          Menor a mayor
        </button>
        <button
          className={`flex-1 px-2 py-1 rounded ${ordenCaudal === 'max' ? 'bg-cyan-600 text-white cursor-pointer border border-black' : 'bg-gray-100 cursor-pointer'}`}
          onClick={() => setOrdenCaudal('max')}
        >
          Mayor a menor
        </button>
      </div>

      <hr />

      <div className="flex justify-center mt-4">
        <button
          onClick={handleCoordenadasUnicas}
          className="bg-green-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-green-800 hover:text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
          disabled={!isLoaded}
        >
          Consultar puntos
        </button>
      </div>

      { puntos.length < limiteSolicitado &&
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 mt-3 rounded-md text-sm border border-yellow-300 shadow-sm">
          Se han encontrado solo <strong>{puntos.length}</strong> puntos que cumplen los filtros
        </div>
      }
    </div>
  );
}
