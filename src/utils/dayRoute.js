// src/utils/dayRoute.js
import { geocodeBuilding } from './geocoding';
import { getWalkingLeg } from './directions';

export async function buildDayRoute(home, meetings) {
  if (!home || meetings.length === 0) return null;

  const buildingCoords = [];
  for (const m of meetings) {
    try {
      const coords = await geocodeBuilding(m.building);
      buildingCoords.push(coords);
    } catch (err) {
      throw new Error(`Could not locate "${m.building}" (${m.course.code}). ${err.message}`);
    }
  }

  const stops = [
    { label: 'Home', lat: home.lat, lng: home.lng },
    ...meetings.map((m, i) => ({
      label: m.course.name,
      sub: `${m.building}${m.roomNumber ? ` ${m.roomNumber}` : ''}`,
      lat: buildingCoords[i].lat,
      lng: buildingCoords[i].lng,
      meeting: m,
    })),
    { label: 'Home', lat: home.lat, lng: home.lng },
  ];

  const legs = [];
  let totalDistanceMeters = 0;
  let totalDurationSeconds = 0;

  for (let i = 0; i < stops.length - 1; i++) {
    const legResult = await getWalkingLeg(stops[i], stops[i + 1]);
    legs.push({
      from: stops[i],
      to: stops[i + 1],
      distanceMeters: legResult.distanceMeters,
      durationSeconds: legResult.durationSeconds,
      geometry: legResult.geometry,
    });
    totalDistanceMeters += legResult.distanceMeters;
    totalDurationSeconds += legResult.durationSeconds;
  }

  return { stops, legs, totalDistanceMeters, totalDurationSeconds };
}