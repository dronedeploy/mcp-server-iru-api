/**
 * Unit tests for execute_device_action tool
 * Tests confirmation validation, device actions, audit logging, and error handling
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { KandjiClient } from '../../src/utils/client.js';
import { cache } from '../../src/utils/cache.js';
import { executeDeviceAction } from '../../src/tools/execute_device_action.js';

describe('executeDeviceAction', () => {
  let client: KandjiClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  const validDeviceId = '550e8400-e29b-41d4-a716-446655440000';

  // Spy on console.error for audit logging tests
  let logSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    client = new KandjiClient({
      apiToken: 'test-token',
      subdomain: 'test',
      region: 'us',
      enablePIIRedaction: false,
    });
    cache.clear();
    mockFetch.mockClear();

    // Setup console.error spy
    logSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  describe('Confirmation Validation', () => {
    it('should reject action without confirmation', async () => {
      const result = await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'lock',
        confirm: false,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].category).toBe('validation');
      expect(result.errors![0].message).toContain('explicit confirmation');
      expect(result.errors![0].recovery.some(r => r.includes('confirm: true'))).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should accept lock action with confirm=true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Device locked' }),
      } as Response);

      const result = await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'lock',
        confirm: true,
      });

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should accept restart action with confirm=true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Device restart initiated' }),
      } as Response);

      const result = await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'restart',
        confirm: true,
      });

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should accept shutdown action with confirm=true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Device shutdown initiated' }),
      } as Response);

      const result = await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'shutdown',
        confirm: true,
      });

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should accept erase action with confirm=true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Device erase initiated' }),
      } as Response);

      const result = await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'erase',
        confirm: true,
      });

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Lock Action', () => {
    it('should execute lock with custom message', async () => {
      const lockMessage = 'Lost device - please return to IT';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Device locked' }),
      } as Response);

      const result = await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'lock',
        confirm: true,
        message: lockMessage,
      });

      expect(result.success).toBe(true);
      expect(result.summary).toContain('locked successfully');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/action/lock'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ message: lockMessage }),
        })
      );
    });

    it('should execute lock without message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Device locked' }),
      } as Response);

      const result = await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'lock',
        confirm: true,
      });

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/action/lock'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should return unlock PIN for macOS lock', async () => {
      const unlockPin = '123456';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Device locked',
          unlock_pin: unlockPin,
        }),
      } as Response);

      const result = await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'lock',
        confirm: true,
      });

      expect(result.success).toBe(true);
      expect(result.table?.rows).toContainEqual(
        expect.objectContaining({ Property: 'Unlock PIN', Value: unlockPin })
      );
    });

    it('should not include unlock PIN row when not returned', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Device locked' }),
      } as Response);

      const result = await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'lock',
        confirm: true,
      });

      expect(result.success).toBe(true);
      const pinRow = result.table?.rows.find(row => row.Property === 'Unlock PIN');
      expect(pinRow).toBeUndefined();
    });
  });

  describe('Restart Action', () => {
    it('should execute restart command', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Device restart initiated' }),
      } as Response);

      const result = await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'restart',
        confirm: true,
      });

      expect(result.success).toBe(true);
      expect(result.summary).toContain('restart command sent');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/action/restart'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should include suggestions for restart action', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Device restart initiated' }),
      } as Response);

      const result = await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'restart',
        confirm: true,
      });

      expect(result.success).toBe(true);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
      expect(result.suggestions).toContain('Check device status with get_device_details');
    });
  });

  describe('Shutdown Action', () => {
    it('should execute shutdown command', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Device shutdown initiated' }),
      } as Response);

      const result = await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'shutdown',
        confirm: true,
      });

      expect(result.success).toBe(true);
      expect(result.summary).toContain('shutdown command sent');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/action/shutdown'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('Erase Action', () => {
    it('should execute erase with PIN for macOS', async () => {
      const pin = '123456';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Device erase initiated' }),
      } as Response);

      const result = await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'erase',
        confirm: true,
        pin,
      });

      expect(result.success).toBe(true);
      expect(result.summary).toContain('WIPE THE DEVICE');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/action/erase'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ pin }),
        })
      );
    });

    it('should execute erase without PIN for iOS/iPadOS', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Device erase initiated' }),
      } as Response);

      const result = await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'erase',
        confirm: true,
      });

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/action/erase'),
        expect.any(Object)
      );
    });

    it('should not include suggestions for erase action', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Device erase initiated' }),
      } as Response);

      const result = await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'erase',
        confirm: true,
      });

      expect(result.success).toBe(true);
      expect(result.suggestions).toEqual([]);
    });
  });

  describe('Audit Logging', () => {
    it('should log audit trail for erase action', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Device erase initiated' }),
      } as Response);

      await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'erase',
        confirm: true,
      });

      expect(logSpy).toHaveBeenCalled();
      const logCall = logSpy.mock.calls[0][0] as string;
      const logData = JSON.parse(logCall);

      expect(logData.action).toBe('DEVICE_ERASE');
      expect(logData.device_id).toBe(validDeviceId);
      expect(logData.confirmed).toBe(true);
      expect(logData.timestamp).toBeDefined();
    });

    it('should NOT log audit trail for lock action', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Device locked' }),
      } as Response);

      await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'lock',
        confirm: true,
      });

      expect(logSpy).not.toHaveBeenCalled();
    });

    it('should NOT log audit trail for restart action', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Device restart initiated' }),
      } as Response);

      await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'restart',
        confirm: true,
      });

      expect(logSpy).not.toHaveBeenCalled();
    });

    it('should NOT log audit trail for shutdown action', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Device shutdown initiated' }),
      } as Response);

      await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'shutdown',
        confirm: true,
      });

      expect(logSpy).not.toHaveBeenCalled();
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate device cache after lock action', async () => {
      // Pre-populate cache
      cache.set(`device:${validDeviceId}`, { device_name: 'Test Device' }, 300);
      expect(cache.has(`device:${validDeviceId}`)).toBe(true);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Device locked' }),
      } as Response);

      await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'lock',
        confirm: true,
      });

      expect(cache.has(`device:${validDeviceId}`)).toBe(false);
    });

    it('should invalidate device cache after restart action', async () => {
      cache.set(`device:${validDeviceId}`, { device_name: 'Test Device' }, 300);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Device restart initiated' }),
      } as Response);

      await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'restart',
        confirm: true,
      });

      expect(cache.has(`device:${validDeviceId}`)).toBe(false);
    });

    it('should invalidate device cache after erase action', async () => {
      cache.set(`device:${validDeviceId}`, { device_name: 'Test Device' }, 300);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Device erase initiated' }),
      } as Response);

      await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'erase',
        confirm: true,
      });

      expect(cache.has(`device:${validDeviceId}`)).toBe(false);
    });
  });

  describe('Response Format', () => {
    it('should return valid MCP response envelope', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Device locked' }),
      } as Response);

      const result = await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'lock',
        confirm: true,
      });

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('table');
      expect(result.table).toHaveProperty('columns', ['Property', 'Value']);
      expect(result.table).toHaveProperty('rows');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('elapsedMs');
      expect(result.metadata).toHaveProperty('cached', false);
      expect(result.metadata).toHaveProperty('source', 'Iru API');
    });

    it('should include correct table data for successful action', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Device locked' }),
      } as Response);

      const result = await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'lock',
        confirm: true,
      });

      expect(result.table?.rows).toContainEqual({ Property: 'Action', Value: 'LOCK' });
      expect(result.table?.rows).toContainEqual({ Property: 'Device ID', Value: validDeviceId });
      expect(result.table?.rows).toContainEqual({ Property: 'Status', Value: 'Success' });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid device_id (not UUID)', async () => {
      const result = await executeDeviceAction(client, {
        device_id: 'invalid-uuid',
        action: 'lock',
        confirm: true,
      } as any);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].category).toBe('validation');
      expect(result.errors![0].recovery.some(r => r.includes('valid UUID'))).toBe(true);
    });

    it('should handle invalid action type', async () => {
      const result = await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'invalid_action',
        confirm: true,
      } as any);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].category).toBe('validation');
    });

    it('should handle authentication error (401)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Authentication failed' }),
      } as Response);

      const result = await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'lock',
        confirm: true,
      });

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

      const result = await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'lock',
        confirm: true,
      });

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('validation');
      expect(result.errors![0].message).toContain('not found');
      expect(result.errors![0].recovery.some(r => r.includes('Verify the device_id'))).toBe(true);
    });

    it('should handle rate limit error (429)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: 'Rate limit exceeded' }),
      } as Response);

      const result = await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'lock',
        confirm: true,
      });

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

      const result = await executeDeviceAction(client, {
        device_id: validDeviceId,
        action: 'lock',
        confirm: true,
      });

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('server');
      expect(result.errors![0].recovery.some(r => r.includes('Iru API status'))).toBe(true);
    });

    it('should include elapsed time in error response', async () => {
      const result = await executeDeviceAction(client, {
        device_id: 'invalid-uuid',
        action: 'lock',
        confirm: true,
      } as any);

      expect(result.metadata?.elapsedMs).toBeDefined();
      expect(typeof result.metadata?.elapsedMs).toBe('number');
      expect(result.metadata?.elapsedMs).toBeGreaterThanOrEqual(0);
    });
  });
});
