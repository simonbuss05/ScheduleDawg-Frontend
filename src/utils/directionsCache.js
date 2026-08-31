// src/utils/directionsCache.js
// Walking-leg results, keyed by the (from, to) coordinate pair. Unlike
// dayRouteCache (an in-memory, 10-minute cache of a whole day's route), this
// persists across reloads and has no expiry — the walking route between two
// fixed buildings doesn't change from one day to the next, so a leg computed
// once (e.g. for this Monday's route) is reused for every future date that
// happens to share the same stops (next Monday, the Monday after, ...),
// instead of re-hitting the Mapbox Directions API each time.
const CACHE_KEY = 'scheduledawg_directions_cache_v1';

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
    // localStorage can fail (private browsing, quota) — fail silently, just re-fetch
  }
}

function round(n) {
  // ~1.1m precision — plenty for matching the same building twice.
  return Math.round(n * 100000) / 100000;
}

export function legKey(from, to) {
  return `${round(from.lat)},${round(from.lng)}|${round(to.lat)},${round(to.lng)}`;
}

export function getCachedLeg(key) {
  const cache = readCache();
  return cache[key] || null;
}

export function setCachedLeg(key, leg) {
  const cache = readCache();
  cache[key] = leg;
  writeCache(cache);
}
