import { useEffect, useState, useMemo,useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

import {TrophySpin, Slab} from 'react-loading-indicators';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

import 'leaflet-draw';

import Slider from "@mui/material/Slider";

export default function Mapa() {
  const [sidebarAbierto, setSidebarAbierto] = useState(true);
  const [rightSidebarAbierto, setRightSidebarAbierto] = useState(false);

  const [datosOriginales, setDatosOriginales] = useState([]);
  const [minMaxDatosOriginales, setMinMaxDatosOriginales] = useState([])
  const [isLoaded, setIsLoaded] = useState(false);

  const [filtroCaudal, setFiltroCaudal] = useState([0, 1000]); // [min, max]
  const [ordenCaudal, setOrdenCaudal] = useState('max'); // 'min' o 'max'

  const [filtros, setFiltros] = useState({
    region: '',
    cuenca: '',
    subcuenca: '',
    limit: 10
  });

  const [limiteSolicitado, setLimiteSolicitado] = useState();

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
      .then((data) => { 
        setDatosOriginales(data.cuencas);
      })
      .catch((err) => {
        console.error("Error al cargar cuencas:", err);
      });
  }, []);

  // Obtener los datos una sola vez
  useEffect(() => {
    fetch("http://localhost:8000/cuencas/stats")
      .then((res) => res.json())
      .then((data) => {
        setMinMaxDatosOriginales(data.estadisticas);
        setIsLoaded(true); 
      })
      .catch((err) => {
        console.error("Error al cargar las estadisticas de las cuencas:", err);
        setIsLoaded(false); 
      });
  }, []);

  useEffect(() => {
    if (isLoaded && caudalRange) {
      const nuevoMin = Math.floor(caudalRange.avgMin);
      const nuevoMax = Math.ceil(caudalRange.avgMax);
      setFiltroCaudal([nuevoMin, nuevoMax]);
    }
  }, [filtros.cuenca, filtros.subcuenca, isLoaded]);

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

    queryParams.append("caudal_minimo", filtroCaudal[0]);
    queryParams.append("caudal_maximo", filtroCaudal[1]);
    queryParams.append("orden_caudal", ordenCaudal);
    
    const url = `http://localhost:8000/coordenadas_unicas?${queryParams.toString()}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPuntos(data);
          setLimiteSolicitado(filtros.limit);
        } else {
          console.error("Respuesta inesperada:", data);
          setPuntos([]);
          setLimiteSolicitado();
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

  const caudalRange = useMemo(() => {
    if (!isLoaded || !minMaxDatosOriginales) return { min: 0, max: 1000 };

    const { caudal_global, caudal_por_cuenca, caudal_por_subcuenca } = minMaxDatosOriginales;

    // 🔹 1. Intentar buscar por subcuenca si existe
    if (filtros.subcuenca) {
      const resultSub = caudal_por_subcuenca.find(c =>
        (c.nom_subcuenca ?? 'No registrada') === filtros.subcuenca &&
        (!filtros.cuenca || c.nom_cuenca === filtros.cuenca)
      );
      if (resultSub) return resultSub;
    }

    // 🔹 2. Buscar por cuenca si está definida
    if (filtros.cuenca) {
      const resultCuenca = caudal_por_cuenca.find(c => c.nom_cuenca === filtros.cuenca);
      if (resultCuenca) return resultCuenca;
    }

    // 🔹 3. Si nada coincide, retornar global
    return caudal_global;
  }, [isLoaded, minMaxDatosOriginales, filtros]);


  const min = Math.floor(caudalRange?.avgMin ?? 0);
  const max = Math.ceil(caudalRange?.avgMax ?? 1000);

  const limitMax = useMemo(() => {
    if (!isLoaded || !minMaxDatosOriginales) return 100;

    const { caudal_global, caudal_por_cuenca, caudal_por_subcuenca } = minMaxDatosOriginales;

    // 🔹 Subcuenca seleccionada
    if (filtros.subcuenca) {
      // Caso especial: No registrada
      if (filtros.subcuenca === 'No registrada') {
        // Si NO hay cuenca seleccionada, sumar todos los 'No registrada'
        if (!filtros.cuenca) {
          const total = caudal_por_subcuenca
            .filter(s => (s.nom_subcuenca ?? 'No registrada') === 'No registrada')
            .reduce((acc, curr) => acc + (curr.total_puntos || 0), 0);
          return total || 100;
        }

        // Si hay cuenca, buscar específicamente esa subcuenca null
        const matchSub = caudal_por_subcuenca.find(s =>
          (s.nom_subcuenca ?? 'No registrada') === 'No registrada' &&
          s.nom_cuenca === filtros.cuenca
        );
        if (matchSub) return matchSub.total_puntos || 100;
      }

      // 🔹 Subcuenca normal (no null)
      const matchSub = caudal_por_subcuenca.find(s =>
        s.nom_subcuenca === filtros.subcuenca &&
        (!filtros.cuenca || s.nom_cuenca === filtros.cuenca)
      );
      if (matchSub) return matchSub.total_puntos || 100;
    }

    // 🔹 Cuenca seleccionada
    if (filtros.cuenca) {
      const matchCuenca = caudal_por_cuenca.find(
        c => c.nom_cuenca === filtros.cuenca
      );
      if (matchCuenca) return matchCuenca.total_puntos || 100;
    }

    // 🔹 Global por defecto
    return caudal_global.total_puntos_unicos || 100;
  }, [filtros, isLoaded, minMaxDatosOriginales]);

  const handleShowCoordGraphics = (utemNorte, utmEste) => {
    console.log('Coordenadas del Punto: ', utemNorte, '-', utmEste);
  }

  // Función para calcular distancia entre dos coordenadas
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // distancia en metros
  };

  // Función para filtrar puntos dentro del círculo
  const getPointsInCircle = (puntos, center, radius) => {
    const result = puntos.filter((p) => {
      const dist = getDistance(center.lat, center.lng, p.lat, p.lon);
      return dist <= radius;
    });

    console.log('Puntos dentro del círculo:', result);

    for (let index = 0; index < result.length; index++) {
      const punto = result[index];
      console.log(`Punto numero: ${index + 1} [${punto.utm_norte} - ${punto.utm_este}]`);
    }

  };

  return (
    <div className="relative">
      <MapContainer
        center={[-33.45, -70.66]}
        zoom={6}
        className="map-altura w-full"
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance;
          setMapReady(true);
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">Carto</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* CONTENEDOR PARA LAS CAPAS DIBUJADAS */}
        <FeatureGroup>
          <EditControl
            position="topright"
            draw={{
              rectangle: false,
              polyline: false,
              polygon: false,
              marker: false,
              circlemarker: false,
              circle: {
                shapeOptions: {
                  color: '#ff0000',
                },
              },
            }}
            edit={{
              edit: false,
              remove: true,
            }}
            onCreated={(e) => {
              if (e.layerType === 'circle') {
                const layer = e.layer;
                const center = layer.getLatLng();
                const radius = layer.getRadius(); 

                getPointsInCircle(puntos, center, radius);
              }
            }}

          />
        </FeatureGroup>

        {/* Tus puntos */}
        {puntos.map((punto, index) => (
          <Marker key={index} position={[punto.lat, punto.lon]}>
            <Popup>
              <div className="text-sm flex flex-col justify-between items-start">
                <p className='flex gap-2'>
                  <strong>Cuenca:</strong> {punto.nombre_cuenca}
                  <span
                    onClick={() => handleShowGraphics(punto.nombre_cuenca, punto.cod_cuenca)}
                    className='text-cyan-800 underline cursor-pointer cuenca-analizar'
                  >
                    (Ver Detalles)
                  </span>
                </p>
                <p><strong>Subcuenca:</strong> {punto.nombre_subcuenca}</p>
                <p><strong>Caudal promedio:</strong> {punto.caudal_promedio.toLocaleString()}</p>
                <p><strong>Nº de Mediciones:</strong> {punto.n_mediciones}</p>
                <button
                  className='bg-cyan-800 text-white p-2 cursor-pointer hover:bg-cyan-600'
                  onClick={() => handleShowCoordGraphics(punto.utm_norte, punto.utm_este)}
                >
                  Analizar Punto
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>


      {sidebarAbierto && (
        <div className="absolute left-0 z-[1000] top-0 w-90 bg-white h-full shadow-md py-6 px-10 space-y-4 text-sm">
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

          <label className="block font-medium mb-10">Cantidad de puntos limite:</label>
          <Slider
            name="limit"
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
            aria-label="Límite de resultados"
          />

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

          <div className="flex justify-between mt-4">
            <button
              onClick={handleCoordenadasUnicas}
              className="bg-green-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-green-800 hover:text-white"
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
          
          { puntos.length < limiteSolicitado ?
            <div className="bg-yellow-100 text-yellow-800 px-4 py-2 mt-3 rounded-md text-sm border border-yellow-300 shadow-sm">
              Se han encontrado solo <strong>{puntos.length}</strong> puntos que cumplen los filtros
            </div>
            :
            <></>
          }
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
              className="block mt-6 bg-cyan-700 text-white font-semibold px-4 py-2 rounded cursor-pointer hover:bg-cyan-600 transition"
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
