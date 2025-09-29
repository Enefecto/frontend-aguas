import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export function Legend({
  colores = { subterraneo: '#FF5722', extraccion: '#2E7BCC', sinClasificar: '#9CA3AF' },
  position = 'bottomright',
}) {
  const map = useMap();

  useEffect(() => {
    const ctl = L.control({ position });

    ctl.onAdd = () => {
      const div = L.DomUtil.create('div', 'custom-legend');

      // estilos tipo “card”
      Object.assign(div.style, {
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '10px 12px',
        boxShadow: '0 8px 22px rgba(0,0,0,.08)',
        fontSize: '12px',
        color: '#0f172a',
        lineHeight: '1.25',
        minWidth: '190px',
        userSelect: 'none',
      });

      div.style.fontFamily = getComputedStyle(document.body).fontFamily;

      // evita propagar eventos al mapa
      L.DomEvent.disableClickPropagation(div);

      div.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-weight:700;">
          <span>Leyenda</span>
        </div>

        <hr/>
        <div style="display:flex;align-items:center;gap:8px;margin:6px 0;">
          <svg width="18" height="18" viewBox="0 0 28 36" aria-hidden="true">
            <path d="M14 2 C14 2 4 15 4 21 a10 10 0 0 0 20 0 C24 15 14 2 14 2z"
                  fill="${colores.subterraneo}" stroke="white" stroke-width="1.1"/>
          </svg>
          <span>Extracción subterránea</span>
        </div>

        <div style="display:flex;align-items:center;gap:8px;margin:6px 0;">
          <svg width="18" height="18" viewBox="0 0 28 36" aria-hidden="true">
            <path d="M14 2 C14 2 4 15 4 21 a10 10 0 0 0 20 0 C24 15 14 2 14 2z"
                  fill="${colores.extraccion}" stroke="white" stroke-width="1.1"/>
          </svg>
          <span>Extracción superficial</span>
        </div>

        <div style="display:flex;align-items:center;gap:8px;margin:6px 0;">
          <svg width="18" height="18" viewBox="0 0 28 36" aria-hidden="true">
            <path d="M14 2 C14 2 4 15 4 21 a10 10 0 0 0 20 0 C24 15 14 2 14 2z"
                  fill="${colores.sinClasificar}" stroke="white" stroke-width="1.1"/>
          </svg>
          <span>Sin clasificación</span>
        </div>

      `;

      return div;
    };

    ctl.addTo(map);
    return () => ctl.remove();
  }, [map, position, colores]);

  return null;
}
