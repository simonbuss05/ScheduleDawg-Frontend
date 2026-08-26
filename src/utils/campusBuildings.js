// src/utils/campusBuildings.js
const CACHE_KEY = 'scheduledawg_campus_buildings_v1';

// Bounding box: south, west, north, east — a few miles around UGA's campus,
// wider than just campus itself so off-campus locations still match.
const BBOX = '33.88,-83.45,34.02,-83.28';

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(buildings) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(buildings));
  } catch {
    // ignore, non-critical
  }
}

async function fetchFromOverpass() {
  const query = `
    [out:json][timeout:25];
    (
      way["building"]["name"](${BBOX});
      node["building"]["name"](${BBOX});
    );
    out center;
  `;

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) {
    throw new Error('Could not load campus building data');
  }

  const data = await res.json();

  return data.elements
    .map((el) => {
      const name = el.tags?.name;
      if (!name) return null;
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (lat == null || lng == null) return null;
      return { name, lat, lng };
    })
    .filter(Boolean);
}

export async function getCampusBuildings() {
  const cached = readCache();
  if (cached) return cached;

  const buildings = await fetchFromOverpass();
  writeCache(buildings);
  return buildings;
}