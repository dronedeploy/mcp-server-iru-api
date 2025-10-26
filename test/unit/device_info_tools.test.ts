/**
 * Unit tests for device info tools
 * Tests get_device_activity, get_device_apps, get_device_library_items, get_device_parameters, get_device_status, get_device_lost_mode_details
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { KandjiClient } from '../../src/utils/client.js';
import { getDeviceActivity } from '../../src/tools/get_device_activity.js';
import { getDeviceApps } from '../../src/tools/get_device_apps.js';
import { getDeviceLibraryItems } from '../../src/tools/get_device_library_items.js';
import { getDeviceParameters } from '../../src/tools/get_device_parameters.js';
import { getDeviceStatus } from '../../src/tools/get_device_status.js';
import { getDeviceLostModeDetails } from '../../src/tools/get_device_lost_mode_details.js';
import { cache } from '../../src/utils/cache.js';

describe('Device Info Tools', () => {
  let client: KandjiClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  const validDeviceId = '12345678-1234-1234-1234-123456789012';

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

  describe('getDeviceActivity', () => {
    const mockActivities = [
      {
        timestamp: '2024-01-15T10:00:00Z',
        event_type: 'Check-in',
        description: 'Device checked in',
      },
      {
        timestamp: '2024-01-15T09:00:00Z',
        event_type: 'Command',
        description: 'Install app command sent',
      },
    ];

    it('should retrieve device activity', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockActivities,
      } as Response);

      const result = await getDeviceActivity(client, { device_id: validDeviceId });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should support limit parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockActivities,
      } as Response);

      await getDeviceActivity(client, { device_id: validDeviceId, limit: 100 });

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should support offset parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockActivities,
      } as Response);

      await getDeviceActivity(client, { device_id: validDeviceId, offset: 50 });

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should cache activity with unique keys for different limits/offsets', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActivities,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockActivities[0]],
        } as Response);

      await getDeviceActivity(client, { device_id: validDeviceId, limit: 100 });
      await getDeviceActivity(client, { device_id: validDeviceId, limit: 50 });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should show first 10 activities in table', async () => {
      const manyActivities = Array.from({ length: 20 }, (_, i) => ({
        timestamp: `2024-01-${15 - i}T10:00:00Z`,
        event_type: `Event ${i}`,
        description: `Description ${i}`,
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => manyActivities,
      } as Response);

      const result = await getDeviceActivity(client, { device_id: validDeviceId });

      expect(result.table?.rows).toHaveLength(10);
    });

    it('should offer script when hitting limit with env vars set', async () => {
      process.env.KANDJI_API_TOKEN = 'test-token';
      process.env.KANDJI_SUBDOMAIN = 'test';
      process.env.KANDJI_REGION = 'us';

      const maxActivities = Array.from({ length: 300 }, (_, i) => ({
        timestamp: `2024-01-01T10:00:00Z`,
        event_type: 'Event',
        description: `Event ${i}`,
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => maxActivities,
      } as Response);

      const result = await getDeviceActivity(client, { device_id: validDeviceId, limit: 300 });

      expect(result.script).toBeDefined();
      expect(result.script).toContain('#!/bin/bash');
    });

    it('should not offer script when env vars not set', async () => {
      const maxActivities = Array.from({ length: 300 }, (_, i) => ({
        timestamp: `2024-01-01T10:00:00Z`,
        event_type: 'Event',
        description: `Event ${i}`,
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => maxActivities,
      } as Response);

      const result = await getDeviceActivity(client, { device_id: validDeviceId, limit: 300 });

      expect(result.script).toBeUndefined();
    });

    it('should handle validation error', async () => {
      const result = await getDeviceActivity(client, { device_id: 'invalid-uuid' });

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('validation');
    });

    it('should handle not found error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Device not found' }),
      } as Response);

      const result = await getDeviceActivity(client, { device_id: validDeviceId });

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('validation');
    });
  });

  describe('getDeviceApps', () => {
    const mockApps = [
      { name: 'Safari', version: '17.1', bundle_id: 'com.apple.Safari' },
      { name: 'Chrome', version: '120.0', bundle_id: 'com.google.Chrome' },
    ];

    it('should retrieve device apps', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApps,
      } as Response);

      const result = await getDeviceApps(client, { device_id: validDeviceId });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should cache apps', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApps,
      } as Response);

      const result1 = await getDeviceApps(client, { device_id: validDeviceId });
      const result2 = await getDeviceApps(client, { device_id: validDeviceId });

      expect(result1.metadata?.cached).toBe(false);
      expect(result2.metadata?.cached).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should show first 20 apps in table', async () => {
      const manyApps = Array.from({ length: 50 }, (_, i) => ({
        name: `App ${i}`,
        version: '1.0',
        bundle_id: `com.test.app${i}`,
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => manyApps,
      } as Response);

      const result = await getDeviceApps(client, { device_id: validDeviceId });

      expect(result.table?.rows).toHaveLength(20);
      expect(result.data).toHaveLength(50);
    });

    it('should handle validation error', async () => {
      const result = await getDeviceApps(client, { device_id: 'not-a-uuid' });

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('validation');
    });

    it('should handle not found error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Device not found' }),
      } as Response);

      const result = await getDeviceApps(client, { device_id: validDeviceId });

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('validation');
    });
  });

  describe('getDeviceLibraryItems', () => {
    const mockItems = [
      { name: 'Kandji Agent', type: 'Profile', status: 'Active' },
      { name: 'Security Policy', type: 'Configuration', status: 'Pending' },
    ];

    it('should retrieve library items', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockItems,
      } as Response);

      const result = await getDeviceLibraryItems(client, { device_id: validDeviceId });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should cache library items', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockItems,
      } as Response);

      const result1 = await getDeviceLibraryItems(client, { device_id: validDeviceId });
      const result2 = await getDeviceLibraryItems(client, { device_id: validDeviceId });

      expect(result1.metadata?.cached).toBe(false);
      expect(result2.metadata?.cached).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle validation error', async () => {
      const result = await getDeviceLibraryItems(client, { device_id: 'bad-id' });

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('validation');
    });

    it('should handle not found error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Device not found' }),
      } as Response);

      const result = await getDeviceLibraryItems(client, { device_id: validDeviceId });

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('validation');
    });
  });

  describe('getDeviceParameters', () => {
    const mockParameters = [
      { id: 'param-1', parameter_id: 'FileVault', status: 'Active' },
      { id: 'param-2', parameter_id: 'Firewall', status: 'Inactive' },
    ];

    it('should retrieve device parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockParameters,
      } as Response);

      const result = await getDeviceParameters(client, { device_id: validDeviceId });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should use parameter_id fallback when id missing', async () => {
      const paramsWithFallback = [{ parameter_id: 'FileVault', status: 'Active' }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => paramsWithFallback,
      } as Response);

      const result = await getDeviceParameters(client, { device_id: validDeviceId });

      const rows = result.table?.rows || [];
      expect(rows[0]['Parameter ID']).toBe('FileVault');
    });

    it('should cache parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockParameters,
      } as Response);

      const result1 = await getDeviceParameters(client, { device_id: validDeviceId });
      const result2 = await getDeviceParameters(client, { device_id: validDeviceId });

      expect(result1.metadata?.cached).toBe(false);
      expect(result2.metadata?.cached).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should include parameter correlations link in suggestions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockParameters,
      } as Response);

      const result = await getDeviceParameters(client, { device_id: validDeviceId });

      expect(result.suggestions?.some(s => s.includes('Parameter-Correlations'))).toBe(true);
    });

    it('should handle not found with macOS-specific recovery message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Device not found' }),
      } as Response);

      const result = await getDeviceParameters(client, { device_id: validDeviceId });

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('validation');
      expect(result.errors![0].recovery.some(r => r.includes('macOS'))).toBe(true);
    });
  });

  describe('getDeviceStatus', () => {
    const mockStatus = {
      library_items: [
        { name: 'Item 1', status: 'Active' },
        { name: 'Item 2', status: 'Pending' },
      ],
      parameters: [{ id: 'param-1', status: 'Active' }],
    };

    it('should retrieve device status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      } as Response);

      const result = await getDeviceStatus(client, { device_id: validDeviceId });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should display counts in summary', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      } as Response);

      const result = await getDeviceStatus(client, { device_id: validDeviceId });

      expect(result.summary).toContain('2 library items');
      expect(result.summary).toContain('1 parameters');
    });

    it('should handle missing arrays gracefully', async () => {
      const emptyStatus = {
        library_items: undefined,
        parameters: undefined,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => emptyStatus,
      } as Response);

      const result = await getDeviceStatus(client, { device_id: validDeviceId });

      expect(result.success).toBe(true);
      expect(result.summary).toContain('0 library items');
      expect(result.summary).toContain('0 parameters');
    });

    it('should cache device status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      } as Response);

      const result1 = await getDeviceStatus(client, { device_id: validDeviceId });
      const result2 = await getDeviceStatus(client, { device_id: validDeviceId });

      expect(result1.metadata?.cached).toBe(false);
      expect(result2.metadata?.cached).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle validation error', async () => {
      const result = await getDeviceStatus(client, { device_id: 'not-valid' });

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('validation');
    });
  });

  describe('getDeviceLostModeDetails', () => {
    const mockLostMode = {
      enabled: true,
      message: 'This device is lost',
      phone_number: '+1-555-0100',
      footnote: 'Please call to return',
    };

    it('should retrieve lost mode details', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLostMode,
      } as Response);

      const result = await getDeviceLostModeDetails(client, { device_id: validDeviceId });

      expect(result.success).toBe(true);
      expect(result.data?.enabled).toBe(true);
    });

    it('should display enabled status in summary', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLostMode,
      } as Response);

      const result = await getDeviceLostModeDetails(client, { device_id: validDeviceId });

      expect(result.summary).toContain('enabled');
    });

    it('should display disabled status', async () => {
      const disabledMode = { ...mockLostMode, enabled: false };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => disabledMode,
      } as Response);

      const result = await getDeviceLostModeDetails(client, { device_id: validDeviceId });

      expect(result.summary).toContain('disabled');
    });

    it('should show N/A for missing fields', async () => {
      const minimalMode = { enabled: false };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => minimalMode,
      } as Response);

      const result = await getDeviceLostModeDetails(client, { device_id: validDeviceId });

      const rows = result.table?.rows || [];
      expect(rows).toContainEqual({ Property: 'Message', Value: 'N/A' });
      expect(rows).toContainEqual({ Property: 'Phone Number', Value: 'N/A' });
      expect(rows).toContainEqual({ Property: 'Footnote', Value: 'N/A' });
    });

    it('should cache lost mode details', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLostMode,
      } as Response);

      const result1 = await getDeviceLostModeDetails(client, { device_id: validDeviceId });
      const result2 = await getDeviceLostModeDetails(client, { device_id: validDeviceId });

      expect(result1.metadata?.cached).toBe(false);
      expect(result2.metadata?.cached).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle not found with iOS-specific recovery message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Device not found' }),
      } as Response);

      const result = await getDeviceLostModeDetails(client, { device_id: validDeviceId });

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('validation');
      expect(result.errors![0].recovery.some(r => r.includes('iOS/iPadOS'))).toBe(true);
    });

    it('should handle validation error', async () => {
      const result = await getDeviceLostModeDetails(client, { device_id: 'invalid' });

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('validation');
    });
  });

  describe('Common Error Handling', () => {
    it('should handle auth errors across all tools', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Authentication failed' }),
      } as Response);

      const results = await Promise.all([
        getDeviceActivity(client, { device_id: validDeviceId }),
        getDeviceApps(client, { device_id: validDeviceId }),
        getDeviceLibraryItems(client, { device_id: validDeviceId }),
        getDeviceParameters(client, { device_id: validDeviceId }),
        getDeviceStatus(client, { device_id: validDeviceId }),
        getDeviceLostModeDetails(client, { device_id: validDeviceId }),
      ]);

      results.forEach(result => {
        expect(result.success).toBe(false);
        expect(result.errors![0].category).toBe('auth');
      });
    });

    it('should handle rate limit errors across all tools', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: 'Rate limit exceeded' }),
      } as Response);

      const results = await Promise.all([
        getDeviceActivity(client, { device_id: validDeviceId }),
        getDeviceApps(client, { device_id: validDeviceId }),
        getDeviceLibraryItems(client, { device_id: validDeviceId }),
        getDeviceParameters(client, { device_id: validDeviceId }),
        getDeviceStatus(client, { device_id: validDeviceId }),
        getDeviceLostModeDetails(client, { device_id: validDeviceId }),
      ]);

      results.forEach(result => {
        expect(result.success).toBe(false);
        expect(result.errors![0].category).toBe('rate_limit');
      });
    });
  });
});
