/**
 * In-memory cache for search results and track info.
 * Reduces Lavalink load for repeated searches.
 */
import NodeCache from "node-cache";
import { config } from "../config.js";
import { logger } from "./logger.js";

const cache = new NodeCache({
  stdTTL: config.cache.ttl,
  maxKeys: config.cache.maxKeys,
  checkperiod: 60,
  useClones: false,
});

cache.on("expired", (key) => {
  logger.debug({ key }, "Cache entry expired");
});

/**
 * Get a cached value.
 */
export function cacheGet<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

/**
 * Store a value in the cache.
 * @param ttl Optional TTL in seconds; defaults to configured CACHE_TTL
 */
export function cacheSet<T>(key: string, value: T, ttl?: number): void {
  cache.set(key, value, ttl ?? config.cache.ttl);
}

/**
 * Delete a cache entry.
 */
export function cacheDel(key: string): void {
  cache.del(key);
}

/**
 * Build a consistent cache key for search queries.
 * Includes limit so different limits don't poison each other's cache.
 */
export function searchCacheKey(query: string, source: string, limit: number): string {
  return `search:${source}:${limit}:${query.toLowerCase().trim()}`;
}

/**
 * Get cache statistics for monitoring.
 */
export function getCacheStats() {
  const stats = cache.getStats();
  return {
    keys: cache.keys().length,
    hits: stats.hits,
    misses: stats.misses,
    ksize: stats.ksize,
    vsize: stats.vsize,
  };
}
