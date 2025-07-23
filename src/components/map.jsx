import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

import {TrophySpin, Slab} from 'react-loading-indicators';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line 
} from 'recharts';


import 'leaflet-draw';

import Slider from "@mui/material/Slider";

export default function Mapa() {
  const [sidebarAbierto, setSidebarAbierto] = useState(true);
  const [rightSidebarAbiertoCuencas, setRightSidebarAbiertoCuencas] = useState(false);
  const [rightSidebarAbiertoPunto, setRightSidebarAbiertoPunto] = useState(false);

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
  const [graphicsCuencasLoading, setGraphicsCuencasLoading] = useState(0);
  const [graphicsPuntosLoading, setGraphicsPuntosLoading] = useState(0);
  const [graficosData, setGraficosData] = useState({
    grafico_cantidad_registros_por_informante: [],
    grafico_caudal_total_por_informante: [],
    grafico_cantidad_obras_unicas_por_informante: []
  });

  const [graficosPuntosData, setGraficosPuntosData] = useState([]);

  const [analisisPuntoSeleccionado, setAnalisisPuntoSeleccionado] = useState({});
  const [analisisPuntoSeleccionadoLoading, setAnalisisPuntoSeleccionadoLoading] = useState({});

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
    
    const url = `http://localhost:8000/puntos?${queryParams.toString()}`;

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
    setRightSidebarAbiertoPunto(false);
    setRightSidebarAbiertoCuencas(true);
    setGraphicsCuencasLoading(0);
    setCuencaAnalysis({nombreCuenca: nomCuenca, codigoCuenca:codCuenca});


    const url = `http://localhost:8000/cuencas/analisis_caudal?cuenca_identificador=${codCuenca}`;

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

  const loadCuencasGraphics = () => {
    setGraphicsCuencasLoading(1);

    const url = `http://localhost:8000/cuencas/analisis_informantes?cuenca_identificador=${cuencaAnalysis.codigoCuenca}`

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setGraficosData({
          grafico_cantidad_registros_por_informante: data.grafico_cantidad_registros_por_informante || [],
          grafico_caudal_total_por_informante: data.grafico_caudal_total_por_informante || [],
          grafico_cantidad_obras_unicas_por_informante: data.grafico_cantidad_obras_unicas_por_informante || []
        });
        setGraphicsCuencasLoading(2);
      })
      .catch((err) => {
        console.error("Error al obtener gráficos:", err);
        setGraphicsCuencasLoading(0);
      });
  };
  
  const loadPuntosGraphics = (utmNorte, utmEste) => {
    setGraphicsPuntosLoading(1);

    const url = `http://localhost:8000/puntos/series_de_tiempo/caudal?utm_norte=${utmNorte}&utm_este=${utmEste}`

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setGraficosPuntosData(data);
        setGraphicsPuntosLoading(2);
      })
      .catch((err) => {
        console.error("Error al obtener gráficos del punto:", err);
        setGraphicsPuntosLoading(0);
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

  const handleShowCoordGraphics = (utmNorte, utmEste) => {
    console.log('Coordenadas del Punto: ', utmNorte, '-', utmEste);
    setRightSidebarAbiertoCuencas(false);
    setRightSidebarAbiertoPunto(true);
    setAnalisisPuntoSeleccionadoLoading(true);
    setGraphicsPuntosLoading(0);

    const url = 'http://localhost:8000/puntos/estadisticas';

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify([
        {
          utm_norte: utmNorte,
          utm_este: utmEste
        }
      ])
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('LO QUE LLEGOOO',data);
        setAnalisisPuntoSeleccionado(data[0]); // accede directamente al primer objeto
        setAnalisisPuntoSeleccionadoLoading(false);
      })
      .catch((err) => {
        setRightSidebarAbiertoPunto(false);
        console.error("Error al obtener analisis del punto:", err);
      });
  };


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
  const getPointsInCircle = async (puntos, center, radius, layer) => {
    const puntosFiltrados = puntos.filter((p) => {
      const dist = getDistance(center.lat, center.lng, p.lat, p.lon);
      return dist <= radius;
    });

    if (puntosFiltrados.length === 0) {
      layer.setPopupContent("No hay puntos dentro del círculo.");
      return;
    }

    const payload = puntosFiltrados.map(p => ({
      utm_norte: p.utm_norte,
      utm_este: p.utm_este
    }));

    try {
      const res = await fetch('http://localhost:8000/puntos/estadisticas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        layer.setPopupContent("No se pudieron obtener estadísticas.");
        return;
      }

      const stats = data[0]; // análisis agregado

      // HTML visual atractivo usando Tailwind CSS
      const popupHtml = `
        <div style="animation: fadeIn 0.3s ease-out" class="text-[13px] font-sans p-0 m-0 space-y-1 min-w-[220px]">
          <div class="font-bold text-sm text-cyan-800 border-b border-cyan-500 pb-1">
            Análisis estadístico del área
          </div>

          <div class="flex justify-between"><span class="text-gray-600">Puntos:</span><span class="text-gray-800 font-medium">${stats.puntos_consultados ?? '?'}</span></div>
          <div class="flex justify-between"><span class="text-gray-600">Mediciones:</span><span class="text-gray-800 font-medium">${Number(stats.total_registros_con_caudal ?? 0).toLocaleString('es-CL')}</span></div>
          <div class="flex justify-between"><span class="text-green-600">Promedio:</span><span class="font-semibold text-green-700">${Number(stats.caudal_promedio ?? 0).toFixed(2)} m³/s</span></div>
          <div class="flex justify-between"><span class="text-blue-600">Mínimo:</span><span class="font-semibold text-blue-700">${Number(stats.caudal_minimo ?? 0).toFixed(2)} m³/s</span></div>
          <div class="flex justify-between"><span class="text-red-600">Máximo:</span><span class="font-semibold text-red-700">${Number(stats.caudal_maximo ?? 0).toFixed(2)} m³/s</span></div>
          <div class="flex justify-between"><span class="text-purple-600">Desviación:</span><span class="text-purple-700 font-medium">${Number(stats.desviacion_estandar_caudal ?? 0).toFixed(2)} m³/s</span></div>
        </div>
      `;

      // Actualiza el contenido del popup
      layer.setPopupContent(popupHtml).openPopup();

    } catch (err) {
      console.error("Error al obtener estadísticas:", err);
      layer.setPopupContent("Error al consultar estadísticas.");
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

                // Mostrar mensaje temporal
                layer.bindPopup("Cargando...").openPopup();

                // Llama la función y pasa el layer
                getPointsInCircle(puntos, center, radius, layer);
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
          <button
            onClick={() => setSidebarAbierto(false)}
            className="absolute -top-0 -right-5 text-white bg-gray-700 w-10 h-10 rounded hover:text-cyan-300 flex items-center justify-center text-4xl font-bold z-[1100] shadow-lg cursor-pointer"
            aria-label="Cerrar filtros"
          >
            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"
                viewBox="0 0 24 24"  fill="none"  stroke="currentColor" 
                strokeWidth="2"  strokeLinecap="round"  strokeLinejoin="round"
                className="icon icon-tabler icons-tabler-outline icon-tabler-x">
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

          <div className="flex justify-center mt-4">
            <button
              onClick={handleCoordenadasUnicas}
              className="bg-green-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-green-800 hover:text-white"
            >
              Consultar puntos
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
          className="absolute top-3 left-12 bg-blue-600 text-white px-3 py-1 rounded z-[1000] cursor-pointer"
        >
          ☰ Filtros
        </button>
      )}

      {rightSidebarAbiertoCuencas && (
        <div
          className="absolute right-0 top-0 z-[1000] h-full bg-white shadow-md text-sm p-8 space-y-6 overflow-y-auto"
          style={{ width: '45rem', maxHeight: '100vh' }}
        >

          <button
            onClick={() => setRightSidebarAbiertoCuencas(false)}
            className="absolute top-1 left-1 text-white bg-gray-700 w-10 h-10 rounded-full hover:text-cyan-300 flex items-center justify-center text-2xl font-bold z-[1100] shadow-lg cursor-pointer"
            aria-label="Cerrar sidebar de puntos"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="icon icon-tabler icons-tabler-outline icon-tabler-x">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
            </svg>
          </button>

          <h2 className="text-2xl font-bold border-b pb-2 mt-2">Análisis de Cuenca</h2>

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

          {graphicsCuencasLoading === 0 && (
            <button
              onClick={loadCuencasGraphics}
              className="block mt-6 bg-cyan-700 text-white font-semibold px-4 py-2 rounded cursor-pointer hover:bg-cyan-600 transition"
            >
              Cargar Gráficos
            </button>
          )}

          {graphicsCuencasLoading === 1 && (
            <div className="space-y-2 mt-16 mx-auto flex justify-center">
              <Slab color="#155e75" size="large" text="Cargando..." textColor="#000000" />
            </div>
          )}

          {graphicsCuencasLoading === 2 && (
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
        </div>
      )}


      {rightSidebarAbiertoPunto && (
        <div
          className="absolute right-0 top-0 z-[1000] h-full bg-white shadow-md text-sm p-8 space-y-6 overflow-y-auto"
          style={{ width: '45rem', maxHeight: '100vh' }}
        >

          <button
            onClick={() => setRightSidebarAbiertoPunto(false)}
            className="absolute top-1 left-1 text-white bg-gray-700 w-10 h-10 rounded-full hover:text-cyan-300 flex items-center justify-center text-2xl font-bold z-[1100] shadow-lg cursor-pointer"
            aria-label="Cerrar sidebar de puntos"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="icon icon-tabler icons-tabler-outline icon-tabler-x">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
            </svg>
          </button>

          <h2 className="text-2xl font-bold border-b pb-2 mt-2">Análisis del punto</h2>

          <h3 className="text-lg font-semibold">
            Punto: <span className="text-cyan-800 font-bold">{analisisPuntoSeleccionado.utm_norte} - {analisisPuntoSeleccionado.utm_este}</span>
          </h3>

          {!analisisPuntoSeleccionadoLoading ? (
            <div className="space-y-4 pt-2">
              <h3 className="text-base font-semibold text-gray-700">Análisis Estadístico</h3>

              <div className="grid grid-cols-1 gap-4">
                <div className="bg-blue-50 p-4 rounded shadow-sm">
                  <p className="text-gray-500 text-xs">Total de registros con caudal</p>
                  <p className="text-blue-800 font-extrabold text-xl">{analisisPuntoSeleccionado.total_registros_con_caudal != null ?
                    Number(analisisPuntoSeleccionado.total_registros_con_caudal.toFixed(2)).toLocaleString()
                    : '-'}</p>
                </div>

                <div className="bg-green-50 p-4 rounded shadow-sm">
                  <p className="text-gray-500 text-xs">Caudal promedio (m³/s)</p>
                  <p className="text-green-800 font-extrabold text-xl">{analisisPuntoSeleccionado.caudal_promedio != null ?
                    Number(analisisPuntoSeleccionado.caudal_promedio.toFixed(2)).toLocaleString()
                    : '-'}</p>
                </div>

                <div className="bg-yellow-50 p-4 rounded shadow-sm">
                  <p className="text-gray-500 text-xs">Caudal mínimo (m³/s)</p>
                  <p className="text-yellow-800 font-extrabold text-xl">{analisisPuntoSeleccionado.caudal_minimo != null ?
                    Number(analisisPuntoSeleccionado.caudal_minimo.toFixed(2)).toLocaleString()
                    : '-'}</p>
                </div>

                <div className="bg-red-50 p-4 rounded shadow-sm">
                  <p className="text-gray-500 text-xs">Caudal máximo (m³/s)</p>
                  <p className="text-red-800 font-extrabold text-xl">{analisisPuntoSeleccionado.caudal_maximo != null ? 
                    Number(analisisPuntoSeleccionado.caudal_maximo.toFixed(2)).toLocaleString()
                    : '-'}</p>
                </div>

                <div className="bg-purple-50 p-4 rounded shadow-sm">
                  <p className="text-gray-500 text-xs">Desviación estándar del caudal</p>
                  <p className="text-purple-800 font-extrabold text-xl">{analisisPuntoSeleccionado.desviacion_estandar_caudal != null
                    ? Number(analisisPuntoSeleccionado.desviacion_estandar_caudal.toFixed(2)).toLocaleString()
                    : '-'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 mt-16 mx-auto flex justify-center">
              <TrophySpin color="#155e75" size="large" text="Cargando..." textColor="#000000" />
            </div>
          )}

          {graphicsPuntosLoading === 0 && (
            <button
              onClick={() => loadPuntosGraphics(analisisPuntoSeleccionado.utm_norte, analisisPuntoSeleccionado.utm_este)}
              className="block mt-6 bg-cyan-700 text-white font-semibold px-4 py-2 rounded cursor-pointer hover:bg-cyan-600 transition"
            >
              Cargar Gráficos
            </button>
          )}

          {graphicsPuntosLoading === 1 && (
            <div className="space-y-2 mt-16 mx-auto flex justify-center">
              <Slab color="#155e75" size="large" text="Cargando..." textColor="#000000" />
            </div>
          )}

          {graphicsPuntosLoading === 2 && (
            <div className="space-y-10 mt-6 border-t pt-6">
              <h3 className="text-lg font-semibold">Gráficos</h3>

              {/* Gráfico de caudal por tiempo */}
              <div className="w-full h-96">
                <h4 className="text-sm font-semibold mb-1 text-gray-700">Caudal por tiempo</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graficosPuntosData.caudal_por_tiempo}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="fecha_medicion"
                      tickFormatter={(str) => new Date(str).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit' })}
                      minTickGap={30}
                    />
                    <YAxis domain={['dataMin - 0.01', 'dataMax + 0.01']} />
                    <Tooltip
                      labelFormatter={(label) => new Date(label).toLocaleString('es-CL')}
                      formatter={(value) => [`${value} m³/s`, 'Caudal']}
                    />
                    <Line type="monotone" dataKey="caudal" stroke="#2563eb" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

            </div>
          )}

        </div>
      )}


    </div>
  );
}
