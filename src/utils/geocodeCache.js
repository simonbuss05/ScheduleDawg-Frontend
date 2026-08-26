// src/utils/geocodeCache.js
const CACHE_KEY = 'scheduledawg_geocode_cache';

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage can fail (private browsing, quota) — fail silently, just re-geocode
  }
}

export function getCachedCoords(key) {
  const cache = readCache();
  return cache[key] || null;
}

export function setCachedCoords(key, coords) {
  const cache = readCache();
  cache[key] = coords;
  writeCache(cache);
}