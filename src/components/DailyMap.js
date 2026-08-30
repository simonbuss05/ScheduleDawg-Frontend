// src/components/DailyMap.js
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { renderToStaticMarkup } from 'react-dom/server';
import { Home } from 'lucide-react';
import './DailyMap.css';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

const HOME_ICON_SVG = renderToStaticMarkup(<Home size={14} color="#fff" strokeWidth={2.5} />);

function stopKey(stop) {
  return `${stop.lat.toFixed(6)},${stop.lng.toFixed(6)}`;
}

function DailyMap({ stops, legs, legColors }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || stops.length === 0) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [stops[0].lng, stops[0].lat],
      zoom: 15,
    });
    mapRef.current = map;

    const hoverPopup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 8,
    });

    map.on('load', () => {
      legs.forEach((leg, i) => {
        const sourceId = `route-leg-${i}`;
        const color = legColors[i % legColors.length];
        const offset = (i % 2 === 0 ? 1 : -1) * (4 + Math.floor(i / 2) * 3);

        map.addSource(sourceId, {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: leg.geometry },
        });

        map.addLayer({
          id: sourceId,
          type: 'line',
          source: sourceId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': color,
            'line-width': 6,
            'line-offset': offset,
          },
        });

        map.addLayer({
          id: `${sourceId}-arrow`,
          type: 'symbol',
          source: sourceId,
          layout: {
            'symbol-placement': 'line-center',
            'text-field': '➤',
            'text-size': 20,
            'text-keep-upright': false,
            'text-rotation-alignment': 'map',
            'text-offset': [0, offset / 12],
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          },
          paint: {
            'text-color': '#1a1a1a',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2.5,
          },
        });

        map.on('mouseenter', sourceId, (e) => {
          map.getCanvas().style.cursor = 'pointer';
          hoverPopup
            .setLngLat(e.lngLat)
            .setHTML(
              `<strong>${leg.from.label}</strong> &rarr; <strong>${leg.to.label}</strong>`
            )
            .addTo(map);
        });

        map.on('mousemove', sourceId, (e) => {
          hoverPopup.setLngLat(e.lngLat);
        });

        map.on('mouseleave', sourceId, () => {
          map.getCanvas().style.cursor = '';
          hoverPopup.remove();
        });
      });

      const groups = new Map();
      stops.forEach((stop, i) => {
        const key = stop.label === 'Home' ? 'home' : stopKey(stop);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push({ stop, index: i });
      });

      const bounds = new mapboxgl.LngLatBounds();

      groups.forEach((entries) => {
        const isHome = entries[0].stop.label === 'Home';

        entries.forEach((entry, j) => {
          const { stop, index } = entry;
          const el = document.createElement('div');
          el.className = 'daily-map-marker';
          el.innerHTML = isHome ? HOME_ICON_SVG : String(index);

          let markerOffset = [0, 0];
          if (!isHome && entries.length > 1) {
            const angle = (j / entries.length) * 2 * Math.PI;
            const radius = 16;
            markerOffset = [Math.cos(angle) * radius, Math.sin(angle) * radius];
          }

          if (isHome && j > 0) return;

          new mapboxgl.Marker({ element: el, offset: markerOffset })
            .setLngLat([stop.lng, stop.lat])
            .setPopup(
              new mapboxgl.Popup({ offset: 14 }).setText(
                stop.sub ? `${stop.label} — ${stop.sub}` : stop.label
              )
            )
            .addTo(map);

          bounds.extend([stop.lng, stop.lat]);
        });
      });

      map.fitBounds(bounds, { padding: 40 });
    });

    return () => map.remove();
  }, [stops, legs, legColors]);

  return <div ref={containerRef} className="daily-map-container" />;
}

export default DailyMap;