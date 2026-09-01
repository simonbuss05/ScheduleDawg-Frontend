// src/utils/campusBuildings.js
import api from '../api/axiosConfig';

const CACHE_KEY = 'scheduledawg_campus_buildings_v2';

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

export async function getCampusBuildings() {
  const cached = readCache();
  if (cached) return cached;

  // Routed through our own backend (see CampusBuildingsController) rather
  // than calling Overpass directly — Overpass doesn't reliably send CORS
  // headers for arbitrary browser origins, so a server-to-server call is the
  // reliable path here, and it's shared/cached across every user too.
  const res = await api.get('/campus-buildings');
  writeCache(res.data);
  return res.data;
}
