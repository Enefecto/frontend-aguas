import Slider from "@mui/material/Slider";
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import { styled } from '@mui/material/styles';

import { ButtonOpenCloseSidebar } from '../Buttons/ButtonOpenCloseSidebar';
import { useEffect, useState } from "react";

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
  setSidebarAbierto,
  agrupar,
  setAgrupar
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

  const [consultandoPuntos, setConsultandoPuntos] = useState(0); 
  const [isOpen, setIsOpen] = useState(false); 

  useEffect(() => {
    setTimeout(() => {
      setIsOpen(true);
    }, 100);
  },[])

  useEffect(() => {
    if (puntos.length !== 0) {
      setConsultandoPuntos(2);
    }
  }, [puntos])

  useEffect(() => {
    if (isLoaded){
      handleCoordenadasUnicas();
    }
  },[isLoaded])

  useEffect(() => {
    setConsultandoPuntos(0);
  }, [filtros.region, filtros.cuenca, filtros.subcuenca, filtros.limit, filtroCaudal, ordenCaudal]);

  useEffect(() => {
    if (consultandoPuntos === 2) {
      const t = setTimeout(() => setConsultandoPuntos(0), 2000);
      return () => clearTimeout(t);
    }
  }, [consultandoPuntos]);

  const handleUpdateStateConsultandoPuntos = () => {
    setConsultandoPuntos(1);
  }

  const AgruparSwitch = styled((props) => (
    <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
  ))(({ theme }) => ({
    width: 46,
    height: 28,
    padding: 0,
    display: 'inline-flex',
    alignItems: 'center',
    '& .MuiSwitch-switchBase': {
      padding: 2,
      transition: theme.transitions.create(['transform'], {
        duration: 260,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)', // easeOutExpo-like
      }),
      '&.Mui-checked': {
        transform: 'translateX(18px)',
        color: '#fff',
        '& + .MuiSwitch-track': {
          backgroundColor: '#0891b2', // cyan-700
          opacity: 1,
          border: 0,
        },
        '& .MuiSwitch-thumb': {
          transform: 'scale(1.02)',
          boxShadow: '0 2px 6px rgba(2,132,199,.45)',
        },
      },
    },
    '& .MuiSwitch-thumb': {
      boxSizing: 'border-box',
      width: 24,
      height: 24,
      transition: theme.transitions.create(['transform', 'box-shadow'], {
        duration: 260,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      }),
    },
    '& .MuiSwitch-track': {
      borderRadius: 28 / 2,
      backgroundColor: '#cbd5e1', // slate-300
      opacity: 1,
      transition: theme.transitions.create(['background-color', 'opacity'], {
        duration: 260,
        easing: theme.transitions.easing.easeInOut,
      }),
    },

    // opcional: feedback al click
    '& .MuiSwitch-switchBase:active .MuiSwitch-thumb': {
      transform: 'scale(0.96)',
    },

    // respeta preferencias de accesibilidad
    '@media (prefers-reduced-motion: reduce)': {
      '& .MuiSwitch-switchBase': { transition: 'none' },
      '& .MuiSwitch-thumb': { transition: 'none' },
      '& .MuiSwitch-track': { transition: 'none' },
    },
  }));



  return (
    <div
      className={`absolute left-0 top-0 z-[1000] bg-white shadow-md py-8 px-16 sm:px-0 sm:pr-16 sm:pl-10 space-y-4 text-sm h-full
        w-full sm:w-100 max-h-screen overflow-y-auto transform transition-transform duration-500 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      <ButtonOpenCloseSidebar toggleSidebar={setSidebarAbierto} isFiltrosSidebar={true} setIsOpen={setIsOpen} />

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
      
      <div className="mt-2 border-t pt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Agrupar puntos</span>
          <AgruparSwitch
            checked={agrupar}
            onChange={(e) => setAgrupar(e.target.checked)}
            inputProps={{ 'aria-label': 'Agrupar puntos' }}
          />
        </div>

        {/* microcopia debajo, sin desplazamientos raros */}
        <p className="text-xs text-slate-500 mt-1">
          Combina marcadores cercanos para mejorar el rendimiento visual.
        </p>
      </div>

      <hr />

      <div className="flex justify-center mt-4">
        <button
          onClick={() =>  {handleCoordenadasUnicas(); handleUpdateStateConsultandoPuntos();}}
          className="bg-green-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-green-800 hover:text-white disabled:bg-gray-300 disabled:cursor-not-allowed
          flex items-center gap-2"
          disabled={!isLoaded || consultandoPuntos === 1}
        >
          Consultar puntos
          {consultandoPuntos === 1 ? (
            // Spinner (cargando)
            <svg className="animate-spin w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24 ">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : consultandoPuntos === 2 ? (
            // Check (terminado)
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="#00838F" >
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.364 7.364a1 1 0 01-1.414 0L3.293 9.414a1 1 0 011.414-1.414L8 11.293l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            // Estado inicial: gota con color suave que combina con el verde del botón
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#00838F" >
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M10.708 2.372a2.382 2.382 0 0 0 -.71 .686l-4.892 7.26c-1.981 3.314 -1.22 7.466 1.767 9.882c2.969 2.402 7.286 2.402 10.254 0c2.987 -2.416 3.748 -6.569 1.795 -9.836l-4.919 -7.306c-.722 -1.075 -2.192 -1.376 -3.295 -.686z"/>
            </svg>
          )}
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
