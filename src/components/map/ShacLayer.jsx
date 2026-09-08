import React, { useEffect, useState } from 'react';
import { GeoJSON } from 'react-leaflet';

const GEOJSON_URL = '/geo/shacs_10pct.geojson';

const STYLE = {
  color: '#0e7490',
  weight: 1,
  opacity: 0.85,
  fillColor: '#22d3ee',
  fillOpacity: 0.18
};

let cached = null;
let inflight = null;

export const ShacLayer = ({ onSelectShac }) => {
  const [data, setData] = useState(cached);

  useEffect(() => {
    if (cached) {
      setData(cached);
      return;
    }
    let alive = true;
    if (!inflight) {
      inflight = fetch(GEOJSON_URL).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      });
    }
    inflight
      .then(json => {
        cached = json;
        if (alive) setData(json);
      })
      .catch(err => {
        inflight = null;
        console.error('SHAC layer load failed:', err);
      });
    return () => { alive = false; };
  }, []);

  if (!data) return null;

  return (
    <GeoJSON
      data={data}
      style={STYLE}
      onEachFeature={(feature, layer) => {
        const p = feature.properties || {};
        const name = p.SHAC || p.NOM_ACUIF || 'SHAC';
        const region = p.REGION || '';
        // Ojo: la llave contra la base NO es COD_SHAC. El geojson trae
        // COD_SHAC como "SHAC-01-03-6" (etiqueta compuesta) mientras que
        // dw.Puntos_Mapa usa COD_SECTOR_SHA numérico. El que corresponde es
        // COD_BNA_SH ("0003" -> 3): verificado contra /api/shacs, casa por
        // nombre en 247 de los 248 sectores.
        const etiqueta = p.COD_SHAC || '';
        const cod = Number.parseInt(p.COD_BNA_SH, 10);
        const codValido = Number.isFinite(cod);
        layer.bindPopup(
          `<div style="font-size:12px;line-height:1.4">
             <strong>${name}</strong>
             ${region ? `<br/><span>${region}</span>` : ''}
             ${etiqueta ? `<br/><span style="color:#6b7280">${etiqueta}</span>` : ''}
             ${codValido && onSelectShac ? '<br/><span style="color:#0e7490">Clic para analizar el sector</span>' : ''}
           </div>`
        );

        // Sin código no hay con qué consultar el sector, así que el clic no
        // hace nada más que mostrar el popup.
        if (codValido && onSelectShac) {
          layer.on('click', () => onSelectShac(name, cod));
        }
      }}
    />
  );
};

ShacLayer.displayName = 'ShacLayer';
