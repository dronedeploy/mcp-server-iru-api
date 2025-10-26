/**
 * Unit tests for get_compliance_summary tool
 * Tests compliance calculation, platform aggregation, and percentage logic
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { KandjiClient } from '../../src/utils/client.js';
import { cache } from '../../src/utils/cache.js';
import { getComplianceSummary } from '../../src/tools/get_compliance_summary.js';

describe('getComplianceSummary', () => {
  let client: KandjiClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  const createMockDevice = (overrides: any = {}) => ({
    device_id: `device-${Math.random()}`,
    device_name: 'Test Device',
    serial_number: 'ABC123',
    platform: 'Mac',
    os_version: '14.0',
    model: 'MacBook Pro',
    mdm_enabled: true,
    agent_installed: true,
    ...overrides,
  });

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

  describe('Compliance Calculation Logic', () => {
    it('should calculate compliance percentage correctly', async () => {
      const mockDevices = [
        createMockDevice({ mdm_enabled: true, agent_installed: true }),
        createMockDevice({ mdm_enabled: true, agent_installed: true }),
        createMockDevice({ mdm_enabled: false, agent_installed: true }),
        createMockDevice({ mdm_enabled: true, agent_installed: false }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await getComplianceSummary(client);

      expect(result.success).toBe(true);
      expect(result.data?.total_devices).toBe(4);
      expect(result.data?.compliant_devices).toBe(2);
      expect(result.data?.non_compliant_devices).toBe(2);
      expect(result.data?.compliance_percentage).toBe(50);
    });

    it('should count devices with MDM enabled and agent installed as compliant', async () => {
      const mockDevices = [createMockDevice({ mdm_enabled: true, agent_installed: true })];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await getComplianceSummary(client);

      expect(result.data?.compliant_devices).toBe(1);
      expect(result.data?.non_compliant_devices).toBe(0);
      expect(result.data?.compliance_percentage).toBe(100);
    });

    it('should count devices without MDM as non-compliant', async () => {
      const mockDevices = [createMockDevice({ mdm_enabled: false, agent_installed: true })];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await getComplianceSummary(client);

      expect(result.data?.compliant_devices).toBe(0);
      expect(result.data?.non_compliant_devices).toBe(1);
      expect(result.data?.compliance_percentage).toBe(0);
    });

    it('should count devices without agent as non-compliant', async () => {
      const mockDevices = [createMockDevice({ mdm_enabled: true, agent_installed: false })];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await getComplianceSummary(client);

      expect(result.data?.compliant_devices).toBe(0);
      expect(result.data?.non_compliant_devices).toBe(1);
      expect(result.data?.compliance_percentage).toBe(0);
    });

    it('should count devices without MDM or agent as non-compliant', async () => {
      const mockDevices = [createMockDevice({ mdm_enabled: false, agent_installed: false })];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await getComplianceSummary(client);

      expect(result.data?.compliant_devices).toBe(0);
      expect(result.data?.non_compliant_devices).toBe(1);
      expect(result.data?.compliance_percentage).toBe(0);
    });
  });

  describe('Platform-Based Aggregation', () => {
    it('should aggregate compliance by platform', async () => {
      const mockDevices = [
        createMockDevice({ platform: 'Mac', mdm_enabled: true, agent_installed: true }),
        createMockDevice({ platform: 'Mac', mdm_enabled: false, agent_installed: true }),
        createMockDevice({ platform: 'iPhone', mdm_enabled: true, agent_installed: true }),
        createMockDevice({ platform: 'iPad', mdm_enabled: true, agent_installed: false }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await getComplianceSummary(client);

      expect(result.data?.by_platform).toBeDefined();
      expect(result.data?.by_platform.Mac).toEqual({
        compliant: 1,
        non_compliant: 1,
      });
      expect(result.data?.by_platform.iPhone).toEqual({
        compliant: 1,
        non_compliant: 0,
      });
      expect(result.data?.by_platform.iPad).toEqual({
        compliant: 0,
        non_compliant: 1,
      });
    });

    it('should handle multiple devices per platform', async () => {
      const mockDevices = [
        createMockDevice({ platform: 'Mac', mdm_enabled: true, agent_installed: true }),
        createMockDevice({ platform: 'Mac', mdm_enabled: true, agent_installed: true }),
        createMockDevice({ platform: 'Mac', mdm_enabled: true, agent_installed: true }),
        createMockDevice({ platform: 'Mac', mdm_enabled: false, agent_installed: true }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await getComplianceSummary(client);

      expect(result.data?.by_platform.Mac).toEqual({
        compliant: 3,
        non_compliant: 1,
      });
    });

    it('should handle all four platform types', async () => {
      const mockDevices = [
        createMockDevice({ platform: 'Mac', mdm_enabled: true, agent_installed: true }),
        createMockDevice({ platform: 'iPhone', mdm_enabled: true, agent_installed: true }),
        createMockDevice({ platform: 'iPad', mdm_enabled: true, agent_installed: true }),
        createMockDevice({ platform: 'AppleTV', mdm_enabled: true, agent_installed: true }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await getComplianceSummary(client);

      expect(Object.keys(result.data?.by_platform || {})).toHaveLength(4);
      expect(result.data?.by_platform.Mac).toBeDefined();
      expect(result.data?.by_platform.iPhone).toBeDefined();
      expect(result.data?.by_platform.iPad).toBeDefined();
      expect(result.data?.by_platform.AppleTV).toBeDefined();
    });
  });

  describe('Percentage Calculations', () => {
    it('should calculate 0% for all non-compliant devices', async () => {
      const mockDevices = [
        createMockDevice({ mdm_enabled: false, agent_installed: false }),
        createMockDevice({ mdm_enabled: false, agent_installed: true }),
        createMockDevice({ mdm_enabled: true, agent_installed: false }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await getComplianceSummary(client);

      expect(result.data?.compliance_percentage).toBe(0);
      expect(result.summary).toContain('0.0%');
    });

    it('should calculate 100% for all compliant devices', async () => {
      const mockDevices = [
        createMockDevice({ mdm_enabled: true, agent_installed: true }),
        createMockDevice({ mdm_enabled: true, agent_installed: true }),
        createMockDevice({ mdm_enabled: true, agent_installed: true }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await getComplianceSummary(client);

      expect(result.data?.compliance_percentage).toBe(100);
      expect(result.summary).toContain('100.0%');
    });

    it('should calculate 50% correctly', async () => {
      const mockDevices = [
        createMockDevice({ mdm_enabled: true, agent_installed: true }),
        createMockDevice({ mdm_enabled: false, agent_installed: true }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await getComplianceSummary(client);

      expect(result.data?.compliance_percentage).toBe(50);
    });

    it('should calculate 75% correctly', async () => {
      const mockDevices = [
        createMockDevice({ mdm_enabled: true, agent_installed: true }),
        createMockDevice({ mdm_enabled: true, agent_installed: true }),
        createMockDevice({ mdm_enabled: true, agent_installed: true }),
        createMockDevice({ mdm_enabled: false, agent_installed: true }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await getComplianceSummary(client);

      expect(result.data?.compliance_percentage).toBe(75);
    });

    it('should calculate 25% correctly', async () => {
      const mockDevices = [
        createMockDevice({ mdm_enabled: true, agent_installed: true }),
        createMockDevice({ mdm_enabled: false, agent_installed: true }),
        createMockDevice({ mdm_enabled: false, agent_installed: true }),
        createMockDevice({ mdm_enabled: false, agent_installed: true }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await getComplianceSummary(client);

      expect(result.data?.compliance_percentage).toBe(25);
    });

    it('should handle decimal percentages correctly', async () => {
      const mockDevices = [
        createMockDevice({ mdm_enabled: true, agent_installed: true }),
        createMockDevice({ mdm_enabled: true, agent_installed: true }),
        createMockDevice({ mdm_enabled: false, agent_installed: true }),
        createMockDevice({ mdm_enabled: false, agent_installed: true }),
        createMockDevice({ mdm_enabled: false, agent_installed: true }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await getComplianceSummary(client);

      expect(result.data?.compliance_percentage).toBe(40); // 2/5 = 40%
      expect(result.summary).toContain('40.0%');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero devices (0%)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      const result = await getComplianceSummary(client);

      expect(result.success).toBe(true);
      expect(result.data?.total_devices).toBe(0);
      expect(result.data?.compliant_devices).toBe(0);
      expect(result.data?.non_compliant_devices).toBe(0);
      expect(result.data?.compliance_percentage).toBe(0);
      expect(result.summary).toContain('0/0');
    });

    it('should handle single device (compliant)', async () => {
      const mockDevices = [createMockDevice({ mdm_enabled: true, agent_installed: true })];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await getComplianceSummary(client);

      expect(result.data?.total_devices).toBe(1);
      expect(result.data?.compliance_percentage).toBe(100);
    });

    it('should handle single device (non-compliant)', async () => {
      const mockDevices = [createMockDevice({ mdm_enabled: false, agent_installed: false })];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await getComplianceSummary(client);

      expect(result.data?.total_devices).toBe(1);
      expect(result.data?.compliance_percentage).toBe(0);
    });

    it('should handle platform with single device', async () => {
      const mockDevices = [
        createMockDevice({ platform: 'AppleTV', mdm_enabled: true, agent_installed: true }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await getComplianceSummary(client);

      expect(result.data?.by_platform.AppleTV).toEqual({
        compliant: 1,
        non_compliant: 0,
      });
    });

    it('should handle devices with undefined mdm_enabled', async () => {
      const mockDevices = [createMockDevice({ mdm_enabled: undefined, agent_installed: true })];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await getComplianceSummary(client);

      // Undefined mdm_enabled should be treated as non-compliant
      expect(result.data?.non_compliant_devices).toBe(1);
      expect(result.data?.compliant_devices).toBe(0);
    });

    it('should handle devices with undefined agent_installed', async () => {
      const mockDevices = [createMockDevice({ mdm_enabled: true, agent_installed: undefined })];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await getComplianceSummary(client);

      // Undefined agent_installed should be treated as non-compliant
      expect(result.data?.non_compliant_devices).toBe(1);
      expect(result.data?.compliant_devices).toBe(0);
    });
  });

  describe('Table Formatting', () => {
    it('should format table with platform rows', async () => {
      const mockDevices = [
        createMockDevice({ platform: 'Mac', mdm_enabled: true, agent_installed: true }),
        createMockDevice({ platform: 'Mac', mdm_enabled: false, agent_installed: true }),
        createMockDevice({ platform: 'iPhone', mdm_enabled: true, agent_installed: true }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await getComplianceSummary(client);

      expect(result.table?.columns).toEqual(['Platform', 'Compliant', 'Non-Compliant', 'Total']);
      expect(result.table?.rows).toContainEqual({
        Platform: 'Mac',
        Compliant: 1,
        'Non-Compliant': 1,
        Total: 2,
      });
      expect(result.table?.rows).toContainEqual({
        Platform: 'iPhone',
        Compliant: 1,
        'Non-Compliant': 0,
        Total: 1,
      });
    });

    it('should calculate totals correctly per platform', async () => {
      const mockDevices = [
        createMockDevice({ platform: 'iPad', mdm_enabled: true, agent_installed: true }),
        createMockDevice({ platform: 'iPad', mdm_enabled: true, agent_installed: true }),
        createMockDevice({ platform: 'iPad', mdm_enabled: false, agent_installed: true }),
        createMockDevice({ platform: 'iPad', mdm_enabled: false, agent_installed: false }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await getComplianceSummary(client);

      const iPadRow = result.table?.rows.find(row => row.Platform === 'iPad');
      expect(iPadRow).toBeDefined();
      expect(iPadRow?.Compliant).toBe(2);
      expect(iPadRow?.['Non-Compliant']).toBe(2);
      expect(iPadRow?.Total).toBe(4);
    });
  });

  describe('Caching Behavior', () => {
    it('should cache compliance summary', async () => {
      const mockDevices = [createMockDevice({ mdm_enabled: true, agent_installed: true })];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result1 = await getComplianceSummary(client);
      expect(result1.metadata?.cached).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const result2 = await getComplianceSummary(client);
      expect(result2.metadata?.cached).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional call
    });

    it('should return same data from cache', async () => {
      const mockDevices = [
        createMockDevice({ mdm_enabled: true, agent_installed: true }),
        createMockDevice({ mdm_enabled: false, agent_installed: true }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result1 = await getComplianceSummary(client);
      const result2 = await getComplianceSummary(client);

      expect(result1.data).toEqual(result2.data);
      expect(result1.summary).toContain('50.0%');
      expect(result2.summary).toContain('50.0%');
    });
  });

  describe('Response Format', () => {
    it('should return valid MCP response envelope', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [createMockDevice()],
      } as Response);

      const result = await getComplianceSummary(client);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('table');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('totalCount');
      expect(result.metadata).toHaveProperty('elapsedMs');
      expect(result.metadata).toHaveProperty('cached');
      expect(result.metadata).toHaveProperty('source', 'Kandji API');
      expect(result).toHaveProperty('suggestions');
    });

    it('should include helpful suggestions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [createMockDevice()],
      } as Response);

      const result = await getComplianceSummary(client);

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
      expect(result.suggestions).toContain('Filter non-compliant devices by platform');
    });

    it('should format summary string correctly', async () => {
      const mockDevices = [
        createMockDevice({ mdm_enabled: true, agent_installed: true }),
        createMockDevice({ mdm_enabled: true, agent_installed: true }),
        createMockDevice({ mdm_enabled: false, agent_installed: true }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevices,
      } as Response);

      const result = await getComplianceSummary(client);

      expect(result.summary).toBe('2/3 devices compliant (66.7%)');
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

      const result = await getComplianceSummary(client);

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

      const result = await getComplianceSummary(client);

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

      const result = await getComplianceSummary(client);

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

      const result = await getComplianceSummary(client);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.elapsedMs).toBeDefined();
      expect(result.metadata?.cached).toBe(false);
      expect(result.metadata?.source).toBe('Kandji API');
    });

    it('should not cache error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      } as Response);

      await getComplianceSummary(client);
      await getComplianceSummary(client);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
