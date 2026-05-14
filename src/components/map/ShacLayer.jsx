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

export const ShacLayer = () => {
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
        const cod = p.COD_SHAC || '';
        layer.bindPopup(
          `<div style="font-size:12px;line-height:1.4">
             <strong>${name}</strong>
             ${region ? `<br/><span>${region}</span>` : ''}
             ${cod ? `<br/><span style="color:#6b7280">${cod}</span>` : ''}
           </div>`
        );
      }}
    />
  );
};

ShacLayer.displayName = 'ShacLayer';
