/**
 * Unit tests for search_devices_by_criteria tool
 * Tests filtering, caching, and search logic
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { KandjiClient } from '../../src/utils/client.js';
import { cache } from '../../src/utils/cache.js';
import { searchDevicesByCriteria } from '../../src/tools/search_devices_by_criteria.js';

describe('searchDevicesByCriteria', () => {
  let client: KandjiClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  const mockDevices = [
    {
      device_id: '550e8400-e29b-41d4-a716-446655440001',
      device_name: 'John-MacBook-Pro',
      serial_number: 'C02ABC123',
      platform: 'Mac' as const,
      os_version: '14.0',
      model: 'MacBook Pro',
      user_email: 'john@example.com',
      blueprint_id: 'blueprint-001',
      blueprint_name: 'Engineering',
    },
    {
      device_id: '550e8400-e29b-41d4-a716-446655440002',
      device_name: 'Jane-iPhone',
      serial_number: 'DNPXYZ789',
      platform: 'iPhone' as const,
      os_version: '17.0',
      model: 'iPhone 15 Pro',
      user_email: 'jane@example.com',
      blueprint_id: 'blueprint-002',
      blueprint_name: 'Sales',
    },
    {
      device_id: '550e8400-e29b-41d4-a716-446655440003',
      device_name: 'Bob-iPad',
      serial_number: 'DMPW456',
      platform: 'iPad' as const,
      os_version: '17.1',
      model: 'iPad Pro',
      user_email: 'bob@example.com',
      blueprint_id: 'blueprint-001',
      blueprint_name: 'Engineering',
    },
    {
      device_id: '550e8400-e29b-41d4-a716-446655440004',
      device_name: 'Conference-AppleTV',
      serial_number: 'TVPQ123',
      platform: 'AppleTV' as const,
      os_version: '17.0',
      model: 'Apple TV 4K',
      blueprint_id: 'blueprint-003',
      blueprint_name: 'Facilities',
    },
  ];

  beforeEach(() => {
    client = new KandjiClient({
      apiToken: 'test-token',
      subdomain: 'test',
      region: 'us',
      enablePIIRedaction: false,
    });
    cache.clear();
    mockFetch.mockClear();
  });

  describe('Single Criteria Filtering', () => {
    it('should filter by device name (partial match)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await searchDevicesByCriteria(client, { name: 'MacBook' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].device_name).toBe('John-MacBook-Pro');
      expect(result.metadata?.totalCount).toBe(1);
    });

    it('should filter by platform (Mac)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices.filter(d => d.platform === 'Mac'),
      } as Response);

      const result = await searchDevicesByCriteria(client, { platform: 'Mac' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].platform).toBe('Mac');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('platform=Mac'),
        expect.any(Object)
      );
    });

    it('should filter by platform (iPhone)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices.filter(d => d.platform === 'iPhone'),
      } as Response);

      const result = await searchDevicesByCriteria(client, { platform: 'iPhone' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].platform).toBe('iPhone');
    });

    it('should filter by platform (iPad)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices.filter(d => d.platform === 'iPad'),
      } as Response);

      const result = await searchDevicesByCriteria(client, { platform: 'iPad' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].platform).toBe('iPad');
    });

    it('should filter by platform (AppleTV)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices.filter(d => d.platform === 'AppleTV'),
      } as Response);

      const result = await searchDevicesByCriteria(client, { platform: 'AppleTV' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].platform).toBe('AppleTV');
    });

    it('should filter by blueprint_id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices.filter(d => d.blueprint_id === 'blueprint-001'),
      } as Response);

      const result = await searchDevicesByCriteria(client, {
        blueprint_id: 'blueprint-001',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data!.every(d => d.blueprint_id === 'blueprint-001')).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('blueprint_id=blueprint-001'),
        expect.any(Object)
      );
    });
  });

  describe('Combined Criteria Filtering', () => {
    it('should filter by name AND platform', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices.filter(d => d.platform === 'Mac'),
      } as Response);

      const result = await searchDevicesByCriteria(client, {
        name: 'MacBook',
        platform: 'Mac',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].device_name).toBe('John-MacBook-Pro');
      expect(result.data![0].platform).toBe('Mac');
    });

    it('should filter by name AND blueprint_id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices.filter(d => d.blueprint_id === 'blueprint-001'),
      } as Response);

      const result = await searchDevicesByCriteria(client, {
        name: 'iPad',
        blueprint_id: 'blueprint-001',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].device_name).toBe('Bob-iPad');
      expect(result.data![0].blueprint_id).toBe('blueprint-001');
    });

    it('should filter by platform AND blueprint_id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () =>
          mockDevices.filter(d => d.platform === 'iPad' && d.blueprint_id === 'blueprint-001'),
      } as Response);

      const result = await searchDevicesByCriteria(client, {
        platform: 'iPad',
        blueprint_id: 'blueprint-001',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].platform).toBe('iPad');
      expect(result.data![0].blueprint_id).toBe('blueprint-001');
    });

    it('should filter by name AND platform AND blueprint_id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () =>
          mockDevices.filter(d => d.platform === 'iPad' && d.blueprint_id === 'blueprint-001'),
      } as Response);

      const result = await searchDevicesByCriteria(client, {
        name: 'Bob',
        platform: 'iPad',
        blueprint_id: 'blueprint-001',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].device_name).toBe('Bob-iPad');
    });
  });

  describe('Case Sensitivity', () => {
    it('should perform case-insensitive name search (lowercase query)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await searchDevicesByCriteria(client, { name: 'macbook' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].device_name).toBe('John-MacBook-Pro');
    });

    it('should perform case-insensitive name search (uppercase query)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await searchDevicesByCriteria(client, { name: 'IPHONE' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].device_name).toBe('Jane-iPhone');
    });

    it('should perform case-insensitive name search (mixed case)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await searchDevicesByCriteria(client, { name: 'ApPlEtV' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].platform).toBe('AppleTV');
    });
  });

  describe('Edge Cases', () => {
    it('should handle no matches', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await searchDevicesByCriteria(client, {
        name: 'NonExistentDevice',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.summary).toContain('Found 0 device(s)');
      expect(result.table?.rows).toHaveLength(0);
    });

    it('should handle no criteria (return all devices)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await searchDevicesByCriteria(client, {});

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(4);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.api.kandji.io/api/v1/devices',
        expect.any(Object)
      );
    });

    it('should handle empty device list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      const result = await searchDevicesByCriteria(client, { platform: 'Mac' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.metadata?.totalCount).toBe(0);
    });

    it('should handle device without user_email', async () => {
      const deviceWithoutEmail = { ...mockDevices[3], user_email: undefined };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [deviceWithoutEmail],
      } as Response);

      const result = await searchDevicesByCriteria(client, { platform: 'AppleTV' });

      expect(result.success).toBe(true);
      expect(result.table?.rows[0].User).toBe('N/A');
    });

    it('should handle partial name match at beginning of string', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await searchDevicesByCriteria(client, { name: 'John' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].device_name).toContain('John');
    });

    it('should handle partial name match in middle of string', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await searchDevicesByCriteria(client, { name: 'Book' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].device_name).toContain('Book');
    });

    it('should handle partial name match at end of string', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await searchDevicesByCriteria(client, { name: 'Pro' });

      expect(result.success).toBe(true);
      expect(result.data!.length).toBeGreaterThan(0);
      expect(result.data!.some(d => d.device_name.includes('Pro'))).toBe(true);
    });
  });

  describe('Caching Behavior', () => {
    it('should cache search results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result1 = await searchDevicesByCriteria(client, { name: 'MacBook' });

      expect(result1.success).toBe(true);
      expect(result1.metadata?.cached).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await searchDevicesByCriteria(client, { name: 'MacBook' });

      expect(result2.success).toBe(true);
      expect(result2.metadata?.cached).toBe(true);
      expect(result2.summary).toContain('from cache');
      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional API call
    });

    it('should use different cache keys for different criteria', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      // First search
      await searchDevicesByCriteria(client, { name: 'MacBook' });
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Different search should not use cache
      await searchDevicesByCriteria(client, { name: 'iPhone' });
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Original search should use cache
      const result = await searchDevicesByCriteria(client, { name: 'MacBook' });
      expect(result.metadata?.cached).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2); // No new call
    });

    it('should generate consistent cache keys for same criteria', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      await searchDevicesByCriteria(client, {
        name: 'MacBook',
        platform: 'Mac',
      });

      const result = await searchDevicesByCriteria(client, {
        name: 'MacBook',
        platform: 'Mac',
      });

      expect(result.metadata?.cached).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not cache failed searches', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      } as Response);

      const result1 = await searchDevicesByCriteria(client, { name: 'test' });
      expect(result1.success).toBe(false);

      const result2 = await searchDevicesByCriteria(client, { name: 'test' });
      expect(result2.success).toBe(false);

      expect(mockFetch).toHaveBeenCalledTimes(2); // Called twice, not cached
    });
  });

  describe('Response Format', () => {
    it('should return valid MCP response envelope', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await searchDevicesByCriteria(client, { platform: 'Mac' });

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('table');
      expect(result.table).toHaveProperty('columns');
      expect(result.table).toHaveProperty('rows');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('totalCount');
      expect(result.metadata).toHaveProperty('elapsedMs');
      expect(result.metadata).toHaveProperty('cached');
      expect(result.metadata).toHaveProperty('source', 'Iru API');
      expect(result).toHaveProperty('suggestions');
    });

    it('should format table with correct columns', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockDevices[0]],
      } as Response);

      const result = await searchDevicesByCriteria(client, { name: 'MacBook' });

      expect(result.table?.columns).toEqual([
        'Device Name',
        'Platform',
        'OS Version',
        'Serial Number',
        'User',
      ]);
    });

    it('should format table rows correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockDevices[0]],
      } as Response);

      const result = await searchDevicesByCriteria(client, { name: 'MacBook' });

      expect(result.table?.rows[0]).toEqual({
        'Device Name': 'John-MacBook-Pro',
        Platform: 'Mac',
        'OS Version': '14.0',
        'Serial Number': 'C02ABC123',
        User: 'john@example.com',
      });
    });

    it('should include helpful suggestions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await searchDevicesByCriteria(client, { platform: 'Mac' });

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
      expect(result.suggestions).toContain(
        'Get details for a specific device using get_device_details'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication error (401)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Authentication failed' }),
      } as Response);

      const result = await searchDevicesByCriteria(client, { platform: 'Mac' });

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('auth');
      expect(result.errors![0].recovery.some(r => r.includes('KANDJI_API_TOKEN'))).toBe(true);
    });

    it('should handle rate limit error (429)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: 'Rate limit exceeded' }),
      } as Response);

      const result = await searchDevicesByCriteria(client, { platform: 'Mac' });

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('rate_limit');
      expect(result.errors![0].recovery.some(r => r.includes('Wait a moment'))).toBe(true);
    });

    it('should handle invalid platform value', async () => {
      const result = await searchDevicesByCriteria(client, {
        platform: 'InvalidPlatform' as any,
      });

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('validation');
    });

    it('should handle server error (500)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      } as Response);

      const result = await searchDevicesByCriteria(client, { platform: 'Mac' });

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('server');
      expect(result.errors![0].recovery.some(r => r.includes('Iru API status'))).toBe(true);
    });

    it('should include metadata in error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      } as Response);

      const result = await searchDevicesByCriteria(client, { platform: 'Mac' });

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.elapsedMs).toBeDefined();
      expect(result.metadata?.cached).toBe(false);
      expect(result.metadata?.source).toBe('Iru API');
    });
  });
});
