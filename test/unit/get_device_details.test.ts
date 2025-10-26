/**
 * Unit tests for get_device_details tool
 * Tests device detail retrieval, caching, and error handling
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { KandjiClient } from '../../src/utils/client.js';
import { getDeviceDetails } from '../../src/tools/get_device_details.js';
import { cache } from '../../src/utils/cache.js';

describe('getDeviceDetails', () => {
  let client: KandjiClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  const validDeviceId = '12345678-1234-1234-1234-123456789012';

  const mockDevice = {
    device_id: validDeviceId,
    device_name: 'John-MacBook-Pro',
    serial_number: 'C02ABC123456',
    platform: 'Mac',
    os_version: '14.2.1',
    model: 'MacBook Pro (16-inch, 2023)',
    user_name: 'John Doe',
    user_email: 'john.doe@example.com',
    blueprint_name: 'Standard Mac',
    last_check_in: '2024-01-15T10:30:00Z',
    mdm_enabled: true,
    agent_installed: true,
    is_supervised: false,
    is_dep_enrolled: true,
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
    it('should retrieve device details successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevice,
      } as Response);

      const result = await getDeviceDetails(client, { device_id: validDeviceId });

      expect(result.success).toBe(true);
      expect(result.data?.device_id).toBe(validDeviceId);
      expect(result.data?.device_name).toBe('John-MacBook-Pro');
    });

    it('should call correct API endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevice,
      } as Response);

      await getDeviceDetails(client, { device_id: validDeviceId });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/devices/${validDeviceId}`),
        expect.any(Object)
      );
    });

    it('should include all device properties in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevice,
      } as Response);

      const result = await getDeviceDetails(client, { device_id: validDeviceId });

      expect(result.data).toMatchObject({
        device_id: validDeviceId,
        device_name: 'John-MacBook-Pro',
        serial_number: 'C02ABC123456',
        platform: 'Mac',
        os_version: '14.2.1',
        model: 'MacBook Pro (16-inch, 2023)',
      });
    });
  });

  describe('Summary and Table Formatting', () => {
    it('should format summary correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevice,
      } as Response);

      const result = await getDeviceDetails(client, { device_id: validDeviceId });

      expect(result.summary).toContain('John-MacBook-Pro');
      expect(result.summary).toContain('Mac');
      expect(result.summary).toContain('14.2.1');
    });

    it('should format table with all properties', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevice,
      } as Response);

      const result = await getDeviceDetails(client, { device_id: validDeviceId });

      expect(result.table?.columns).toEqual(['Property', 'Value']);
      const rows = result.table?.rows || [];

      expect(rows).toContainEqual({ Property: 'Device Name', Value: 'John-MacBook-Pro' });
      expect(rows).toContainEqual({ Property: 'Serial Number', Value: 'C02ABC123456' });
      expect(rows).toContainEqual({ Property: 'Platform', Value: 'Mac' });
      expect(rows).toContainEqual({ Property: 'OS Version', Value: '14.2.1' });
      expect(rows).toContainEqual({ Property: 'Model', Value: 'MacBook Pro (16-inch, 2023)' });
    });

    it('should display boolean values as Yes/No', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevice,
      } as Response);

      const result = await getDeviceDetails(client, { device_id: validDeviceId });

      const rows = result.table?.rows || [];
      expect(rows).toContainEqual({ Property: 'MDM Enabled', Value: 'Yes' });
      expect(rows).toContainEqual({ Property: 'Agent Installed', Value: 'Yes' });
      expect(rows).toContainEqual({ Property: 'Supervised', Value: 'No' });
      expect(rows).toContainEqual({ Property: 'DEP Enrolled', Value: 'Yes' });
    });

    it('should handle missing optional fields with N/A', async () => {
      const deviceMissingFields = {
        ...mockDevice,
        user_name: undefined,
        user_email: undefined,
        blueprint_name: undefined,
        last_check_in: undefined,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => deviceMissingFields,
      } as Response);

      const result = await getDeviceDetails(client, { device_id: validDeviceId });

      const rows = result.table?.rows || [];
      expect(rows).toContainEqual({ Property: 'User Name', Value: 'N/A' });
      expect(rows).toContainEqual({ Property: 'User Email', Value: 'N/A' });
      expect(rows).toContainEqual({ Property: 'Blueprint', Value: 'N/A' });
      expect(rows).toContainEqual({ Property: 'Last Check-in', Value: 'N/A' });
    });
  });

  describe('Caching Behavior', () => {
    it('should cache device details after first fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevice,
      } as Response);

      const result1 = await getDeviceDetails(client, { device_id: validDeviceId });
      expect(result1.metadata?.cached).toBe(false);

      const result2 = await getDeviceDetails(client, { device_id: validDeviceId });
      expect(result2.metadata?.cached).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should return same data from cache', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevice,
      } as Response);

      const result1 = await getDeviceDetails(client, { device_id: validDeviceId });
      const result2 = await getDeviceDetails(client, { device_id: validDeviceId });

      expect(result1.data).toEqual(result2.data);
    });

    it('should use unique cache keys per device', async () => {
      const device2Id = '87654321-4321-4321-4321-210987654321';
      const mockDevice2 = { ...mockDevice, device_id: device2Id, device_name: 'Other-Device' };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDevice,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDevice2,
        } as Response);

      await getDeviceDetails(client, { device_id: validDeviceId });
      await getDeviceDetails(client, { device_id: device2Id });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Validation', () => {
    it('should reject invalid UUID format', async () => {
      const result = await getDeviceDetails(client, { device_id: 'not-a-uuid' });

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('validation');
    });

    it('should require device_id parameter', async () => {
      const result = await getDeviceDetails(client, {} as any);

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('validation');
    });

    it('should validate UUID format strictly', async () => {
      const result = await getDeviceDetails(client, {
        device_id: '12345678-1234-1234-1234-12345678901', // missing one digit
      });

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('validation');
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

      const result = await getDeviceDetails(client, { device_id: validDeviceId });

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('auth');
      expect(result.errors![0].recovery.some(r => r.includes('KANDJI_API_TOKEN'))).toBe(true);
    });

    it('should handle device not found (404)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Device not found' }),
      } as Response);

      const result = await getDeviceDetails(client, { device_id: validDeviceId });

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('validation');
      expect(result.errors![0].recovery.some(r => r.includes('device_id'))).toBe(true);
    });

    it('should handle rate limit error (429)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: 'Rate limit exceeded' }),
      } as Response);

      const result = await getDeviceDetails(client, { device_id: validDeviceId });

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

      const result = await getDeviceDetails(client, { device_id: validDeviceId });

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

      const result = await getDeviceDetails(client, { device_id: validDeviceId });

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.elapsedMs).toBeDefined();
      expect(result.metadata?.cached).toBe(false);
    });
  });

  describe('Metadata', () => {
    it('should include elapsed time', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevice,
      } as Response);

      const result = await getDeviceDetails(client, { device_id: validDeviceId });

      expect(result.metadata?.elapsedMs).toBeDefined();
      expect(typeof result.metadata?.elapsedMs).toBe('number');
      expect(result.metadata?.elapsedMs).toBeGreaterThanOrEqual(0);
    });

    it('should include source information', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevice,
      } as Response);

      const result = await getDeviceDetails(client, { device_id: validDeviceId });

      expect(result.metadata?.source).toBe('Kandji API');
    });

    it('should include helpful suggestions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevice,
      } as Response);

      const result = await getDeviceDetails(client, { device_id: validDeviceId });

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
      expect(result.suggestions).toContain(
        'View installed apps with search for device apps endpoint'
      );
    });
  });

  describe('Different Device Types', () => {
    it('should handle iPhone device', async () => {
      const iphoneDevice = {
        ...mockDevice,
        platform: 'iPhone',
        model: 'iPhone 15 Pro',
        os_version: '17.2',
        is_supervised: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => iphoneDevice,
      } as Response);

      const result = await getDeviceDetails(client, { device_id: validDeviceId });

      expect(result.success).toBe(true);
      expect(result.data?.platform).toBe('iPhone');
      expect(result.summary).toContain('iPhone');
    });

    it('should handle iPad device', async () => {
      const ipadDevice = {
        ...mockDevice,
        platform: 'iPad',
        model: 'iPad Pro (12.9-inch)',
        os_version: '17.1',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ipadDevice,
      } as Response);

      const result = await getDeviceDetails(client, { device_id: validDeviceId });

      expect(result.success).toBe(true);
      expect(result.data?.platform).toBe('iPad');
    });

    it('should handle Apple TV device', async () => {
      const tvDevice = {
        ...mockDevice,
        platform: 'tvOS',
        model: 'Apple TV 4K',
        os_version: '17.0',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => tvDevice,
      } as Response);

      const result = await getDeviceDetails(client, { device_id: validDeviceId });

      expect(result.success).toBe(true);
      expect(result.data?.platform).toBe('tvOS');
    });
  });
});
