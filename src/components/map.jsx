import { useEffect, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function Mapa() {
  const [sidebarAbierto, setSidebarAbierto] = useState(true);

  const [datosOriginales, setDatosOriginales] = useState([]);
  const [filtros, setFiltros] = useState({
    region: '',
    cuenca: '',
    subcuenca: ''
  });

  const [puntos, setPuntos] = useState([])

  // Obtener los datos una sola vez
  useEffect(() => {
    fetch("http://localhost:8000/cuencas")
      .then((res) => res.json())
      .then((data) => setDatosOriginales(data));
  }, []);

  // Derivar opciones únicas en base al filtro activo
  const regionesUnicas = [...new Set(datosOriginales.map(d => d.cod_region))];

  const cuencasFiltradas = datosOriginales
    .filter(d => !filtros.region || d.cod_region.toString() === filtros.region)
    .map(d => d.nom_cuenca);

  const cuencasUnicas = [...new Set(cuencasFiltradas)];

  const subcuencasFiltradas = datosOriginales
    .filter(d =>
      (!filtros.region || d.cod_region.toString() === filtros.region) &&
      (!filtros.cuenca || d.nom_cuenca === filtros.cuenca)
    )
    .map(d => d.nom_subcuenca ?? 'No registrada');

  const subcuencasUnicas = [...new Set(subcuencasFiltradas)];

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;

    // Si cambia la región, reseteamos cuenca y subcuenca
    if (name === 'region') {
      setFiltros({ region: value, cuenca: '', subcuenca: '' });
    }
    // Si cambia la cuenca, reseteamos subcuenca
    else if (name === 'cuenca') {
      setFiltros(prev => ({ ...prev, cuenca: value, subcuenca: '' }));
    }
    else {
      setFiltros(prev => ({ ...prev, [name]: value }));
    }
  };

  // LLamada al endpoint de Coordenadas Unicas

  const handleCoordenadasUnicas = () => {
    const cuencaCod = datosOriginales.find(
      d => d.nom_cuenca === filtros.cuenca
    )?.cod_cuenca;

    let subcuencaCod;

    if (filtros.subcuenca === 'No registrada') {
      subcuencaCod = null; // explícitamente null
    } else {
      subcuencaCod = datosOriginales.find(
        d => d.nom_subcuenca === filtros.subcuenca
      )?.cod_subcuenca;
    }

    const queryParams = new URLSearchParams();

    if (filtros.region) queryParams.append("region", filtros.region);
    if (cuencaCod !== undefined) queryParams.append("cod_cuenca", cuencaCod);
    if (subcuencaCod !== undefined && subcuencaCod !== null) {
      queryParams.append("cod_subcuenca", subcuencaCod);
    }
    queryParams.append("limit", 10);

    const url = `http://localhost:8000/coordenadas_unicas?${queryParams.toString()}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setPuntos(data);
      })
      .catch((err) => console.error("Error al obtener coordenadas:", err));
  };

  return (
    <div className="relative">
      <MapContainer center={[-33.45, -70.66]} zoom={6} className="map-altura w-full">
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">Carto</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
      </MapContainer>

      {sidebarAbierto && (
        <div className="absolute left-0 z-[1000] top-0 w-80 bg-white h-full shadow-md p-6 space-y-4 text-sm">
          <h2 className="text-lg font-semibold mb-4">Filtros</h2>

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

          <div className="flex justify-between mt-4">
            <button
              onClick={handleCoordenadasUnicas}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Consultar puntos
            </button>
            
            <button
              onClick={() => setSidebarAbierto(false)}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {!sidebarAbierto && (
        <button
          onClick={() => setSidebarAbierto(true)}
          className="absolute top-3 left-12 bg-blue-600 text-white px-3 py-1 rounded z-[1000]"
        >
          ☰ Filtros
        </button>
      )}
    </div>
  );
}
