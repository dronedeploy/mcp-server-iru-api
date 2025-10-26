/**
 * MCP Tool: list_affected_software
 * List software affected by a specific CVE
 */

import { KandjiClient } from '../utils/client.js';
import { MCPResponse, AffectedSoftware } from '../utils/types.js';

export async function listAffectedSoftware(
  client: KandjiClient,
  params: { cve_id: string; page?: number; size?: number }
): Promise<MCPResponse<{ results: AffectedSoftware[]; next?: string | null; count?: number }>> {
  const startTime = Date.now();

  try {
    const software = await client.listAffectedSoftware(params.cve_id, {
      page: params.page,
      size: params.size,
    });

    return {
      success: true,
      summary: `Found ${software.results.length} affected software package(s)`,
      table: {
        columns: ['Software Name', 'Version', 'Path', 'Device Count'],
        rows: software.results.map(s => ({
          'Software Name': s.name,
          Version: s.version || 'N/A',
          Path: s.path || 'N/A',
          'Device Count': s.device_count?.toString() || 'N/A',
        })),
      },
      data: software,
      metadata: {
        totalCount: software.results.length,
        elapsedMs: Date.now() - startTime,
        cached: false,
        source: 'Iru API',
      },
      suggestions: [
        'Use filters to narrow down results',
        'Check individual items for more details',
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    let category: 'validation' | 'auth' | 'rate_limit' | 'network' | 'server' = 'server';
    let recovery: string[] = ['Check Iru API status'];

    if (errorMessage.includes('Authentication')) {
      category = 'auth';
      recovery = ['Verify KANDJI_API_TOKEN in .env file', 'Regenerate API token in Iru settings'];
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
        source: 'Iru API',
      },
    };
  }
}
