/**
 * Unit tests for list_blueprints tool
 * Tests blueprint listing, caching, and enrollment code status
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { KandjiClient } from '../../src/utils/client.js';
import { listBlueprints } from '../../src/tools/list_blueprints.js';
import { cache } from '../../src/utils/cache.js';

describe('listBlueprints', () => {
  let client: KandjiClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  const mockBlueprints = [
    {
      id: 'blueprint-123',
      name: 'Standard Mac Configuration',
      enrollment_code_is_active: true,
      enrollment_code: 'ABC123',
    },
    {
      id: 'blueprint-456',
      name: 'Developer Workstation',
      enrollment_code_is_active: true,
      enrollment_code: 'DEV456',
    },
    {
      id: 'blueprint-789',
      name: 'Legacy Setup (Inactive)',
      enrollment_code_is_active: false,
      enrollment_code: null,
    },
  ];

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
    it('should list all blueprints successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlueprints,
      } as Response);

      const result = await listBlueprints(client);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
    });

    it('should call correct API endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlueprints,
      } as Response);

      await listBlueprints(client);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/blueprints'),
        expect.any(Object)
      );
    });

    it('should return all blueprint properties', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlueprints,
      } as Response);

      const result = await listBlueprints(client);

      expect(result.data![0]).toMatchObject({
        id: 'blueprint-123',
        name: 'Standard Mac Configuration',
        enrollment_code_is_active: true,
      });
    });
  });

  describe('Summary and Table Formatting', () => {
    it('should format summary with blueprint count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlueprints,
      } as Response);

      const result = await listBlueprints(client);

      expect(result.summary).toContain('Found 3 blueprint(s)');
    });

    it('should format table with correct columns', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlueprints,
      } as Response);

      const result = await listBlueprints(client);

      expect(result.table?.columns).toEqual(['Blueprint Name', 'ID', 'Enrollment Active']);
    });

    it('should format table rows correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlueprints,
      } as Response);

      const result = await listBlueprints(client);

      expect(result.table?.rows[0]).toEqual({
        'Blueprint Name': 'Standard Mac Configuration',
        ID: 'blueprint-123',
        'Enrollment Active': 'Yes',
      });
    });

    it('should display enrollment status as Yes/No', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlueprints,
      } as Response);

      const result = await listBlueprints(client);

      const rows = result.table?.rows || [];
      expect(rows[0]['Enrollment Active']).toBe('Yes');
      expect(rows[2]['Enrollment Active']).toBe('No');
    });
  });

  describe('Caching Behavior', () => {
    it('should cache blueprints after first fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlueprints,
      } as Response);

      const result1 = await listBlueprints(client);
      expect(result1.metadata?.cached).toBe(false);

      const result2 = await listBlueprints(client);
      expect(result2.metadata?.cached).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should return same data from cache', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlueprints,
      } as Response);

      const result1 = await listBlueprints(client);
      const result2 = await listBlueprints(client);

      expect(result1.data).toEqual(result2.data);
    });

    it('should indicate cached data in summary', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlueprints,
      } as Response);

      await listBlueprints(client);
      const result2 = await listBlueprints(client);

      expect(result2.summary).toContain('from cache');
      expect(result2.metadata?.cached).toBe(true);
    });
  });

  describe('Empty Results', () => {
    it('should handle zero blueprints', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      const result = await listBlueprints(client);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.summary).toContain('Found 0 blueprint(s)');
    });

    it('should have empty table rows for zero results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      const result = await listBlueprints(client);

      expect(result.table?.rows).toHaveLength(0);
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

      const result = await listBlueprints(client);

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

      const result = await listBlueprints(client);

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

      const result = await listBlueprints(client);

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('server');
    });

    it('should include metadata in error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      } as Response);

      const result = await listBlueprints(client);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.elapsedMs).toBeDefined();
      expect(result.metadata?.cached).toBe(false);
    });
  });

  describe('Metadata', () => {
    it('should include total count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlueprints,
      } as Response);

      const result = await listBlueprints(client);

      expect(result.metadata?.totalCount).toBe(3);
    });

    it('should include elapsed time', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlueprints,
      } as Response);

      const result = await listBlueprints(client);

      expect(result.metadata?.elapsedMs).toBeDefined();
      expect(typeof result.metadata?.elapsedMs).toBe('number');
    });

    it('should include source information', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlueprints,
      } as Response);

      const result = await listBlueprints(client);

      expect(result.metadata?.source).toBe('Kandji API');
    });

    it('should include helpful suggestions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlueprints,
      } as Response);

      const result = await listBlueprints(client);

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
      expect(result.suggestions).toContain('Get detailed blueprint info with blueprint ID');
    });
  });

  describe('Blueprint Scenarios', () => {
    it('should handle single blueprint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockBlueprints[0]],
      } as Response);

      const result = await listBlueprints(client);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.summary).toContain('Found 1 blueprint(s)');
    });

    it('should handle many blueprints', async () => {
      const manyBlueprints = Array.from({ length: 50 }, (_, i) => ({
        id: `blueprint-${i}`,
        name: `Blueprint ${i}`,
        enrollment_code_is_active: i % 2 === 0,
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => manyBlueprints,
      } as Response);

      const result = await listBlueprints(client);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(50);
      expect(result.metadata?.totalCount).toBe(50);
    });

    it('should handle blueprints with all active enrollment codes', async () => {
      const activeBlueprints = mockBlueprints.filter(b => b.enrollment_code_is_active);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => activeBlueprints,
      } as Response);

      const result = await listBlueprints(client);

      const rows = result.table?.rows || [];
      expect(rows.every(r => r['Enrollment Active'] === 'Yes')).toBe(true);
    });

    it('should handle blueprints with all inactive enrollment codes', async () => {
      const inactiveBlueprints = [
        { ...mockBlueprints[0], enrollment_code_is_active: false },
        { ...mockBlueprints[1], enrollment_code_is_active: false },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => inactiveBlueprints,
      } as Response);

      const result = await listBlueprints(client);

      const rows = result.table?.rows || [];
      expect(rows.every(r => r['Enrollment Active'] === 'No')).toBe(true);
    });
  });
});
