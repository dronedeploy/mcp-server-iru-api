/**
 * Unit tests for list_audit_events tool
 * Tests audit log retrieval, filtering, pagination, and script generation
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { KandjiClient } from '../../src/utils/client.js';
import { listAuditEvents } from '../../src/tools/list_audit_events.js';
import { cache } from '../../src/utils/cache.js';

describe('listAuditEvents', () => {
  let client: KandjiClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  const mockEventsResponse = {
    results: [
      {
        occurred_at: '2024-01-15T10:00:00Z',
        event_type: 'device.enrolled',
        user: 'admin@test.com',
        user_email: 'admin@test.com',
        description: 'Device enrolled into Kandji',
      },
      {
        occurred_at: '2024-01-15T09:00:00Z',
        event_type: 'library_item.updated',
        user: 'tech@test.com',
        user_email: 'tech@test.com',
        description: 'Security profile updated',
      },
    ],
    count: 2,
    next: null,
    previous: null,
  };

  beforeEach(() => {
    client = new KandjiClient({
      apiToken: 'test-token',
      subdomain: 'test',
      region: 'us',
    });
    mockFetch.mockClear();
    cache.clear();
    delete process.env.KANDJI_API_TOKEN;
    delete process.env.KANDJI_SUBDOMAIN;
    delete process.env.KANDJI_REGION;
  });

  afterEach(() => {
    delete process.env.KANDJI_API_TOKEN;
    delete process.env.KANDJI_SUBDOMAIN;
    delete process.env.KANDJI_REGION;
  });

  describe('Basic Functionality', () => {
    it('should list audit events successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEventsResponse,
      } as Response);

      const result = await listAuditEvents(client, {});

      expect(result.success).toBe(true);
      expect(result.data?.results).toHaveLength(2);
    });

    it('should call correct API endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEventsResponse,
      } as Response);

      await listAuditEvents(client, {});

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/audit/events'),
        expect.any(Object)
      );
    });

    it('should return valid MCP response envelope', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEventsResponse,
      } as Response);

      const result = await listAuditEvents(client, {});

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('table');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('suggestions');
    });
  });

  describe('Filtering and Pagination', () => {
    it('should support limit parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEventsResponse,
      } as Response);

      await listAuditEvents(client, { limit: 100 });

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should support sort_by parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEventsResponse,
      } as Response);

      await listAuditEvents(client, { sort_by: '-occurred_at' });

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should support start_date parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEventsResponse,
      } as Response);

      await listAuditEvents(client, { start_date: '2024-01-01' });

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should support end_date parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEventsResponse,
      } as Response);

      await listAuditEvents(client, { end_date: '2024-12-31' });

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should support cursor parameter for pagination', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEventsResponse,
      } as Response);

      await listAuditEvents(client, { cursor: 'next-page-cursor' });

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should support multiple filters combined', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEventsResponse,
      } as Response);

      await listAuditEvents(client, {
        limit: 200,
        sort_by: '-occurred_at',
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      });

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Table Formatting', () => {
    it('should format table with correct columns', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEventsResponse,
      } as Response);

      const result = await listAuditEvents(client, {});

      expect(result.table?.columns).toEqual(['Occurred At', 'Event Type', 'User', 'Description']);
    });

    it('should format table rows correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEventsResponse,
      } as Response);

      const result = await listAuditEvents(client, {});

      expect(result.table?.rows[0]).toEqual({
        'Occurred At': '2024-01-15T10:00:00Z',
        'Event Type': 'device.enrolled',
        User: 'admin@test.com',
        Description: 'Device enrolled into Kandji',
      });
    });

    it('should show first 20 events in table', async () => {
      const manyEvents = {
        results: Array.from({ length: 50 }, (_, i) => ({
          occurred_at: `2024-01-01T${String(i).padStart(2, '0')}:00:00Z`,
          event_type: 'event.type',
          user: 'user@test.com',
          description: `Event ${i}`,
        })),
        count: 50,
        next: null,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => manyEvents,
      } as Response);

      const result = await listAuditEvents(client, {});

      expect(result.table?.rows).toHaveLength(20);
      expect(result.data?.results).toHaveLength(50);
    });

    it('should handle missing user with user_email fallback', async () => {
      const eventWithEmail = {
        results: [
          {
            occurred_at: '2024-01-01T10:00:00Z',
            event_type: 'test',
            user: undefined,
            user_email: 'fallback@test.com',
            description: 'Test',
          },
        ],
        count: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => eventWithEmail,
      } as Response);

      const result = await listAuditEvents(client, {});

      expect(result.table?.rows[0].User).toBe('fallback@test.com');
    });

    it('should handle missing fields with N/A', async () => {
      const incompleteEvent = {
        results: [
          {
            occurred_at: undefined,
            event_type: undefined,
            user: undefined,
            user_email: undefined,
            description: undefined,
          },
        ],
        count: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => incompleteEvent,
      } as Response);

      const result = await listAuditEvents(client, {});

      const row = result.table?.rows[0];
      expect(row?.['Occurred At']).toBe('N/A');
      expect(row?.['Event Type']).toBe('N/A');
      expect(row?.['User']).toBe('N/A');
      expect(row?.['Description']).toBe('N/A');
    });
  });

  describe('Caching Behavior', () => {
    it('should cache audit events', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEventsResponse,
      } as Response);

      const result1 = await listAuditEvents(client, {});
      const result2 = await listAuditEvents(client, {});

      expect(result1.metadata?.cached).toBe(false);
      expect(result2.metadata?.cached).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should use unique cache keys for different parameters', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEventsResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEventsResponse,
        } as Response);

      await listAuditEvents(client, { limit: 100 });
      await listAuditEvents(client, { limit: 200 });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Pagination Suggestions', () => {
    it('should suggest cursor pagination when next exists', async () => {
      const responseWithNext = {
        ...mockEventsResponse,
        next: 'next-cursor-token',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithNext,
      } as Response);

      const result = await listAuditEvents(client, {});

      expect(result.suggestions?.some(s => s.includes('cursor'))).toBe(true);
    });

    it('should indicate all events retrieved when no next', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEventsResponse,
      } as Response);

      const result = await listAuditEvents(client, {});

      expect(result.suggestions?.some(s => s.includes('All events retrieved'))).toBe(true);
    });
  });

  describe('Script Generation', () => {
    it('should generate script when hitting limit with env vars set', async () => {
      process.env.KANDJI_API_TOKEN = 'test-token';
      process.env.KANDJI_SUBDOMAIN = 'test';
      process.env.KANDJI_REGION = 'us';

      const largeResponse = {
        results: Array.from({ length: 500 }, (_, i) => ({
          occurred_at: '2024-01-01T10:00:00Z',
          event_type: 'test',
          user: 'user@test.com',
          description: `Event ${i}`,
        })),
        count: 1000,
        next: 'next-cursor',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => largeResponse,
      } as Response);

      const result = await listAuditEvents(client, { limit: 500 });

      expect(result.script).toBeDefined();
      expect(result.script).toContain('#!/bin/bash');
      expect(result.script).toContain('audit');
    });

    it('should include date filters in script', async () => {
      process.env.KANDJI_API_TOKEN = 'test-token';
      process.env.KANDJI_SUBDOMAIN = 'test';
      process.env.KANDJI_REGION = 'us';

      const largeResponse = {
        results: Array.from({ length: 500 }, () => ({
          occurred_at: '2024-01-01T10:00:00Z',
          event_type: 'test',
          user: 'user@test.com',
          description: 'Event',
        })),
        count: 1000,
        next: 'next-cursor',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => largeResponse,
      } as Response);

      const result = await listAuditEvents(client, {
        limit: 500,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      });

      expect(result.script).toContain('start_date');
      expect(result.script).toContain('end_date');
    });

    it('should not generate script when env vars not set', async () => {
      const largeResponse = {
        results: Array.from({ length: 500 }, () => ({
          occurred_at: '2024-01-01T10:00:00Z',
          event_type: 'test',
          user: 'user@test.com',
          description: 'Event',
        })),
        count: 1000,
        next: 'next-cursor',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => largeResponse,
      } as Response);

      const result = await listAuditEvents(client, { limit: 500 });

      expect(result.script).toBeUndefined();
    });

    it('should not generate script for small datasets', async () => {
      process.env.KANDJI_API_TOKEN = 'test-token';
      process.env.KANDJI_SUBDOMAIN = 'test';
      process.env.KANDJI_REGION = 'us';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEventsResponse,
      } as Response);

      const result = await listAuditEvents(client, {});

      expect(result.script).toBeUndefined();
    });
  });

  describe('Metadata', () => {
    it('should include total count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEventsResponse,
      } as Response);

      const result = await listAuditEvents(client, {});

      expect(result.metadata?.totalCount).toBe(2);
    });

    it('should include elapsed time', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEventsResponse,
      } as Response);

      const result = await listAuditEvents(client, {});

      expect(result.metadata?.elapsedMs).toBeDefined();
      expect(typeof result.metadata?.elapsedMs).toBe('number');
    });

    it('should include source information', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEventsResponse,
      } as Response);

      const result = await listAuditEvents(client, {});

      expect(result.metadata?.source).toBe('Kandji API');
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

      const result = await listAuditEvents(client, {});

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

      const result = await listAuditEvents(client, {});

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

      const result = await listAuditEvents(client, {});

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('server');
    });

    it('should handle validation errors', async () => {
      // Trigger Zod validation error with invalid parameter
      const result = await listAuditEvents(client, { limit: 'invalid' as any });

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('validation');
    });

    it('should include metadata in error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      } as Response);

      const result = await listAuditEvents(client, {});

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.elapsedMs).toBeDefined();
      expect(result.metadata?.cached).toBe(false);
    });
  });

  describe('Empty Results', () => {
    it('should handle zero events', async () => {
      const emptyResponse = {
        results: [],
        count: 0,
        next: null,
        previous: null,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => emptyResponse,
      } as Response);

      const result = await listAuditEvents(client, {});

      expect(result.success).toBe(true);
      expect(result.data?.results).toHaveLength(0);
      expect(result.summary).toContain('Retrieved 0 audit events');
    });
  });
});
