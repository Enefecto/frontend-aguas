// Librerias
import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

import 'leaflet-draw';

// Componentes de este proyecto
import { PopupPunto } from './Popups/PopupPunto';
import SidebarFiltros from './sidebars/SidebarFiltros';
import SidebarCuenca from './sidebars/SidebarCuenca';
import SidebarPunto from './sidebars/SidebarPunto';
import BotonAbrirSidebar from './sidebars/BotonAbrirSidebar';
import { getPointsInCircle } from './Popups/PopupPuntosInCircle';

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
              polygon: false,
              marker: false,
              circlemarker: false,
              circle: {
                shapeOptions: {
                  color: '#ff0000',
                },
              },
              polyline: {
                shapeOptions: {
                  color: '#1d4ed8', // azul elegante
                  weight: 4,
                },
              },
            }}
            edit={{
              edit: false,
              remove: true,
            }}
            onCreated={(e) => {
              const layer = e.layer;

              if (e.layerType === 'circle') {
                const center = layer.getLatLng();
                const radius = layer.getRadius();

                // Mostrar mensaje temporal
                layer.bindPopup("Cargando...").openPopup();

                // Llama la función y pasa el layer
                getPointsInCircle(puntos, center, radius, layer);
              }

              if (e.layerType === 'polyline') {
                const latlngs = layer.getLatLngs();

                if (latlngs.length >= 2) {
                  let distanciaTotalMetros = 0;

                  for (let i = 0; i < latlngs.length - 1; i++) {
                    distanciaTotalMetros += latlngs[i].distanceTo(latlngs[i + 1]);
                  }

                  const distanciaKm = (distanciaTotalMetros / 1000).toFixed(2);

                  layer.bindPopup(`Distancia: ${distanciaKm} km`).openPopup();

                  console.log('Distancia total:', distanciaKm, 'km');
                }

              }
            }}
          />
        </FeatureGroup>

        {/* Tus puntos */}
        {puntos.map((punto, index) => (
          <Marker key={index} position={[punto.lat, punto.lon]}>
            <Popup>
              <PopupPunto punto={punto} handleShowGraphics={handleShowGraphics} handleShowCoordGraphics={handleShowCoordGraphics}/>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {sidebarAbierto && (
        <SidebarFiltros
          filtros={filtros}
          setFiltros={setFiltros}
          regionesUnicas={regionesUnicas}
          cuencasUnicas={cuencasUnicas}
          subcuencasUnicas={subcuencasUnicas}
          limitMax={limitMax}
          min={min}
          max={max}
          filtroCaudal={filtroCaudal}
          setFiltroCaudal={setFiltroCaudal}
          ordenCaudal={ordenCaudal}
          setOrdenCaudal={setOrdenCaudal}
          handleCoordenadasUnicas={handleCoordenadasUnicas}
          isLoaded={isLoaded}
          puntos={puntos}
          limiteSolicitado={limiteSolicitado}
          setSidebarAbierto={setSidebarAbierto}
        />
      )}

      {!sidebarAbierto && (
        <BotonAbrirSidebar setSidebarAbierto={setSidebarAbierto} />
      )}

      {rightSidebarAbiertoCuencas && (
        <SidebarCuenca
          cuencaAnalysis={cuencaAnalysis}
          cuencaLoading={cuencaLoading}
          graphicsCuencasLoading={graphicsCuencasLoading}
          graficosData={graficosData}
          setRightSidebarAbiertoCuencas={setRightSidebarAbiertoCuencas}
          loadCuencasGraphics={loadCuencasGraphics}
        />
      )}

      {rightSidebarAbiertoPunto && (
        <SidebarPunto
          analisisPuntoSeleccionado={analisisPuntoSeleccionado}
          analisisPuntoSeleccionadoLoading={analisisPuntoSeleccionadoLoading}
          graphicsPuntosLoading={graphicsPuntosLoading}
          graficosPuntosData={graficosPuntosData}
          loadPuntosGraphics={loadPuntosGraphics}
          setRightSidebarAbiertoPunto={setRightSidebarAbiertoPunto}
        />
      )}

    </div>
  );
}
