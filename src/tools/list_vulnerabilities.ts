/**
 * MCP Tool: list_vulnerabilities
 * List all vulnerabilities grouped by CVE
 */

import { KandjiClient } from '../utils/client.js';
import { MCPResponse, VulnerabilityListResponse } from '../utils/types.js';

export async function listVulnerabilities(
  client: KandjiClient,
  params: { page?: number; size?: number; sort_by?: string; filter?: string }
): Promise<MCPResponse<VulnerabilityListResponse>> {
  const startTime = Date.now();

  try {
    const vulnerabilities = await client.listVulnerabilities(params);

    return {
      success: true,
      summary: `Found ${vulnerabilities.results.length} vulnerability(ies)`,
      table: {
        columns: ['CVE ID', 'Severity', 'CVSS Score', 'Device Count', 'Status'],
        rows: vulnerabilities.results.map((v: any) => ({
          'CVE ID': v.cve_id,
          Severity: v.cvss_severity || v.severity || 'N/A',
          'CVSS Score': v.cvss_score?.toString() || 'N/A',
          'Device Count': v.device_count?.toString() || 'N/A',
          Status: v.status || 'N/A',
        })),
      },
      data: vulnerabilities,
      metadata: {
        totalCount: 1,
        elapsedMs: Date.now() - startTime,
        cached: false,
        source: 'Kandji API',
      },
      suggestions: [
        'Use filters to narrow down results',
        'Check individual items for more details',
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    let category: 'validation' | 'auth' | 'rate_limit' | 'network' | 'server' = 'server';
    let recovery: string[] = ['Check Kandji API status'];

    if (errorMessage.includes('Authentication')) {
      category = 'auth';
      recovery = [
        'Verify KANDJI_API_TOKEN in .env file',
        'Regenerate API token in Kandji settings',
      ];
    } else if (errorMessage.includes('Rate limit')) {
      category = 'rate_limit';
      recovery = ['Wait a moment and retry', 'Reduce request frequency'];
    }

    return {
      success: false,
      errors: [
        {
          category,
          message: errorMessage,
          recovery,
        },
      ],
      metadata: {
        elapsedMs: Date.now() - startTime,
        cached: false,
        source: 'Kandji API',
      },
    };
  }
}
