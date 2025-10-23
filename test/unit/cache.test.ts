/**
 * Unit tests for Cache utility
 * Tests TTL-based caching, expiration, invalidation, and cleanup
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Cache, CacheTTL } from '../../src/utils/cache.js';

describe('Cache', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache();
  });

  describe('set and get', () => {
    it('should store and retrieve data', () => {
      const testData = { name: 'test', value: 123 };
      cache.set('test-key', testData, 60);

      const retrieved = cache.get<typeof testData>('test-key');
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent key', () => {
      const result = cache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should handle different data types', () => {
      cache.set('string', 'hello', 60);
      cache.set('number', 42, 60);
      cache.set('boolean', true, 60);
      cache.set('array', [1, 2, 3], 60);
      cache.set('object', { a: 1, b: 2 }, 60);

      expect(cache.get('string')).toBe('hello');
      expect(cache.get('number')).toBe(42);
      expect(cache.get('boolean')).toBe(true);
      expect(cache.get('array')).toEqual([1, 2, 3]);
      expect(cache.get('object')).toEqual({ a: 1, b: 2 });
    });
  });

  describe('TTL expiration', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return data before TTL expires', () => {
      cache.set('test', 'value', 10); // 10 seconds TTL

      jest.advanceTimersByTime(5000); // 5 seconds
      expect(cache.get('test')).toBe('value');
    });

    it('should return null after TTL expires', () => {
      cache.set('test', 'value', 10); // 10 seconds TTL

      jest.advanceTimersByTime(11000); // 11 seconds
      expect(cache.get('test')).toBeNull();
    });

    it('should remove expired entry from store', () => {
      cache.set('test', 'value', 10);

      jest.advanceTimersByTime(11000);
      cache.get('test');

      const stats = cache.stats();
      expect(stats.size).toBe(0);
    });
  });

  describe('has', () => {
    it('should return true for existing non-expired key', () => {
      cache.set('test', 'value', 60);
      expect(cache.has('test')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(cache.has('non-existent')).toBe(false);
    });

    it('should return false for expired key', () => {
      jest.useFakeTimers();
      cache.set('test', 'value', 10);
      jest.advanceTimersByTime(11000);
      expect(cache.has('test')).toBe(false);
      jest.useRealTimers();
    });
  });

  describe('invalidate', () => {
    it('should remove specific key', () => {
      cache.set('key1', 'value1', 60);
      cache.set('key2', 'value2', 60);

      cache.invalidate('key1');

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
    });

    it('should not throw on non-existent key', () => {
      expect(() => cache.invalidate('non-existent')).not.toThrow();
    });
  });

  describe('invalidatePattern', () => {
    it('should remove keys matching pattern', () => {
      cache.set('device:123', 'value1', 60);
      cache.set('device:456', 'value2', 60);
      cache.set('blueprint:789', 'value3', 60);

      cache.invalidatePattern('^device:');

      expect(cache.get('device:123')).toBeNull();
      expect(cache.get('device:456')).toBeNull();
      expect(cache.get('blueprint:789')).toBe('value3');
    });

    it('should handle complex regex patterns', () => {
      cache.set('device-activity:123:default:0', 'value1', 60);
      cache.set('device-activity:123:50:10', 'value2', 60);
      cache.set('device-apps:123', 'value3', 60);

      cache.invalidatePattern('device-activity:123:');

      expect(cache.get('device-activity:123:default:0')).toBeNull();
      expect(cache.get('device-activity:123:50:10')).toBeNull();
      expect(cache.get('device-apps:123')).toBe('value3');
    });

    it('should not throw on pattern with no matches', () => {
      cache.set('test', 'value', 60);
      expect(() => cache.invalidatePattern('nomatch')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('key1', 'value1', 60);
      cache.set('key2', 'value2', 60);
      cache.set('key3', 'value3', 60);

      cache.clear();

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeNull();
      expect(cache.stats().size).toBe(0);
    });
  });

  describe('stats', () => {
    it('should return correct size and keys', () => {
      cache.set('key1', 'value1', 60);
      cache.set('key2', 'value2', 60);
      cache.set('key3', 'value3', 60);

      const stats = cache.stats();

      expect(stats.size).toBe(3);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
      expect(stats.keys).toContain('key3');
    });

    it('should return empty stats for empty cache', () => {
      const stats = cache.stats();
      expect(stats.size).toBe(0);
      expect(stats.keys).toEqual([]);
    });
  });

  describe('cleanup', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should remove expired entries', () => {
      cache.set('short-ttl', 'value1', 10); // 10 seconds
      cache.set('long-ttl', 'value2', 100); // 100 seconds

      jest.advanceTimersByTime(15000); // 15 seconds
      cache.cleanup();

      expect(cache.get('short-ttl')).toBeNull();
      expect(cache.get('long-ttl')).toBe('value2');
    });

    it('should not remove non-expired entries', () => {
      cache.set('key1', 'value1', 60);
      cache.set('key2', 'value2', 60);

      cache.cleanup();

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBe('value2');
    });

    it('should handle empty cache', () => {
      expect(() => cache.cleanup()).not.toThrow();
    });
  });
});

describe('CacheTTL', () => {
  it('should have correct default TTL values', () => {
    expect(CacheTTL.DEVICES).toBe(300); // 5 minutes
    expect(CacheTTL.COMPLIANCE).toBe(120); // 2 minutes
    expect(CacheTTL.BLUEPRINTS).toBe(1800); // 30 minutes
  });
});
