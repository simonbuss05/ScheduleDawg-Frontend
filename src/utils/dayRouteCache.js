// src/utils/dayRouteCache.js
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const cache = new Map();

export function getCachedRoute(key) {
  const entry = cache.get(key);
  if (!entry) return null;

  const isExpired = Date.now() - entry.timestamp > CACHE_TTL_MS;
  if (isExpired) {
    cache.delete(key);
    return null;
  }

  return entry.route;
}

export function setCachedRoute(key, route) {
  cache.set(key, { route, timestamp: Date.now() });
}