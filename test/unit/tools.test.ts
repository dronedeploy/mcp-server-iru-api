/**
 * Unit tests for MCP tools
 * Tests response envelope validation, error handling, and caching
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { KandjiClient } from '../../src/utils/client.js';
import { cache } from '../../src/utils/cache.js';
import { getDeviceActivity } from '../../src/tools/get_device_activity.js';
import { getDeviceApps } from '../../src/tools/get_device_apps.js';
import { getDeviceLibraryItems } from '../../src/tools/get_device_library_items.js';
import { getDeviceLostModeDetails } from '../../src/tools/get_device_lost_mode_details.js';
import { getDeviceParameters } from '../../src/tools/get_device_parameters.js';
import { getDeviceStatus } from '../../src/tools/get_device_status.js';
import { listAuditEvents } from '../../src/tools/list_audit_events.js';

describe('MCP Tools - Response Envelope Validation', () => {
  let client: KandjiClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

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

  describe('Response Envelope Structure', () => {
    it('should return valid envelope on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { timestamp: '2024-01-01', event_type: 'enrollment', description: 'Device enrolled' },
        ],
      } as Response);

      const result = await getDeviceActivity(client, { device_id: '550e8400-e29b-41d4-a716-446655440000' });

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('table');
      expect(result.table).toHaveProperty('columns');
      expect(result.table).toHaveProperty('rows');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('elapsedMs');
      expect(result.metadata).toHaveProperty('cached');
      expect(result.metadata).toHaveProperty('source', 'Kandji API');
      expect(result).toHaveProperty('suggestions');
      expect(result.suggestions).toBeInstanceOf(Array);
    });

    it('should return valid error envelope on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Device not found' }),
      } as Response);

      const result = await getDeviceActivity(client, { device_id: '550e8400-e29b-41d4-a716-446655440000' });

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('errors');
      expect(result.errors).toBeInstanceOf(Array);
      expect(result.errors![0]).toHaveProperty('category');
      expect(result.errors![0]).toHaveProperty('message');
      expect(result.errors![0]).toHaveProperty('recovery');
      expect(result.metadata).toHaveProperty('elapsedMs');
      expect(result.metadata).toHaveProperty('cached', false);
    });
  });

  describe('Error Categorization', () => {
    it('should categorize authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Authentication failed' }),
      } as Response);

      const result = await getDeviceApps(client, { device_id: '550e8400-e29b-41d4-a716-446655440000' });

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('auth');
      expect(result.errors![0].recovery).toContain('Verify KANDJI_API_TOKEN in .env file');
    });

    it('should categorize rate limit errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: 'Rate limit exceeded' }),
      } as Response);

      const result = await getDeviceApps(client, { device_id: '550e8400-e29b-41d4-a716-446655440000' });

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('rate_limit');
      expect(result.errors![0].recovery).toContain('Wait a moment and retry');
    });

    it('should categorize validation errors', async () => {
      const result = await getDeviceActivity(client, { device_id: 'invalid-uuid' } as any);

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('validation');
      expect(result.errors![0].recovery[0]).toContain('Provide a valid device UUID');
    });

    it('should categorize not found errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Device not found' }),
      } as Response);

      const result = await getDeviceLibraryItems(client, { device_id: '550e8400-e29b-41d4-a716-446655440000' });

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('validation');
      expect(result.errors![0].message).toContain('not found');
    });

    it('should categorize server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      } as Response);

      const result = await getDeviceStatus(client, { device_id: '550e8400-e29b-41d4-a716-446655440000' });

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('server');
    });
  });

  describe('Caching Behavior', () => {
    it('should cache successful responses', async () => {
      const mockData = [{ name: 'Chrome', version: '120.0', bundle_id: 'com.google.Chrome' }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      // First call - should fetch
      const result1 = await getDeviceApps(client, { device_id: '550e8400-e29b-41d4-a716-446655440000' });
      expect(result1.metadata?.cached).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await getDeviceApps(client, { device_id: '550e8400-e29b-41d4-a716-446655440000' });
      expect(result2.metadata?.cached).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional fetch
    });

    it('should not cache failed responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Not found' }),
      } as Response);

      // First call - should fetch and fail
      const result1 = await getDeviceParameters(client, { device_id: '550e8400-e29b-41d4-a716-446655440000' });
      expect(result1.success).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call - should fetch again (not cached)
      const result2 = await getDeviceParameters(client, { device_id: '550e8400-e29b-41d4-a716-446655440000' });
      expect(result2.success).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});

describe('getDeviceActivity', () => {
  let client: KandjiClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    client = new KandjiClient({
      apiToken: 'test-token',
      subdomain: 'test',
      region: 'us',
    });
    cache.clear();
    mockFetch.mockClear();
  });

  it('should return activity records', async () => {
    const mockActivity = [
      { timestamp: '2024-01-01T10:00:00Z', event_type: 'enrollment', description: 'Device enrolled' },
      { timestamp: '2024-01-02T11:00:00Z', event_type: 'checkin', description: 'Device checked in' },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockActivity,
    } as Response);

    const result = await getDeviceActivity(client, { device_id: '550e8400-e29b-41d4-a716-446655440000' });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockActivity);
    expect(result.metadata?.totalCount).toBe(2);
  });

  it('should support pagination parameters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    await getDeviceActivity(client, {
      device_id: '550e8400-e29b-41d4-a716-446655440000',
      limit: 50,
      offset: 100,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('limit=50'),
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('offset=100'),
      expect.any(Object)
    );
  });
});

describe('getDeviceLostModeDetails', () => {
  let client: KandjiClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    client = new KandjiClient({
      apiToken: 'test-token',
      subdomain: 'test',
      region: 'us',
    });
    cache.clear();
    mockFetch.mockClear();
  });

  it('should return lost mode details when enabled', async () => {
    const mockLostMode = {
      enabled: true,
      message: 'Lost device',
      phone_number: '+1234567890',
      footnote: 'Please call to return',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLostMode,
    } as Response);

    const result = await getDeviceLostModeDetails(client, { device_id: '550e8400-e29b-41d4-a716-446655440000' });

    expect(result.success).toBe(true);
    expect(result.summary).toContain('enabled');
    expect(result.data).toEqual(mockLostMode);
  });

  it('should return lost mode details when disabled', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ enabled: false }),
    } as Response);

    const result = await getDeviceLostModeDetails(client, { device_id: '550e8400-e29b-41d4-a716-446655440000' });

    expect(result.success).toBe(true);
    expect(result.summary).toContain('disabled');
  });
});

describe('listAuditEvents', () => {
  let client: KandjiClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    client = new KandjiClient({
      apiToken: 'test-token',
      subdomain: 'test',
      region: 'us',
    });
    cache.clear();
    mockFetch.mockClear();
  });

  it('should return audit events with pagination', async () => {
    const mockResponse = {
      results: [
        { id: '1', occurred_at: '2024-01-01T10:00:00Z', event_type: 'device.enrolled', user: 'admin@example.com' },
        { id: '2', occurred_at: '2024-01-02T11:00:00Z', event_type: 'blueprint.updated', user: 'admin@example.com' },
      ],
      count: 2,
      next: null,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await listAuditEvents(client, { limit: 100, sort_by: '-occurred_at' });

    expect(result.success).toBe(true);
    expect(result.data?.results).toHaveLength(2);
    expect(result.metadata?.totalCount).toBe(2);
  });

  it('should support date filtering', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [], count: 0 }),
    } as Response);

    await listAuditEvents(client, {
      start_date: '2024-01-01',
      end_date: '2024-12-31',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('start_date=2024-01-01'),
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('end_date=2024-12-31'),
      expect.any(Object)
    );
  });

  it('should handle cursor-based pagination', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [], count: 0, next: 'cursor123' }),
    } as Response);

    const result = await listAuditEvents(client, { cursor: 'cursor123' });

    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('cursor=cursor123'),
      expect.any(Object)
    );
  });
});
