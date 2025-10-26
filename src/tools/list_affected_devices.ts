/**
 * MCP Tool: list_affected_devices
 * List devices affected by a specific CVE
 */

import { KandjiClient } from '../utils/client.js';
import { MCPResponse, AffectedDevice } from '../utils/types.js';

export async function listAffectedDevices(
  client: KandjiClient,
  params: { cve_id: string; page?: number; size?: number }
): Promise<MCPResponse<{ results: AffectedDevice[]; next?: string | null; count?: number }>> {
  const startTime = Date.now();

  try {
    const devices = await client.listAffectedDevices(params.cve_id, {
      page: params.page,
      size: params.size,
    });

    return {
      success: true,
      summary: `Found ${devices.results.length} affected device(s)`,
      table: {
        columns: ['Device Name', 'Serial Number', 'OS Version', 'Software', 'Detection Date'],
        rows: devices.results.map(d => ({
          'Device Name': d.device_name,
          'Serial Number': d.device_serial_number || 'N/A',
          'OS Version': d.device_os_version || 'N/A',
          Software: d.software_name || 'N/A',
          'Detection Date': d.detection_datetime || 'N/A',
        })),
      },
      data: devices,
      metadata: {
        totalCount: devices.results.length,
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
