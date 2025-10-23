/**
 * Unit tests for KandjiClient
 * Tests error handling, PII redaction, and API calls
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { KandjiClient } from '../../src/utils/client.js';

describe('KandjiClient', () => {
  let client: KandjiClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    client = new KandjiClient({
      apiToken: 'test-token',
      subdomain: 'test',
      region: 'us',
      enablePIIRedaction: false,
    });
    mockFetch.mockClear();
  });

  describe('constructor', () => {
    it('should construct US region URL correctly', () => {
      const usClient = new KandjiClient({
        apiToken: 'test-token',
        subdomain: 'mycompany',
        region: 'us',
      });
      expect(usClient).toBeDefined();
    });

    it('should construct EU region URL correctly', () => {
      const euClient = new KandjiClient({
        apiToken: 'test-token',
        subdomain: 'mycompany',
        region: 'eu',
      });
      expect(euClient).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should throw authentication error on 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Invalid token' }),
      } as Response);

      await expect(client.getDevice('test-id')).rejects.toThrow('Authentication failed');
    });

    it('should throw not found error on 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Device not found' }),
      } as Response);

      await expect(client.getDevice('invalid-id')).rejects.toThrow('Resource not found');
    });

    it('should throw rate limit error on 429', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: 'Rate limit exceeded' }),
      } as Response);

      await expect(client.listDevices()).rejects.toThrow('Rate limit exceeded');
    });

    it('should throw server error on 500', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      } as Response);

      await expect(client.listDevices()).rejects.toThrow('Kandji server error');
    });

    it('should handle error response without JSON body', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => { throw new Error('Invalid JSON'); },
        headers: new Headers(),
        type: 'basic',
        url: '',
        redirected: false,
        body: null,
        bodyUsed: false,
        clone: () => mockResponse,
        arrayBuffer: async () => new ArrayBuffer(0),
        blob: async () => new Blob([]),
        formData: async () => new FormData(),
        text: async () => '',
      } as unknown;

      mockFetch.mockResolvedValueOnce(mockResponse as Response);

      await expect(client.listDevices()).rejects.toThrow('Kandji server error');
    });
  });

  describe('PII redaction', () => {
    it('should not redact PII when disabled', async () => {
      const mockDevice = {
        device_id: '123',
        device_name: 'Test Device',
        user_email: 'user@example.com',
        user_name: 'John Doe',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevice,
      } as Response);

      const result = await client.getDevice('123');
      expect(result.user_email).toBe('user@example.com');
      expect(result.user_name).toBe('John Doe');
    });

    it('should redact PII when enabled', async () => {
      const piiClient = new KandjiClient({
        apiToken: 'test-token',
        subdomain: 'test',
        region: 'us',
        enablePIIRedaction: true,
      });

      const mockDevice = {
        device_id: '123',
        device_name: 'Test Device',
        user_email: 'user@example.com',
        user_name: 'John Doe',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevice,
      } as Response);

      const result = await piiClient.getDevice('123');
      expect(result.user_email).toBe('[REDACTED]');
      expect(result.user_name).toBe('[REDACTED]');
    });

    it('should redact PII in nested objects', async () => {
      const piiClient = new KandjiClient({
        apiToken: 'test-token',
        subdomain: 'test',
        region: 'us',
        enablePIIRedaction: true,
      });

      const mockData = {
        results: [
          { id: '1', email: 'user1@example.com', name: 'User One' },
          { id: '2', email: 'user2@example.com', name: 'User Two' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await piiClient.listUsers();
      expect(result.results[0].email).toBe('[REDACTED]');
      expect(result.results[0].name).toBe('[REDACTED]');
      expect(result.results[1].email).toBe('[REDACTED]');
      expect(result.results[1].name).toBe('[REDACTED]');
    });
  });

  describe('listDevices', () => {
    it('should call correct endpoint with no parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await client.listDevices();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.api.kandji.io/api/v1/devices',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should include query parameters when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await client.listDevices({
        platform: 'Mac',
        limit: 50,
        offset: 10,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('platform=Mac'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=50'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=10'),
        expect.any(Object)
      );
    });
  });

  describe('getDevice', () => {
    it('should call correct endpoint', async () => {
      const mockDevice = {
        device_id: '123',
        device_name: 'Test Device',
        platform: 'Mac',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevice,
      } as Response);

      const result = await client.getDevice('123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.api.kandji.io/api/v1/devices/123',
        expect.any(Object)
      );
      expect(result).toEqual(mockDevice);
    });
  });

  describe('getDeviceActivity', () => {
    it('should call correct endpoint with pagination', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await client.getDeviceActivity('123', { limit: 100, offset: 50 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/devices/123/activity'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=100'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=50'),
        expect.any(Object)
      );
    });
  });

  describe('getDeviceApps', () => {
    it('should call correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await client.getDeviceApps('123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.api.kandji.io/api/v1/devices/123/apps',
        expect.any(Object)
      );
    });
  });

  describe('getDeviceLibraryItems', () => {
    it('should call correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await client.getDeviceLibraryItems('123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.api.kandji.io/api/v1/devices/123/library-items',
        expect.any(Object)
      );
    });
  });

  describe('getDeviceLostModeDetails', () => {
    it('should call correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ enabled: false }),
      } as Response);

      await client.getDeviceLostModeDetails('123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.api.kandji.io/api/v1/devices/123/details/lostmode',
        expect.any(Object)
      );
    });
  });

  describe('getDeviceParameters', () => {
    it('should call correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await client.getDeviceParameters('123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.api.kandji.io/api/v1/devices/123/parameters',
        expect.any(Object)
      );
    });
  });

  describe('getDeviceStatus', () => {
    it('should call correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ library_items: [], parameters: [] }),
      } as Response);

      await client.getDeviceStatus('123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.api.kandji.io/api/v1/devices/123/status',
        expect.any(Object)
      );
    });
  });

  describe('listAuditEvents', () => {
    it('should call correct endpoint with parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], count: 0 }),
      } as Response);

      await client.listAuditEvents({
        limit: 100,
        sort_by: '-occurred_at',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/audit/events'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=100'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('sort_by=-occurred_at'),
        expect.any(Object)
      );
    });
  });

  describe('listBlueprints', () => {
    it('should call correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await client.listBlueprints();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.api.kandji.io/api/v1/blueprints',
        expect.any(Object)
      );
    });
  });

  describe('device actions', () => {
    it('should call lock endpoint with message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Device locked' }),
      } as Response);

      await client.lockDevice('123', 'Lost device - please return');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.api.kandji.io/api/v1/devices/123/action/lock',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ message: 'Lost device - please return' }),
        })
      );
    });

    it('should call restart endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Device restart initiated' }),
      } as Response);

      await client.restartDevice('123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.api.kandji.io/api/v1/devices/123/action/restart',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should call erase endpoint with options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Device erase initiated' }),
      } as Response);

      await client.eraseDevice('123', { pin: '123456' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.api.kandji.io/api/v1/devices/123/action/erase',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ pin: '123456' }),
        })
      );
    });
  });
});
