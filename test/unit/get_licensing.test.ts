/**
 * Unit tests for get_licensing tool
 * Tests license utilization tracking, formatting, and caching
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { KandjiClient } from '../../src/utils/client.js';
import { getLicensing } from '../../src/tools/get_licensing.js';
import { cache } from '../../src/utils/cache.js';

describe('getLicensing', () => {
  let client: KandjiClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  const mockLicensing = {
    total_licenses: 100,
    used_licenses: 75,
    available_licenses: 25,
    license_type: 'Enterprise',
    subscription_status: 'Active',
    expiration_date: '2025-12-31',
    license_tier: 'Premium',
  };

  beforeEach(() => {
    client = new KandjiClient({
      apiToken: 'test-token',
      subdomain: 'test',
      region: 'us',
    });
    mockFetch.mockClear();
    cache.clear();
  });

  describe('Basic Functionality', () => {
    it('should retrieve licensing information successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLicensing,
      } as Response);

      const result = await getLicensing(client);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should call correct API endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLicensing,
      } as Response);

      await getLicensing(client);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/licensing'),
        expect.any(Object)
      );
    });

    it('should return all licensing properties', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLicensing,
      } as Response);

      const result = await getLicensing(client);

      expect(result.data).toMatchObject({
        total_licenses: 100,
        used_licenses: 75,
        license_type: 'Enterprise',
      });
    });
  });

  describe('Summary Formatting', () => {
    it('should format summary with utilization percentage', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLicensing,
      } as Response);

      const result = await getLicensing(client);

      expect(result.summary).toContain('75/100');
      expect(result.summary).toContain('75.0%');
      expect(result.summary).toContain('25 available');
    });

    it('should calculate utilization correctly at 100%', async () => {
      const fullLicensing = { ...mockLicensing, used_licenses: 100 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => fullLicensing,
      } as Response);

      const result = await getLicensing(client);

      expect(result.summary).toContain('100/100');
      expect(result.summary).toContain('100.0%');
      expect(result.summary).toContain('0 available');
    });

    it('should calculate utilization correctly at 0%', async () => {
      const emptyLicensing = { ...mockLicensing, used_licenses: 0 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => emptyLicensing,
      } as Response);

      const result = await getLicensing(client);

      expect(result.summary).toContain('0/100');
      expect(result.summary).toContain('0.0%');
      expect(result.summary).toContain('100 available');
    });

    it('should handle zero total licenses gracefully', async () => {
      const zeroLicensing = { total_licenses: 0, used_licenses: 0 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => zeroLicensing,
      } as Response);

      const result = await getLicensing(client);

      expect(result.success).toBe(true);
      expect(result.summary).toContain('0.0%');
    });
  });

  describe('Table Formatting', () => {
    it('should format table with correct columns', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLicensing,
      } as Response);

      const result = await getLicensing(client);

      expect(result.table?.columns).toEqual(['Metric', 'Value']);
    });

    it('should include all license fields in table', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLicensing,
      } as Response);

      const result = await getLicensing(client);

      const rows = result.table?.rows || [];
      expect(rows).toContainEqual({ Metric: 'Total Licenses', Value: '100' });
      expect(rows).toContainEqual({ Metric: 'Used Licenses', Value: '75' });
      expect(rows).toContainEqual({ Metric: 'License Type', Value: 'Enterprise' });
    });

    it('should calculate and display available licenses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLicensing,
      } as Response);

      const result = await getLicensing(client);

      const rows = result.table?.rows || [];
      expect(rows).toContainEqual({ Metric: 'Available Licenses', Value: '25' });
    });

    it('should calculate and display utilization percentage', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLicensing,
      } as Response);

      const result = await getLicensing(client);

      const rows = result.table?.rows || [];
      expect(rows).toContainEqual({ Metric: 'Utilization', Value: '75.0%' });
    });

    it('should handle missing optional fields', async () => {
      const minimalLicensing = {
        total_licenses: 50,
        used_licenses: 30,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => minimalLicensing,
      } as Response);

      const result = await getLicensing(client);

      expect(result.success).toBe(true);
      const rows = result.table?.rows || [];
      expect(rows).toContainEqual({ Metric: 'Total Licenses', Value: '50' });
      expect(rows).toContainEqual({ Metric: 'Used Licenses', Value: '30' });
    });
  });

  describe('Caching Behavior', () => {
    it('should cache licensing info after first fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLicensing,
      } as Response);

      const result1 = await getLicensing(client);
      expect(result1.metadata?.cached).toBe(false);

      const result2 = await getLicensing(client);
      expect(result2.metadata?.cached).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should return same data from cache', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLicensing,
      } as Response);

      const result1 = await getLicensing(client);
      const result2 = await getLicensing(client);

      expect(result1.data).toEqual(result2.data);
    });

    it('should indicate cached data in summary', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLicensing,
      } as Response);

      await getLicensing(client);
      const result2 = await getLicensing(client);

      expect(result2.summary).toContain('from cache');
      expect(result2.metadata?.cached).toBe(true);
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

      const result = await getLicensing(client);

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

      const result = await getLicensing(client);

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('rate_limit');
      expect(result.errors![0].recovery.some(r => r.includes('Wait a moment'))).toBe(true);
    });

    it('should handle server error (500)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      } as Response);

      const result = await getLicensing(client);

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('server');
    });

    it('should handle not found error (404)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Endpoint not found' }),
      } as Response);

      const result = await getLicensing(client);

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('server');
      expect(result.errors![0].recovery.some(r => r.includes('licensing endpoint'))).toBe(true);
    });

    it('should include metadata in error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      } as Response);

      const result = await getLicensing(client);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.elapsedMs).toBeDefined();
      expect(result.metadata?.cached).toBe(false);
    });
  });

  describe('Metadata', () => {
    it('should include elapsed time', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLicensing,
      } as Response);

      const result = await getLicensing(client);

      expect(result.metadata?.elapsedMs).toBeDefined();
      expect(typeof result.metadata?.elapsedMs).toBe('number');
    });

    it('should include source information', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLicensing,
      } as Response);

      const result = await getLicensing(client);

      expect(result.metadata?.source).toBe('Iru API');
    });

    it('should include helpful suggestions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLicensing,
      } as Response);

      const result = await getLicensing(client);

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
      expect(result.suggestions).toContain('Check device list to identify inactive devices');
    });

    it('should include total count of 1', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLicensing,
      } as Response);

      const result = await getLicensing(client);

      expect(result.metadata?.totalCount).toBe(1);
    });
  });

  describe('Utilization Scenarios', () => {
    it('should handle 50% utilization', async () => {
      const halfUsed = { ...mockLicensing, total_licenses: 200, used_licenses: 100 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => halfUsed,
      } as Response);

      const result = await getLicensing(client);

      expect(result.summary).toContain('50.0%');
    });

    it('should handle 25% utilization', async () => {
      const quarterUsed = { ...mockLicensing, total_licenses: 100, used_licenses: 25 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => quarterUsed,
      } as Response);

      const result = await getLicensing(client);

      expect(result.summary).toContain('25.0%');
    });

    it('should handle high utilization (>90%)', async () => {
      const nearFull = { ...mockLicensing, total_licenses: 100, used_licenses: 95 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => nearFull,
      } as Response);

      const result = await getLicensing(client);

      expect(result.summary).toContain('95.0%');
      expect(result.summary).toContain('5 available');
    });

    it('should handle low utilization (<10%)', async () => {
      const nearEmpty = { ...mockLicensing, total_licenses: 1000, used_licenses: 50 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => nearEmpty,
      } as Response);

      const result = await getLicensing(client);

      expect(result.summary).toContain('5.0%');
      expect(result.summary).toContain('950 available');
    });
  });

  describe('Different Response Structures', () => {
    it('should handle response with unknown fields', async () => {
      const customLicensing = {
        total_licenses: 100,
        used_licenses: 50,
        custom_field: 'value',
        another_field: 123,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => customLicensing,
      } as Response);

      const result = await getLicensing(client);

      expect(result.success).toBe(true);
    });

    it('should handle response without standard structure', async () => {
      const weirdLicensing = {
        some_field: 'value',
        another_field: 'data',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => weirdLicensing,
      } as Response);

      const result = await getLicensing(client);

      expect(result.success).toBe(true);
      expect(result.summary).toContain('Retrieved licensing information');
    });

    it('should format unknown fields as generic table rows', async () => {
      const genericLicensing = {
        field1: 'value1',
        field2: 'value2',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => genericLicensing,
      } as Response);

      const result = await getLicensing(client);

      const rows = result.table?.rows || [];
      expect(rows).toContainEqual({ Metric: 'field1', Value: 'value1' });
      expect(rows).toContainEqual({ Metric: 'field2', Value: 'value2' });
    });
  });
});
