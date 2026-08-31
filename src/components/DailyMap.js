// src/components/DailyMap.js
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { renderToStaticMarkup } from 'react-dom/server';
import { Home } from 'lucide-react';
import './DailyMap.css';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

const HOME_ICON_SVG = renderToStaticMarkup(<Home size={14} color="#fff" strokeWidth={2.5} />);

// Every leg is shifted this many meters to the "right" of its own direction of
// travel. Two legs that retrace the exact same street in opposite directions
// (the extremely common home -> class -> home case) end up on opposite sides
// of the centerline instead of drawing on top of each other, because "right
// of travel" flips to the opposite physical side when the direction reverses.
const ROUTE_OFFSET_METERS = 4;
const ARROW_ICON_ID = 'daily-map-walk-arrow';

function stopKey(stop) {
  return `${stop.lat.toFixed(6)},${stop.lng.toFixed(6)}`;
}

function metersPerDegreeAt(lat) {
  const latRad = (lat * Math.PI) / 180;
  return {
    lat: 111320,
    lng: 111320 * Math.cos(latRad),
  };
}

// Shifts a lng/lat polyline perpendicular to its own local direction by a
// fixed real-world distance, so the offset stays visually consistent across
// zoom levels and both the line and its direction arrows can share one
// geometry (rather than approximating the shift separately for each).
function offsetLineCoordinates(coordinates, offsetMeters) {
  if (coordinates.length < 2 || !offsetMeters) return coordinates;

  return coordinates.map((coord, i) => {
    const [lng, lat] = coord;
    const prev = coordinates[Math.max(0, i - 1)];
    const next = coordinates[Math.min(coordinates.length - 1, i + 1)];
    const scale = metersPerDegreeAt(lat);

    const dx = (next[0] - prev[0]) * scale.lng;
    const dy = (next[1] - prev[1]) * scale.lat;
    const len = Math.hypot(dx, dy) || 1;

    // Rotate the local tangent 90° clockwise to get "right of travel".
    const perpXMeters = dy / len;
    const perpYMeters = -dx / len;

    return [
      lng + (perpXMeters * offsetMeters) / scale.lng,
      lat + (perpYMeters * offsetMeters) / scale.lat,
    ];
  });
}

function createArrowIcon(size = 24) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.moveTo(size * 0.16, size * 0.14);
  ctx.lineTo(size * 0.88, size * 0.5);
  ctx.lineTo(size * 0.16, size * 0.86);
  ctx.closePath();
  ctx.fillStyle = '#000';
  ctx.fill();
  return ctx.getImageData(0, 0, size, size);
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
      if (!map.hasImage(ARROW_ICON_ID)) {
        map.addImage(ARROW_ICON_ID, createArrowIcon(), { sdf: true });
      }

      legs.forEach((leg, i) => {
        const sourceId = `route-leg-${i}`;
        const color = legColors[i % legColors.length];
        const offsetCoordinates = offsetLineCoordinates(
          leg.geometry.coordinates,
          ROUTE_OFFSET_METERS
        );
        const routeLength = leg.geometry.coordinates.length;

        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: offsetCoordinates },
          },
        });

        map.addLayer({
          id: sourceId,
          type: 'line',
          source: sourceId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': color,
            'line-width': 5,
          },
        });

        // Repeat small direction arrows along the route rather than a single
        // centered glyph — one arrow can land under a marker or run out of
        // room to render; several spaced-out ones read as "flow direction"
        // and always show at least one somewhere along the leg.
        map.addLayer({
          id: `${sourceId}-arrow`,
          type: 'symbol',
          source: sourceId,
          layout: {
            'symbol-placement': 'line',
            'symbol-spacing': Math.max(30, Math.min(90, routeLength)),
            'icon-image': ARROW_ICON_ID,
            'icon-size': 0.7,
            'icon-rotation-alignment': 'map',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
          },
          paint: {
            'icon-color': color,
            'icon-halo-color': '#ffffff',
            'icon-halo-width': 1.5,
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
