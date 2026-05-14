import Slider from "@mui/material/Slider";
import TextField from '@mui/material/TextField';
import { SelectFilter, FilterGroup } from '../UI/FilterGroup.jsx';

const EyeIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9M12,4.5C17,4.5 21.27,7.61 23,12C21.27,16.39 17,19.5 12,19.5C7,19.5 2.73,16.39 1,12C2.73,7.61 7,4.5 12,4.5M3.18,12C4.83,15.36 8.24,17.5 12,17.5C15.76,17.5 19.17,15.36 20.82,12C19.17,8.64 15.76,6.5 12,6.5C8.24,6.5 4.83,8.64 3.18,12Z"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.08L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.74,7.13 11.35,7 12,7Z"/>
  </svg>
);

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

export const LimitFilter = ({ filtros, setFiltros, limitMax }) => {
  const effectiveValue = Math.min(filtros.limit, limitMax);
  return (
    <div className="mb-6">
      <label className="block font-medium mb-10">Cantidad de puntos límite:</label>
      <div className="flex items-center gap-4">
        <Slider
          key={limitMax}
          min={1}
          max={limitMax}
          step={1}
          value={effectiveValue}
          onChange={(e, newValue) => {
            setFiltros(prev => ({ ...prev, limit: Number(newValue) }));
          }}
          valueLabelDisplay="on"
        />

        <TextField
          type="number"
          variant="outlined"
          size="small"
          value={effectiveValue}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (!isNaN(value)) {
              setFiltros(prev => ({
                ...prev,
                limit: Math.max(1, Math.min(limitMax, value))
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
};

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
    name="pozo"
    value={filtros.pozo ?? ""}
    onChange={handleFiltroChange}
    options={[
      { value: "true", label: "Extracción subterránea" },
      { value: "false", label: "Extracción superficial" }
    ]}
    placeholder="-- Todos --"
  />
);

export const ShacFilter = ({
  filtros,
  handleFiltroChange,
  shacsDisponibles = [],
  showShacLayer = false,
  onToggleShacLayer
}) => (
  <FilterGroup label="Sector SHAC:">
    <div className="flex items-center gap-2">
      <select
        className="flex-1 p-2 border rounded"
        name="shac"
        value={filtros.shac ?? ""}
        onChange={handleFiltroChange}
      >
        <option value="">-- Todos --</option>
        {shacsDisponibles.map((option, index) => (
          <option key={index} value={option.value ?? option}>
            {option.label ?? option}
          </option>
        ))}
      </select>
      {onToggleShacLayer && (
        <button
          type="button"
          onClick={onToggleShacLayer}
          aria-pressed={showShacLayer}
          aria-label={showShacLayer ? 'Ocultar capa SHAC en el mapa' : 'Mostrar capa SHAC en el mapa'}
          title={showShacLayer ? 'Ocultar capa SHAC en el mapa' : 'Mostrar capa SHAC en el mapa'}
          className={`p-2 rounded border transition-colors cursor-pointer flex items-center justify-center ${
            showShacLayer
              ? 'bg-cyan-600 border-cyan-700 text-white hover:bg-cyan-700'
              : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'
          }`}
        >
          {showShacLayer ? <EyeIcon /> : <EyeOffIcon />}
        </button>
      )}
    </div>
  </FilterGroup>
);

export const AprFilter = ({ filtros, handleFiltroChange }) => (
  <SelectFilter
    label="Agua Potable Rural:"
    name="apr"
    value={filtros.apr ?? ""}
    onChange={handleFiltroChange}
    options={[
      { value: "true", label: "Sí" },
      { value: "false", label: "No" }
    ]}
    placeholder="-- Todos --"
  />
);

export const JuntaFilter = ({ filtros, handleFiltroChange, juntasDisponibles = [] }) => (
  <SelectFilter
    label="Junta de Vigilancia:"
    name="id_junta"
    value={filtros.id_junta ?? ""}
    onChange={handleFiltroChange}
    options={juntasDisponibles}
    placeholder="-- Todas --"
  />
);

export const CodigoObraFilter = ({ filtros, setFiltros }) => (
  <div className="mb-4">
    <label className="block font-medium mb-1">Buscar código de obra:</label>
    <TextField
      fullWidth
      variant="outlined"
      size="small"
      placeholder="Ej: PB-1234"
      value={filtros.codigo_obra || ''}
      onChange={(e) => {
        setFiltros(prev => ({
          ...prev,
          codigo_obra: e.target.value
        }));
      }}
    />
  </div>
);