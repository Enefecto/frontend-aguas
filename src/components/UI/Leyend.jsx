import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { sanitizeHTML, validateColor } from '../../utils/sanitize.js';

export function Legend({
  colores = { subterraneo: '#FF5722', extraccion: '#2E7BCC', sinClasificar: '#9CA3AF' },
  position = 'bottomright',
}) {
  const map = useMap();

  useEffect(() => {
    const ctl = L.control({ position });

    ctl.onAdd = () => {
      const div = L.DomUtil.create('div', 'custom-legend');

      // estilos tipo "card"
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
        zIndex: '1000',
      });

      div.style.fontFamily = getComputedStyle(document.body).fontFamily;

      // Ajustes responsivos para móviles
      const isMobile = window.matchMedia('(max-width: 768px)').matches;
      if (isMobile) {
        Object.assign(div.style, {
          fontSize: '10px',
          padding: '6px 8px',
          minWidth: '160px',
          maxWidth: '170px',
          borderRadius: '8px',
          lineHeight: '1.2',
        });
      }

      // evita propagar eventos al mapa
      L.DomEvent.disableClickPropagation(div);

      // Validar colores antes de usar en HTML
      const safeSubterraneo = validateColor(colores.subterraneo, '#FF5722');
      const safeExtraccion = validateColor(colores.extraccion, '#2E7BCC');

      const iconSize = isMobile ? '12' : '18';
      const gapSize = isMobile ? '5px' : '8px';
      const marginSize = isMobile ? '3px' : '6px';

      const htmlContent = `
        <div style="display:flex;align-items:center;gap:${gapSize};margin-bottom:${marginSize};font-weight:700;">
          <span>Leyenda</span>
        </div>

        <hr style="margin:${marginSize} 0;"/>
        <div style="display:flex;align-items:center;gap:${gapSize};margin:${marginSize} 0;">
          <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 28 36" aria-hidden="true">
            <path d="M14 2 C14 2 4 15 4 21 a10 10 0 0 0 20 0 C24 15 14 2 14 2z"
                  fill="${safeSubterraneo}" stroke="white" stroke-width="1.1"/>
          </svg>
          <span>Extracción subterránea</span>
        </div>

        <div style="display:flex;align-items:center;gap:${gapSize};margin:${marginSize} 0;">
          <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 28 36" aria-hidden="true">
            <path d="M14 2 C14 2 4 15 4 21 a10 10 0 0 0 20 0 C24 15 14 2 14 2z"
                  fill="${safeExtraccion}" stroke="white" stroke-width="1.1"/>
          </svg>
          <span>Extracción superficial</span>
        </div>
      `;

      // Sanitizar HTML antes de inyectar
      div.innerHTML = sanitizeHTML(htmlContent);

      return div;
    };

    ctl.addTo(map);
    return () => ctl.remove();
  }, [map, position, colores]);

  return null;
}
