/**
 * TTL-based caching layer for Kandji API responses
 */

import { CacheEntry } from './types.js';

export class Cache {
  private store: Map<string, CacheEntry<unknown>>;

  constructor() {
    this.store = new Map();
  }

  /**
   * Set a cache entry with TTL in seconds
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000, // Convert to milliseconds
    };
    this.store.set(key, entry);
  }

  /**
   * Get a cache entry if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      // Entry has expired, remove it
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Invalidate a specific cache entry
   */
  invalidate(key: string): void {
    this.store.delete(key);
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        this.store.delete(key);
      }
    }
  }
}

// Default cache TTLs (in seconds)
export const CacheTTL = {
  DEVICES: parseInt(process.env.CACHE_TTL_DEVICES || '300', 10), // 5 minutes
  COMPLIANCE: parseInt(process.env.CACHE_TTL_COMPLIANCE || '120', 10), // 2 minutes
  BLUEPRINTS: parseInt(process.env.CACHE_TTL_BLUEPRINTS || '1800', 10), // 30 minutes
} as const;

// Singleton cache instance
export const cache = new Cache();

// Run cleanup every 5 minutes
setInterval(() => cache.cleanup(), 5 * 60 * 1000);
