/**
 * Unit tests for list_vulnerabilities tool
 * Tests pagination, sorting, filtering, and response formatting
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { KandjiClient } from '../../src/utils/client.js';
import { listVulnerabilities } from '../../src/tools/list_vulnerabilities.js';

describe('listVulnerabilities', () => {
  let client: KandjiClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  const mockVulnerabilities = {
    results: [
      {
        cve_id: 'CVE-2024-12345',
        cve_description: 'Critical vulnerability in system component',
        cvss_score: 9.8,
        cvss_severity: 'CRITICAL',
        severity: 'critical',
        software: 'SystemLib',
        device_count: 15,
        age: 30,
        known_exploit: true,
        status: 'active',
        first_detection_date: '2024-01-01',
        cve_published_at: '2024-01-01T00:00:00Z',
        cve_link: 'https://nvd.nist.gov/vuln/detail/CVE-2024-12345',
      },
      {
        cve_id: 'CVE-2024-67890',
        cve_description: 'Medium severity vulnerability',
        cvss_score: 5.4,
        cvss_severity: 'MEDIUM',
        device_count: 8,
        known_exploit: false,
        status: 'patched',
      },
    ],
    next: null,
    previous: null,
    count: 2,
  };

  beforeEach(() => {
    client = new KandjiClient({
      apiToken: 'test-token',
      subdomain: 'test',
      region: 'us',
    });
    mockFetch.mockClear();
  });

  describe('Basic Functionality', () => {
    it('should list all vulnerabilities', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVulnerabilities,
      } as Response);

      const result = await listVulnerabilities(client, {});

      expect(result.success).toBe(true);
      expect(result.data?.results).toHaveLength(2);
      expect(result.summary).toContain('Found 2 vulnerability(ies)');
    });

    it('should handle empty results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], count: 0, next: null, previous: null }),
      } as Response);

      const result = await listVulnerabilities(client, {});

      expect(result.success).toBe(true);
      expect(result.data?.results).toHaveLength(0);
      expect(result.summary).toContain('Found 0 vulnerability(ies)');
    });

    it('should call correct API endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVulnerabilities,
      } as Response);

      await listVulnerabilities(client, {});

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/vulnerabilities'),
        expect.any(Object)
      );
    });
  });

  describe('Pagination Support', () => {
    it('should support page parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVulnerabilities,
      } as Response);

      await listVulnerabilities(client, { page: 2 });

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('page=2'), expect.any(Object));
    });

    it('should support size parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVulnerabilities,
      } as Response);

      await listVulnerabilities(client, { size: 50 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('size=50'),
        expect.any(Object)
      );
    });

    it('should support both page and size together', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVulnerabilities,
      } as Response);

      await listVulnerabilities(client, { page: 3, size: 25 });

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('page=3'), expect.any(Object));
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('size=25'),
        expect.any(Object)
      );
    });

    it('should validate max size limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVulnerabilities,
      } as Response);

      // Size param should be capped at 50 per API docs
      await listVulnerabilities(client, { size: 100 });

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Sorting Support', () => {
    it('should support sort_by parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVulnerabilities,
      } as Response);

      await listVulnerabilities(client, { sort_by: 'cvss_score' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('sort_by=cvss_score'),
        expect.any(Object)
      );
    });

    it('should support descending sort', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVulnerabilities,
      } as Response);

      await listVulnerabilities(client, { sort_by: '-cvss_score' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('sort_by=-cvss_score'),
        expect.any(Object)
      );
    });

    it('should support sorting by different fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVulnerabilities,
      } as Response);

      await listVulnerabilities(client, { sort_by: 'device_count' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('sort_by=device_count'),
        expect.any(Object)
      );
    });
  });

  describe('Filtering Support', () => {
    it('should support filter parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVulnerabilities,
      } as Response);

      const filter = JSON.stringify({ severity: 'critical' });
      await listVulnerabilities(client, { filter });

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle complex filter JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVulnerabilities,
      } as Response);

      const filter = JSON.stringify({
        severity: 'critical',
        known_exploit: true,
        device_count: { $gt: 10 },
      });

      await listVulnerabilities(client, { filter });

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Response Format', () => {
    it('should return valid MCP response envelope', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVulnerabilities,
      } as Response);

      const result = await listVulnerabilities(client, {});

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('table');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('suggestions');
    });

    it('should format table with correct columns', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVulnerabilities,
      } as Response);

      const result = await listVulnerabilities(client, {});

      expect(result.table?.columns).toEqual([
        'CVE ID',
        'Severity',
        'CVSS Score',
        'Device Count',
        'Status',
      ]);
    });

    it('should format table rows correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVulnerabilities,
      } as Response);

      const result = await listVulnerabilities(client, {});

      expect(result.table?.rows[0]).toEqual({
        'CVE ID': 'CVE-2024-12345',
        Severity: 'CRITICAL',
        'CVSS Score': '9.8',
        'Device Count': '15',
        Status: 'active',
      });
    });

    it('should handle missing severity field with fallback', async () => {
      const vulnWithoutCvssSeverity = {
        results: [
          {
            cve_id: 'CVE-2024-99999',
            severity: 'high',
            cvss_score: 7.5,
            device_count: 3,
          },
        ],
        count: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => vulnWithoutCvssSeverity,
      } as Response);

      const result = await listVulnerabilities(client, {});

      expect(result.table?.rows[0].Severity).toBe('high');
    });

    it('should handle missing fields with N/A', async () => {
      const vulnMissingFields = {
        results: [
          {
            cve_id: 'CVE-2024-88888',
          },
        ],
        count: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => vulnMissingFields,
      } as Response);

      const result = await listVulnerabilities(client, {});

      expect(result.table?.rows[0].Severity).toBe('N/A');
      expect(result.table?.rows[0]['CVSS Score']).toBe('N/A');
      expect(result.table?.rows[0]['Device Count']).toBe('N/A');
      expect(result.table?.rows[0].Status).toBe('N/A');
    });

    it('should include helpful suggestions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVulnerabilities,
      } as Response);

      const result = await listVulnerabilities(client, {});

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
      expect(result.suggestions).toContain('Use filters to narrow down results');
    });

    it('should include metadata with elapsed time', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVulnerabilities,
      } as Response);

      const result = await listVulnerabilities(client, {});

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.elapsedMs).toBeDefined();
      expect(typeof result.metadata?.elapsedMs).toBe('number');
      expect(result.metadata?.source).toBe('Iru API');
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

      const result = await listVulnerabilities(client, {});

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

      const result = await listVulnerabilities(client, {});

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

      const result = await listVulnerabilities(client, {});

      expect(result.success).toBe(false);
      expect(result.errors![0].category).toBe('server');
      expect(result.errors![0].recovery.some(r => r.includes('Iru API status'))).toBe(true);
    });

    it('should include metadata in error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      } as Response);

      const result = await listVulnerabilities(client, {});

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.elapsedMs).toBeDefined();
      expect(result.metadata?.cached).toBe(false);
      expect(result.metadata?.source).toBe('Iru API');
    });
  });

  describe('Data Validation', () => {
    it('should handle vulnerabilities with high CVSS scores', async () => {
      const highSeverityVuln = {
        results: [
          {
            cve_id: 'CVE-2024-CRITICAL',
            cvss_score: 10.0,
            cvss_severity: 'CRITICAL',
            device_count: 100,
          },
        ],
        count: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => highSeverityVuln,
      } as Response);

      const result = await listVulnerabilities(client, {});

      expect(result.table?.rows[0]['CVSS Score']).toBe('10');
    });

    it('should handle vulnerabilities with low CVSS scores', async () => {
      const lowSeverityVuln = {
        results: [
          {
            cve_id: 'CVE-2024-LOW',
            cvss_score: 1.5,
            cvss_severity: 'LOW',
            device_count: 2,
          },
        ],
        count: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => lowSeverityVuln,
      } as Response);

      const result = await listVulnerabilities(client, {});

      expect(result.table?.rows[0]['CVSS Score']).toBe('1.5');
      expect(result.table?.rows[0].Severity).toBe('LOW');
    });

    it('should handle zero device count', async () => {
      const zeroDeviceVuln = {
        results: [
          {
            cve_id: 'CVE-2024-ZERO',
            device_count: 0,
          },
        ],
        count: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => zeroDeviceVuln,
      } as Response);

      const result = await listVulnerabilities(client, {});

      expect(result.table?.rows[0]['Device Count']).toBe('0');
    });

    it('should handle large device counts', async () => {
      const largeDeviceCount = {
        results: [
          {
            cve_id: 'CVE-2024-WIDESPREAD',
            device_count: 10000,
            cvss_severity: 'HIGH',
          },
        ],
        count: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => largeDeviceCount,
      } as Response);

      const result = await listVulnerabilities(client, {});

      expect(result.table?.rows[0]['Device Count']).toBe('10000');
    });
  });

  describe('Pagination Information', () => {
    it('should handle next page indicator', async () => {
      const paginatedResponse = {
        ...mockVulnerabilities,
        next: 'cursor_token_123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => paginatedResponse,
      } as Response);

      const result = await listVulnerabilities(client, {});

      expect(result.success).toBe(true);
      expect(result.data?.next).toBe('cursor_token_123');
    });

    it('should handle previous page indicator', async () => {
      const paginatedResponse = {
        ...mockVulnerabilities,
        previous: 'cursor_token_456',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => paginatedResponse,
      } as Response);

      const result = await listVulnerabilities(client, {});

      expect(result.data?.previous).toBe('cursor_token_456');
    });

    it('should handle total count', async () => {
      const countedResponse = {
        ...mockVulnerabilities,
        count: 250,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => countedResponse,
      } as Response);

      const result = await listVulnerabilities(client, {});

      expect(result.data?.count).toBe(250);
    });
  });
});
