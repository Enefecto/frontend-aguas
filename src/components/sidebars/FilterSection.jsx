import React, { useState, useEffect } from 'react';
import Slider from "@mui/material/Slider";
import TextField from '@mui/material/TextField';
import { SelectFilter } from '../UI/FilterGroup.jsx';
import { FILTER_CONFIG } from '../../constants/apiEndpoints.js';
import { validarFecha, validarRangoFechas, autoformatearFecha } from '../../utils/dateValidation.js';

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
    <label className="block font-medium mb-10">Caudal promedio extraido (L/s):</label>
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
      valueLabelFormat={(val) => `${val.toLocaleString('es-CL')} L/s`}
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
      { value: FILTER_CONFIG.PUNTO_TYPES.SUBTERRANEO, label: "Extracción subterránea" },
      { value: FILTER_CONFIG.PUNTO_TYPES.SIN_CLASIFICAR, label: "Sin clasificación" }
    ]}
    placeholder="-- Todos --"
  />
);

export const FechaFilter = ({ filtros, handleFiltroChange, erroresFecha, setErroresFecha }) => {
  const [touched, setTouched] = useState({
    fechaInicio: false,
    fechaFin: false
  });

  // Validar fechas cuando cambien
  useEffect(() => {
    const erroresInicio = validarFecha(filtros.fechaInicio);
    const erroresFin = validarFecha(filtros.fechaFin);
    const erroresRango = validarRangoFechas(filtros.fechaInicio, filtros.fechaFin);

    setErroresFecha({
      fechaInicio: touched.fechaInicio ? erroresInicio.mensaje : '',
      fechaFin: touched.fechaFin ? erroresFin.mensaje : '',
      rangoFechas: (touched.fechaInicio || touched.fechaFin) ? erroresRango.mensaje : ''
    });
  }, [filtros.fechaInicio, filtros.fechaFin, touched, setErroresFecha]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Autoformatear mientras escribe
    const valorFormateado = autoformatearFecha(value);

    // Crear evento sintético con el valor formateado
    const eventoFormateado = {
      target: {
        name,
        value: valorFormateado
      }
    };

    handleFiltroChange(eventoFormateado);
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const getInputClassName = (fieldName) => {
    const baseClass = "w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2";
    const hasError = erroresFecha[fieldName];

    if (hasError) {
      return `${baseClass} border-red-500 focus:ring-red-500`;
    }

    const isValid = filtros[fieldName] && !hasError && touched[fieldName];
    if (isValid) {
      return `${baseClass} border-green-500 focus:ring-green-500`;
    }

    return `${baseClass} border-gray-300 focus:ring-cyan-500`;
  };

  const getIcono = (fieldName) => {
    if (!touched[fieldName] || !filtros[fieldName]) return null;

    const hasError = erroresFecha[fieldName];

    if (hasError) {
      return (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    }

    return (
      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div className="mb-6 space-y-3">
      <label className="block font-medium mb-2">Periodo de mediciones:</label>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Fecha inicio (MM-AAAA):</label>
        <div className="relative">
          <input
            type="text"
            name="fechaInicio"
            value={filtros.fechaInicio || ''}
            onChange={handleInputChange}
            onBlur={() => handleBlur('fechaInicio')}
            placeholder="01-2020"
            className={getInputClassName('fechaInicio')}
            maxLength="7"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {getIcono('fechaInicio')}
          </div>
        </div>
        {erroresFecha.fechaInicio && (
          <p className="text-xs text-red-500 mt-1">{erroresFecha.fechaInicio}</p>
        )}
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Fecha fin (MM-AAAA):</label>
        <div className="relative">
          <input
            type="text"
            name="fechaFin"
            value={filtros.fechaFin || ''}
            onChange={handleInputChange}
            onBlur={() => handleBlur('fechaFin')}
            placeholder="12-2023"
            className={getInputClassName('fechaFin')}
            maxLength="7"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {getIcono('fechaFin')}
          </div>
        </div>
        {erroresFecha.fechaFin && (
          <p className="text-xs text-red-500 mt-1">{erroresFecha.fechaFin}</p>
        )}
      </div>

      {erroresFecha.rangoFechas && (
        <div className="bg-red-50 border border-red-200 rounded-md p-2">
          <p className="text-xs text-red-700">{erroresFecha.rangoFechas}</p>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-1">
        Deja vacío para incluir todas las fechas
      </p>
    </div>
  );
};