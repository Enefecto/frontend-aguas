import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {TrophySpin, Slab} from 'react-loading-indicators';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';


export default function Mapa() {
  const [sidebarAbierto, setSidebarAbierto] = useState(true);
  const [rightSidebarAbierto, setRightSidebarAbierto] = useState(false);

  const [datosOriginales, setDatosOriginales] = useState([]);
  const [filtros, setFiltros] = useState({
    region: '',
    cuenca: '',
    subcuenca: '',
    limit: 10
  });

  const [puntos, setPuntos] = useState([])

  const [cuencaAnalysis, setCuencaAnalysis] = useState({
    nombreCuenca: '',
    codigoCuenca: '',
    cuenca_identificador: 0,
    total_registros_con_caudal: 0,
    caudal_promedio: 0,
    caudal_minimo: 0,
    caudal_maximo: 0,
    desviacion_estandar_caudal:0
  });

  const [cuencaLoading, setCuencaLoading] = useState(false);
  const [graphicsLoading, setGraphicsLoading] = useState(0);
  const [graficosData, setGraficosData] = useState({
    grafico_cantidad_registros_por_informante: [],
    grafico_caudal_total_por_informante: [],
    grafico_cantidad_obras_unicas_por_informante: []
  });


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
    if (filtros.subcuenca === 'No registrada') {
      // No se agrega el parámetro, el backend asumirá que debe filtrar por null
      queryParams.append("filtro_null_subcuenca", "1");
    } else if (subcuencaCod !== undefined) {
      queryParams.append("cod_subcuenca", subcuencaCod);
    }
    queryParams.append("limit", filtros.limit || 10);

    const url = `http://localhost:8000/coordenadas_unicas?${queryParams.toString()}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPuntos(data);
        } else {
          console.error("Respuesta inesperada:", data);
          setPuntos([]);
        }
      })
      .catch((err) => console.error("Error al obtener coordenadas:", err));

  };

  const handleShowGraphics = (nomCuenca, codCuenca) => {
    setSidebarAbierto(false);
    setRightSidebarAbierto(true);
    setGraphicsLoading(0)
    setCuencaAnalysis({nombreCuenca: nomCuenca, codigoCuenca:codCuenca});


    const url = `http://localhost:8000/analisis_cuenca?cuenca_identificador=${codCuenca}`;

    setCuencaLoading(true)

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setCuencaAnalysis(prev => ({
          ...prev,
          cuenca_identificador: data.cuenca_identificador,
          total_registros_con_caudal: data.total_registros_con_caudal,
          caudal_promedio: data.caudal_promedio,
          caudal_minimo: data.caudal_minimo,
          caudal_maximo: data.caudal_maximo,
          desviacion_estandar_caudal:data.desviacion_estandar_caudal
        }));
        setCuencaLoading(false);
      })
      .catch((err) => console.error("Error al obtener datos de analisis:", err));
  }

  const loadGraphics = () => {
    setGraphicsLoading(1);

    const url = `http://localhost:8000/informantes_por_cuenca?cuenca_identificador=${cuencaAnalysis.codigoCuenca}`

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setGraficosData({
          grafico_cantidad_registros_por_informante: data.grafico_cantidad_registros_por_informante || [],
          grafico_caudal_total_por_informante: data.grafico_caudal_total_por_informante || [],
          grafico_cantidad_obras_unicas_por_informante: data.grafico_cantidad_obras_unicas_por_informante || []
        });
        setGraphicsLoading(2);
      })
      .catch((err) => {
        console.error("Error al obtener gráficos:", err);
        setGraphicsLoading(0);
      });
  };



  return (
    <div className="relative">
      <MapContainer center={[-33.45, -70.66]} zoom={6} className="map-altura w-full">
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">Carto</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {puntos.map((punto, index) => (
          <Marker key={index} position={[punto.lat, punto.lon]}>
            <Popup>
              <div className="text-sm flex flex-col justify-between items-start">
                <p><strong>Cuenca:</strong> {punto.nombre_cuenca}</p>
                <p><strong>Subcuenca:</strong> {punto.nombre_subcuenca}</p>
                <button className='bg-cyan-800 text-white p-2 cursor-pointer hover:bg-cyan-600'
                  onClick={() => handleShowGraphics(punto.nombre_cuenca, punto.cod_cuenca)}
                >Analizar Cuenca</button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {sidebarAbierto && (
        <div className="absolute left-0 z-[1000] top-0 w-80 bg-white h-full shadow-md p-6 space-y-4 text-sm">
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

          <label className="block font-medium">Cantidad de puntos (limit):</label>
          <input
            type="number"
            name="limit"
            value={filtros.limit}
            onChange={handleFiltroChange}
            className="w-full p-2 border rounded"
          />


          <div className="flex justify-between mt-4">
            <button
              onClick={handleCoordenadasUnicas}
              className="bg-blue-700 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-500"
            >
              Consultar puntos
            </button>
            
            <button
              onClick={() => setSidebarAbierto(false)}
              className="bg-red-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-red-500"
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

      {rightSidebarAbierto && (
        <div
          className="absolute right-0 top-0 z-[1000] h-full bg-white shadow-md text-sm overflow-y-auto resize-x overflow-x-hidden min-w-[20rem] max-w-[90vw] p-8 space-y-6"
          style={{ width: '45rem' }}
        >
          <h2 className="text-2xl font-bold border-b pb-2">Análisis de Cuenca</h2>

          <h3 className="text-lg font-semibold">
            Cuenca: <span className="text-cyan-800 font-bold">{cuencaAnalysis.nombreCuenca}</span>
          </h3>

          {!cuencaLoading ? (
            <div className="space-y-4 pt-2">
              <h3 className="text-base font-semibold text-gray-700">Análisis Estadístico</h3>

              <div className="grid grid-cols-1 gap-4">
                <div className="bg-blue-50 p-4 rounded shadow-sm">
                  <p className="text-gray-500 text-xs">Total de registros con caudal</p>
                  <p className="text-blue-800 font-extrabold text-xl">{Number(cuencaAnalysis.total_registros_con_caudal.toFixed(2)).toLocaleString()}</p>
                </div>

                <div className="bg-green-50 p-4 rounded shadow-sm">
                  <p className="text-gray-500 text-xs">Caudal promedio (m³/s)</p>
                  <p className="text-green-800 font-extrabold text-xl">{Number(cuencaAnalysis.caudal_promedio.toFixed(2)).toLocaleString()}</p>
                </div>

                <div className="bg-yellow-50 p-4 rounded shadow-sm">
                  <p className="text-gray-500 text-xs">Caudal mínimo (m³/s)</p>
                  <p className="text-yellow-800 font-extrabold text-xl">{Number(cuencaAnalysis.caudal_minimo.toFixed(2)).toLocaleString()}</p>
                </div>

                <div className="bg-red-50 p-4 rounded shadow-sm">
                  <p className="text-gray-500 text-xs">Caudal máximo (m³/s)</p>
                  <p className="text-red-800 font-extrabold text-xl">{Number(cuencaAnalysis.caudal_maximo.toFixed(2)).toLocaleString()}</p>
                </div>

                <div className="bg-purple-50 p-4 rounded shadow-sm">
                  <p className="text-gray-500 text-xs">Desviación estándar del caudal</p>
                  <p className="text-purple-800 font-extrabold text-xl">{Number(cuencaAnalysis.desviacion_estandar_caudal.toFixed(2)).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 mt-16 mx-auto flex justify-center">
              <TrophySpin color="#155e75" size="large" text="Cargando..." textColor="#000000" />
            </div>
          )}

          {graphicsLoading === 0 && (
            <button
              onClick={loadGraphics}
              className="block mt-6 bg-cyan-700 text-white font-semibold px-4 py-2 rounded hover:bg-cyan-600 transition"
            >
              Cargar Gráficos
            </button>
          )}

          {graphicsLoading === 1 && (
            <div className="space-y-2 mt-16 mx-auto flex justify-center">
              <Slab color="#155e75" size="large" text="Cargando..." textColor="#000000" />
            </div>
          )}

          {graphicsLoading === 2 && (
            <div className="space-y-10 mt-6 border-t pt-6">
              <h3 className="text-lg font-semibold">Gráficos</h3>

              {/* Gráfico 1 */}
              <div className="w-full h-96">
                <h4 className="text-sm font-semibold mb-1 text-gray-700">Registros por Informante</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={graficosData.grafico_cantidad_registros_por_informante.slice(0, 20)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="informante" angle={-45} textAnchor="end" interval={0} height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="cantidad_registros" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfico 2 */}
              <div className="w-full h-96">
                <h4 className="text-sm font-semibold mb-1 text-gray-700">Caudal Total Extraído</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={graficosData.grafico_caudal_total_por_informante.slice(0, 20)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="informante" angle={-45} textAnchor="end" interval={0} height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="caudal_total_extraido" fill="#0ea5e9" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfico 3 */}
              <div className="w-full h-96">
                <h4 className="text-sm font-semibold mb-1 text-gray-700">Obras Únicas por Informante</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={graficosData.grafico_cantidad_obras_unicas_por_informante.slice(0, 20)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="informante" angle={-45} textAnchor="end" interval={0} height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="cantidad_obras_unicas" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <button
            onClick={() => setRightSidebarAbierto(false)}
            className="mt-10 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500 transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}


    </div>
  );
}
