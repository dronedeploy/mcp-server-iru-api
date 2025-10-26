/**
 * Unit tests for threat detection tools
 * Tests list_behavioral_detections and get_threat_details
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { KandjiClient } from '../../src/utils/client.js';
import { listBehavioralDetections } from '../../src/tools/list_behavioral_detections.js';
import { getThreatDetails } from '../../src/tools/get_threat_details.js';

describe('Threat Detection Tools', () => {
  let client: KandjiClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    client = new KandjiClient({
      apiToken: 'test-token',
      subdomain: 'test',
      region: 'us',
    });
    mockFetch.mockClear();
  });

  describe('listBehavioralDetections', () => {
    const mockDetections = [
      {
        id: 'det-123',
        threat_id: 'threat-456',
        classification: 'malicious',
        device_id: 'dev-789',
        device_name: 'Test-Mac',
        status: 'blocked',
      },
    ];

    it('should list all behavioral detections', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetections,
      } as Response);

      const result = await listBehavioralDetections(client, {});

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should handle detections with missing optional fields', async () => {
      const incompleteDetections = [
        {
          id: 'det-123',
          threat_id: 'threat-456',
          // Missing device_name, classification, status, detection_date
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => incompleteDetections,
      } as Response);

      const result = await listBehavioralDetections(client, {});

      expect(result.success).toBe(true);
      expect(result.table?.rows[0].Device).toBe('N/A');
      expect(result.table?.rows[0].Classification).toBe('N/A');
      expect(result.table?.rows[0].Status).toBe('N/A');
    });

    it('should filter by threat_id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetections,
      } as Response);

      await listBehavioralDetections(client, { threat_id: 'threat-456' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('threat_id=threat-456'),
        expect.any(Object)
      );
    });

    it('should filter by classification', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetections,
      } as Response);

      await listBehavioralDetections(client, { classification: 'malicious' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('classification=malicious'),
        expect.any(Object)
      );
    });

    it('should filter by status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetections,
      } as Response);

      await listBehavioralDetections(client, { status: 'blocked' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=blocked'),
        expect.any(Object)
      );
    });

    it('should filter by device_id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetections,
      } as Response);

      await listBehavioralDetections(client, { device_id: 'dev-789' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('device_id=dev-789'),
        expect.any(Object)
      );
    });

    it('should respect limit parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetections,
      } as Response);

      await listBehavioralDetections(client, { limit: 100 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=100'),
        expect.any(Object)
      );
    });

    it('should handle multiple filters combined', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetections,
      } as Response);

      await listBehavioralDetections(client, {
        classification: 'malicious',
        status: 'blocked',
        device_id: 'dev-789',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('classification=malicious'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=blocked'),
        expect.any(Object)
      );
    });

    it('should handle authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Authentication failed' }),
      } as Response);

      const result = await listBehavioralDetections(client, {});

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('auth');
      expect(result.errors![0].recovery).toContain('Verify KANDJI_API_TOKEN in .env file');
    });

    it('should handle rate limit errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: 'Rate limit exceeded' }),
      } as Response);

      const result = await listBehavioralDetections(client, {});

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('rate_limit');
      expect(result.errors![0].recovery).toContain('Wait a moment and retry');
    });

    it('should handle server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      } as Response);

      const result = await listBehavioralDetections(client, {});

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('server');
      expect(result.errors![0].recovery).toContain('Check Kandji API status');
    });
  });

  describe('getThreatDetails', () => {
    const mockThreats = [
      {
        id: 'threat-123',
        threat_name: 'Malware.Generic',
        classification: 'malware',
        device_id: 'dev-456',
        device_name: 'Test-Device',
        status: 'quarantined',
      },
    ];

    it('should get threat details', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockThreats,
      } as Response);

      const result = await getThreatDetails(client, {});

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should handle threats with missing optional fields', async () => {
      const incompleteThreats = [
        {
          id: 'threat-123',
          threat_name: 'Malware.Generic',
          classification: 'malware',
          device_id: 'dev-456',
          // Missing device_name, status, detection_date
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => incompleteThreats,
      } as Response);

      const result = await getThreatDetails(client, {});

      expect(result.success).toBe(true);
      expect(result.table?.rows[0].Device).toBe('N/A');
      expect(result.table?.rows[0].Status).toBe('N/A');
      expect(result.table?.rows[0]['Detection Date']).toBe('N/A');
    });

    it('should filter by classification (malware)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockThreats,
      } as Response);

      await getThreatDetails(client, { classification: 'malware' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('classification=malware'),
        expect.any(Object)
      );
    });

    it('should filter by classification (pup)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockThreats,
      } as Response);

      await getThreatDetails(client, { classification: 'pup' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('classification=pup'),
        expect.any(Object)
      );
    });

    it('should filter by status (quarantined)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockThreats,
      } as Response);

      await getThreatDetails(client, { status: 'quarantined' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=quarantined'),
        expect.any(Object)
      );
    });

    it('should filter by status (not_quarantined)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockThreats,
      } as Response);

      await getThreatDetails(client, { status: 'not_quarantined' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=not_quarantined'),
        expect.any(Object)
      );
    });

    it('should filter by status (released)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockThreats,
      } as Response);

      await getThreatDetails(client, { status: 'released' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=released'),
        expect.any(Object)
      );
    });

    it('should filter by device_id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockThreats,
      } as Response);

      await getThreatDetails(client, { device_id: 'dev-456' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('device_id=dev-456'),
        expect.any(Object)
      );
    });

    it('should respect limit parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockThreats,
      } as Response);

      await getThreatDetails(client, { limit: 500 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=500'),
        expect.any(Object)
      );
    });

    it('should handle authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Authentication failed' }),
      } as Response);

      const result = await getThreatDetails(client, {});

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('auth');
      expect(result.errors![0].recovery).toContain('Verify KANDJI_API_TOKEN in .env file');
    });

    it('should handle rate limit errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: 'Rate limit exceeded' }),
      } as Response);

      const result = await getThreatDetails(client, {});

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('rate_limit');
      expect(result.errors![0].recovery).toContain('Wait a moment and retry');
    });

    it('should handle server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        json: async () => ({ error: 'Server error' }),
      } as Response);

      const result = await getThreatDetails(client, {});

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('server');
      expect(result.errors![0].recovery).toContain('Check Kandji API status');
    });
  });
});
