import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

// Arreglar íconos por defecto en React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

export default function Mapa() {
  const [puntos, setPuntos] = useState([]);
  const [selected, setSelected] = useState(null); // Punto seleccionado
  const [analisis, setAnalisis] = useState(null); // Datos del análisis
  const [loadingAnalisis, setLoadingAnalisis] = useState(false);
  const [puntosFiltrados, setPuntosFiltrados] = useState([]);

  const [filtros, setFiltros] = useState({
    comuna: '',
    subcuenca: '',
  });

  const [sidebarAbierto, setSidebarAbierto] = useState(true);



  useEffect(() => {
    fetch("http://localhost:8000/api/coordenadas/")
      .then((res) => res.json())
      .then((data) => {
        setPuntos(data);
        setPuntosFiltrados(data); // al inicio se muestran todos
      });
  }, []);

  const aplicarFiltros = () => {
    const filtrados = puntos.filter(p => {
      return (
        (filtros.comuna === '' || String(p.comuna) === filtros.comuna) &&
        (filtros.subcuenca === '' || p.nom_subsubcuenca === filtros.subcuenca))
    });


    setPuntosFiltrados(filtrados);
  };


  const handleVerDetalles = (punto) => {
    setSelected(punto);
    setLoadingAnalisis(true); // Inicia carga

    fetch("http://localhost:8000/api/analisis-coordenada/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        utm_norte: punto.utm_norte,
        utm_este: punto.utm_este
      })
    })
      .then(res => res.json())
      .then(data => {
        setAnalisis(data);
        setLoadingAnalisis(false); // Finaliza carga
      })
      .catch(err => {
        console.error("Error al obtener análisis:", err);
        setLoadingAnalisis(false); // Finaliza carga en caso de error
      });
  };


  return (
    <div className="relative">
      <MapContainer center={[-33.45, -70.66]} zoom={6} style={{ height: "90vh", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">Carto</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {puntosFiltrados.map((punto) => (
          <Marker key={punto.id} position={[punto.lat, punto.lon]}>
            <Popup>
              <button
                onClick={() => handleVerDetalles(punto)}
                className="text-blue-600 underline"
              >
                Ver detalles
              </button>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {selected && (
        <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-lg p-4 z-[1000] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Detalles del punto</h2>
          <p><strong>Cuenca:</strong> {selected.nom_cuenca}</p>
          <p><strong>Subcuenca:</strong> {selected.nom_subsubcuenca}</p>
          <p><strong>Comuna:</strong> {selected.comuna}</p>

          {loadingAnalisis ? (
            <div className="flex justify-center items-center my-6">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-sm text-gray-700">Cargando análisis...</span>
            </div>
          ) : (
            analisis && (
              <>
                <hr className="my-3" />
                <p><strong>Total de registros:</strong> {analisis.total_registros}</p>
                <p><strong>Caudal total extraído:</strong> {analisis.total_caudal?.toFixed(2)} m³/s</p>
                <p><strong>Caudal promedio:</strong> {analisis.promedio_caudal?.toFixed(2)} m³/s</p>

                {analisis.ranking_informantes?.length > 0 && (
                  <div className="my-4">
                    <h3 className="font-semibold mb-2">Top informantes</h3>
                    <Bar
                      data={{
                        labels: analisis.ranking_informantes.map(i => `ID ${i.id_informante}`),
                        datasets: [{
                          label: 'Caudal total (m³/s)',
                          data: analisis.ranking_informantes.map(i => i.total_caudal),
                          backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        }],
                      }}
                      options={{
                        responsive: true,
                        plugins: { legend: { display: false } },
                      }}
                    />
                  </div>
                )}
              </>
            )
          )}

          

          <button
            className="mt-4 px-3 py-1 bg-blue-600 text-white rounded"
            onClick={() => {
              setSelected(null);
              setAnalisis(null);
            }}
          >
            Cerrar
          </button>
        </div>
      )}

      {sidebarAbierto && (
        <div className="absolute left-0 z-[1000] top-0 w-80 bg-white h-full shadow-md p-6 space-y-4 text-sm">
          <h2 className="text-lg font-semibold mb-4">Filtros</h2>

          <label className="block font-medium">Comuna:</label>
          <select
            value={filtros.comuna}
            onChange={(e) => setFiltros({ ...filtros, comuna: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="">-- Todas --</option>
            {[...new Set(puntos.map(p => p.comuna))].map((comuna, idx) => (
              <option key={idx} value={comuna}>{comuna}</option>
            ))}
          </select>

          <label className="block font-medium">Subcuenca:</label>
          <select
            value={filtros.subcuenca}
            onChange={(e) => setFiltros({ ...filtros, subcuenca: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="">-- Todas --</option>
            {[...new Set(puntos.map(p => p.nom_subsubcuenca))].map((sub, idx) => (
              <option key={idx} value={sub}>{sub}</option>
            ))}
          </select>

          <div className="flex justify-between mt-4">
            <button
              onClick={aplicarFiltros}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Aplicar filtros
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
