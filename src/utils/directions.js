// src/utils/directions.js
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

export async function getWalkingLeg(from, to) {
  const coordString = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coordString}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Directions request failed');
  }

  const data = await res.json();
  if (!data.routes || data.routes.length === 0) {
    throw new Error('No route found');
  }

  const route = data.routes[0];
  return {
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    geometry: route.geometry,
  };
}